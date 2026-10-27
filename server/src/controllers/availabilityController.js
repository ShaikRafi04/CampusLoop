import * as availabilityService from '../services/availabilityService.js';
import { sendSuccess } from '../utils/response.js';

export const getMyAvailability = async (req, res, next) => {
  try {
    const windows = await availabilityService.getAvailabilityByMentorId(req.user._id);
    return sendSuccess(res, 200, 'Mentor availability retrieved', { windows });
  } catch (err) {
    next(err);
  }
};

export const getMentorAvailability = async (req, res, next) => {
  try {
    const windows = await availabilityService.getAvailabilityByMentorId(req.params.mentorId);
    return sendSuccess(res, 200, 'Mentor availability retrieved', { windows });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const window = await availabilityService.createAvailabilityWindow(req.user._id, req.body);
    return sendSuccess(res, 201, 'Availability window created', { window });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const window = await availabilityService.updateAvailabilityWindow(req.params.id, req.user._id, req.body);
    return sendSuccess(res, 200, 'Availability window updated', { window });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await availabilityService.deleteAvailabilityWindow(req.params.id, req.user._id);
    return sendSuccess(res, 200, 'Availability window deleted');
  } catch (err) {
    next(err);
  }
};
