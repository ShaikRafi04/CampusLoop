import mongoose from 'mongoose';
import { Availability } from '../models/Availability.js';
import { AppError } from '../utils/AppError.js';

export const getAvailabilityByMentorId = async (mentorId) => {
  if (!mongoose.Types.ObjectId.isValid(mentorId)) {
    throw new AppError('Invalid mentor ID', 400, 'VALIDATION_ERROR');
  }
  return await Availability.find({ mentorId }).sort({ type: 1, dayOfWeek: 1, date: 1, startTime: 1 });
};

export const createAvailabilityWindow = async (mentorId, data) => {
  const { type, dayOfWeek, date, startTime, endTime, isAvailable = true } = data;

  // Check overlap with existing window of the same type and day/date for this mentor
  const query = {
    mentorId,
    type,
    ...(type === 'WEEKLY' ? { dayOfWeek } : { date }),
    // Overlap condition: start < other.end && end > other.start
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  const existingOverlap = await Availability.findOne(query);
  if (existingOverlap) {
    throw new AppError('Availability window overlaps with an existing rule', 409, 'SLOT_UNAVAILABLE');
  }

  const window = new Availability({
    mentorId,
    type,
    dayOfWeek,
    date,
    startTime,
    endTime,
    isAvailable,
  });

  await window.save();
  return window;
};

export const updateAvailabilityWindow = async (windowId, mentorId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(windowId)) {
    throw new AppError('Invalid availability ID', 400, 'VALIDATION_ERROR');
  }

  const window = await Availability.findById(windowId);
  if (!window) {
    throw new AppError('Availability window not found', 404, 'NOT_FOUND');
  }

  if (window.mentorId.toString() !== mentorId.toString()) {
    throw new AppError('You do not own this availability rule', 403, 'FORBIDDEN');
  }

  Object.assign(window, updateData);
  await window.save();
  return window;
};

export const deleteAvailabilityWindow = async (windowId, mentorId) => {
  if (!mongoose.Types.ObjectId.isValid(windowId)) {
    throw new AppError('Invalid availability ID', 400, 'VALIDATION_ERROR');
  }

  const window = await Availability.findById(windowId);
  if (!window) {
    throw new AppError('Availability window not found', 404, 'NOT_FOUND');
  }

  if (window.mentorId.toString() !== mentorId.toString()) {
    throw new AppError('You do not own this availability rule', 403, 'FORBIDDEN');
  }

  await Availability.deleteOne({ _id: windowId });
};
