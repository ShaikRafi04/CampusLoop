import mongoose from 'mongoose';
import { Goal } from '../models/Goal.js';
import { AppError } from '../utils/AppError.js';
import { GOAL_STATUS } from '../config/enums.js';

export const createGoal = async (userId, data) => {
  const goal = new Goal({
    ...data,
    userId,
    completedSessions: 0,
    status: GOAL_STATUS.IN_PROGRESS,
  });
  await goal.save();
  return goal;
};

export const getMyGoals = async (userId) => {
  return await Goal.find({ userId }).sort({ createdAt: -1 });
};

export const updateGoal = async (goalId, userId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(goalId)) {
    throw new AppError('Invalid goal ID', 400, 'VALIDATION_ERROR');
  }

  const goal = await Goal.findById(goalId);
  if (!goal) throw new AppError('Goal not found', 404, 'NOT_FOUND');

  if (goal.userId.toString() !== userId.toString()) {
    throw new AppError('You do not own this goal', 403, 'FORBIDDEN');
  }

  const allowedFields = ['title', 'description', 'targetSessions', 'deadline', 'status'];
  for (const f of allowedFields) {
    if (updateData[f] !== undefined) {
      goal[f] = updateData[f];
    }
  }

  // Auto-complete if target met
  if (goal.completedSessions >= goal.targetSessions) {
    goal.status = GOAL_STATUS.COMPLETED;
  }

  await goal.save();
  return goal;
};

export const cancelGoal = async (goalId, userId) => {
  return await updateGoal(goalId, userId, { status: GOAL_STATUS.CANCELLED });
};
