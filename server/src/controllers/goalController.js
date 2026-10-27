import * as goalService from '../services/goalService.js';
import { sendSuccess } from '../utils/response.js';

export const create = async (req, res, next) => {
  try {
    const goal = await goalService.createGoal(req.user._id, req.body);
    return sendSuccess(res, 201, 'Learning goal created', { goal });
  } catch (err) {
    next(err);
  }
};

export const getMyGoals = async (req, res, next) => {
  try {
    const goals = await goalService.getMyGoals(req.user._id);
    return sendSuccess(res, 200, 'Learning goals retrieved', { goals });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const goal = await goalService.updateGoal(req.params.id, req.user._id, req.body);
    return sendSuccess(res, 200, 'Learning goal updated', { goal });
  } catch (err) {
    next(err);
  }
};

export const cancel = async (req, res, next) => {
  try {
    const goal = await goalService.cancelGoal(req.params.id, req.user._id);
    return sendSuccess(res, 200, 'Learning goal cancelled', { goal });
  } catch (err) {
    next(err);
  }
};
