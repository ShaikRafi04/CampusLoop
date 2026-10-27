import * as bookingService from '../services/bookingService.js';
import { sendSuccess } from '../utils/response.js';

export const requestBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.requestBooking(req.user._id, req.body);
    return sendSuccess(res, 201, 'Booking requested successfully', { booking });
  } catch (err) {
    next(err);
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const { role = 'learner', status, page = 1, limit = 12 } = req.query;
    const result = await bookingService.getMyBookings(req.user._id, role, status, page, limit);
    return sendSuccess(res, 200, 'Bookings retrieved', result.bookings, result.meta);
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id, req.user._id, req.user.role);
    return sendSuccess(res, 200, 'Booking details retrieved', { booking });
  } catch (err) {
    next(err);
  }
};

export const accept = async (req, res, next) => {
  try {
    const booking = await bookingService.acceptBooking(req.params.id, req.user._id);
    return sendSuccess(res, 200, 'Booking accepted and credits reserved', { booking });
  } catch (err) {
    next(err);
  }
};

export const reject = async (req, res, next) => {
  try {
    const booking = await bookingService.rejectBooking(req.params.id, req.user._id);
    return sendSuccess(res, 200, 'Booking rejected', { booking });
  } catch (err) {
    next(err);
  }
};

export const cancel = async (req, res, next) => {
  try {
    const { reason = '' } = req.body;
    const booking = await bookingService.cancelBooking(req.params.id, req.user._id, reason);
    return sendSuccess(res, 200, 'Booking cancelled per policy', { booking });
  } catch (err) {
    next(err);
  }
};

export const complete = async (req, res, next) => {
  try {
    const booking = await bookingService.requestCompletion(req.params.id, req.user._id);
    return sendSuccess(res, 200, 'Session completion requested from learner', { booking });
  } catch (err) {
    next(err);
  }
};

export const confirm = async (req, res, next) => {
  try {
    const booking = await bookingService.confirmCompletion(req.params.id, req.user._id);
    return sendSuccess(res, 200, 'Session completion confirmed; credits settled', { booking });
  } catch (err) {
    next(err);
  }
};
