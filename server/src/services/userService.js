import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Skill } from '../models/Skill.js';
import { AppError } from '../utils/AppError.js';

export const getUserById = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid user ID', 400, 'VALIDATION_ERROR');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }
  return user;
};

export const getPublicProfile = async (userId) => {
  const user = await getUserById(userId);

  // Active offerings
  const offerings = await Skill.find({ ownerId: user._id, isActive: true }).select(
    'title category difficulty durationMinutes creditCost format ratingSummary tags'
  );

  return {
    _id: user._id,
    name: user.name,
    college: user.college,
    department: user.department,
    academicYear: user.academicYear,
    bio: user.bio,
    profileImage: user.profileImage,
    skillsWanted: user.skillsWanted,
    interests: user.interests,
    ratingSummary: user.ratingSummary,
    completedSessionsAsMentor: user.completedSessionsAsMentor,
    completedSessionsAsLearner: user.completedSessionsAsLearner,
    offerings,
  };
};

export const updateProfile = async (userId, updateData) => {
  const allowedFields = [
    'name',
    'bio',
    'college',
    'department',
    'academicYear',
    'timezone',
    'skillsWanted',
    'interests',
    'profileImage',
  ];

  const filteredUpdates = {};
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      filteredUpdates[field] = updateData[field];
    }
  }

  const user = await User.findByIdAndUpdate(userId, filteredUpdates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  // If user updated their name, sync denormalized mentorName on their offerings
  if (filteredUpdates.name) {
    await Skill.updateMany(
      { ownerId: user._id },
      { $set: { mentorName: filteredUpdates.name } }
    );
  }

  return user.toJSON();
};

export const calculateProfileCompletion = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const activeOfferingCount = await Skill.countDocuments({ ownerId: userId, isActive: true });

  const checklist = {
    name: Boolean(user.name && user.name.trim().length > 0),
    bio: Boolean(user.bio && user.bio.trim().length > 0),
    college: Boolean(user.college && user.college.trim().length > 0),
    department: Boolean(user.department && user.department.trim().length > 0),
    academicYear: Boolean(user.academicYear && user.academicYear >= 1),
    activeOffering: activeOfferingCount > 0,
    skillsWanted: Boolean(user.skillsWanted && user.skillsWanted.length > 0),
    profileImage: Boolean(user.profileImage && user.profileImage.trim().length > 0),
  };

  const totalFields = Object.keys(checklist).length;
  const completedFields = Object.values(checklist).filter(Boolean).length;
  const score = Math.round((completedFields / totalFields) * 100);

  return {
    score,
    checklist,
  };
};
