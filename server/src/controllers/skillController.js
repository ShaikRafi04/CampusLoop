import * as skillService from '../services/skillService.js';
import { sendSuccess } from '../utils/response.js';

export const create = async (req, res, next) => {
  try {
    const skill = await skillService.createSkill(req.user._id, req.user.name, req.body);
    return sendSuccess(res, 201, 'Skill offering created successfully', { skill });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const skill = await skillService.updateSkill(req.params.id, req.user._id, req.user.role, req.body);
    return sendSuccess(res, 200, 'Skill offering updated successfully', { skill });
  } catch (err) {
    next(err);
  }
};

export const deactivate = async (req, res, next) => {
  try {
    const skill = await skillService.deactivateSkill(req.params.id, req.user._id, req.user.role);
    return sendSuccess(res, 200, 'Skill offering deactivated successfully', { skill });
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const requestingUserId = req.user ? req.user._id : null;
    const skill = await skillService.getSkillById(req.params.id, requestingUserId);
    return sendSuccess(res, 200, 'Skill offering retrieved', { skill });
  } catch (err) {
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const result = await skillService.getSkills(req.query);
    return sendSuccess(res, 200, 'Skill offerings retrieved', result.skills, result.meta);
  } catch (err) {
    next(err);
  }
};

export const getCategories = (req, res) => {
  const categories = skillService.getCategories();
  return sendSuccess(res, 200, 'Skill categories retrieved', { categories });
};

export const getSlots = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const skill = await skillService.getSkillById(req.params.id);
    const { computeAvailableSlots } = await import('../services/slotService.js');
    const slots = await computeAvailableSlots(
      skill.ownerId._id || skill.ownerId,
      skill.durationMinutes,
      from,
      to
    );
    return sendSuccess(res, 200, 'Available slots calculated', { slots });
  } catch (err) {
    next(err);
  }
};

