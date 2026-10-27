import * as userService from '../services/userService.js';
import { sendSuccess } from '../utils/response.js';

export const getMe = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user._id);
    return sendSuccess(res, 200, 'User profile retrieved', { user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const updated = await userService.updateProfile(req.user._id, req.body);
    return sendSuccess(res, 200, 'Profile updated successfully', { user: updated });
  } catch (err) {
    next(err);
  }
};

export const getPublicProfile = async (req, res, next) => {
  try {
    const profile = await userService.getPublicProfile(req.params.id);
    return sendSuccess(res, 200, 'Public profile retrieved', { profile });
  } catch (err) {
    next(err);
  }
};

export const getProfileCompletion = async (req, res, next) => {
  try {
    const data = await userService.calculateProfileCompletion(req.user._id);
    return sendSuccess(res, 200, 'Profile completion calculated', data);
  } catch (err) {
    next(err);
  }
};
