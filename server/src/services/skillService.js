import mongoose from 'mongoose';
import { Skill } from '../models/Skill.js';
import { AppError } from '../utils/AppError.js';
import { SKILL_CATEGORIES } from '../config/enums.js';

export const createSkill = async (userId, userName, skillData) => {
  const skill = new Skill({
    ...skillData,
    ownerId: userId,
    mentorName: userName,
  });
  await skill.save();
  return skill;
};

export const updateSkill = async (skillId, userId, userRole, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(skillId)) {
    throw new AppError('Invalid skill ID', 400, 'VALIDATION_ERROR');
  }

  const skill = await Skill.findById(skillId);
  if (!skill) {
    throw new AppError('Skill offering not found', 404, 'NOT_FOUND');
  }

  // Ownership check: only the owner or an ADMIN can update
  if (skill.ownerId.toString() !== userId.toString() && userRole !== 'ADMIN') {
    throw new AppError('You do not have permission to edit this offering', 403, 'FORBIDDEN');
  }

  Object.assign(skill, updateData);
  await skill.save();
  return skill;
};

export const deactivateSkill = async (skillId, userId, userRole) => {
  if (!mongoose.Types.ObjectId.isValid(skillId)) {
    throw new AppError('Invalid skill ID', 400, 'VALIDATION_ERROR');
  }

  const skill = await Skill.findById(skillId);
  if (!skill) {
    throw new AppError('Skill offering not found', 404, 'NOT_FOUND');
  }

  if (skill.ownerId.toString() !== userId.toString() && userRole !== 'ADMIN') {
    throw new AppError('You do not have permission to deactivate this offering', 403, 'FORBIDDEN');
  }

  skill.isActive = false;
  await skill.save();
  return skill;
};

export const getSkillById = async (skillId, requestingUserId = null) => {
  if (!mongoose.Types.ObjectId.isValid(skillId)) {
    throw new AppError('Invalid skill ID', 400, 'VALIDATION_ERROR');
  }

  const skill = await Skill.findById(skillId).populate(
    'ownerId',
    'name profileImage ratingSummary college department bio academicYear'
  );

  if (!skill) {
    throw new AppError('Skill offering not found', 404, 'NOT_FOUND');
  }

  const skillObj = skill.toJSON();

  // Hide meetingLink from non-owners (unless participant)
  const isOwner = requestingUserId && skill.ownerId._id.toString() === requestingUserId.toString();
  if (!isOwner) {
    delete skillObj.meetingLink;
  }

  return skillObj;
};

export const getSkills = async (queryParams) => {
  const {
    q,
    category,
    difficulty,
    format,
    minCredits,
    maxCredits,
    minRating,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = queryParams;

  const filter = { isActive: true };

  if (category) filter.category = category;
  if (difficulty) filter.difficulty = difficulty;
  if (format) filter.format = format;

  if (minCredits !== undefined || maxCredits !== undefined) {
    filter.creditCost = {};
    if (minCredits !== undefined) filter.creditCost.$gte = minCredits;
    if (maxCredits !== undefined) filter.creditCost.$lte = maxCredits;
  }

  if (minRating !== undefined) {
    filter['ratingSummary.average'] = { $gte: minRating };
  }

  if (q && q.trim()) {
    filter.$text = { $search: q.trim() };
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'cost_asc') sortOption = { creditCost: 1 };
  if (sort === 'rating_desc') sortOption = { 'ratingSummary.average': -1, createdAt: -1 };
  if (sort === 'experience_desc') sortOption = { experienceYears: -1 };

  const skip = (page - 1) * limit;

  const [skills, total] = await Promise.all([
    Skill.find(filter)
      .populate('ownerId', 'name profileImage ratingSummary college department')
      .sort(sortOption)
      .skip(skip)
      .limit(limit),
    Skill.countDocuments(filter),
  ]);

  // Strip meetingLink from browse results
  const sanitized = skills.map((s) => {
    const obj = s.toJSON();
    delete obj.meetingLink;
    return obj;
  });

  return {
    skills: sanitized,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getCategories = () => {
  return SKILL_CATEGORIES;
};
