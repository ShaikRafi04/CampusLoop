import * as reviewService from '../services/reviewService.js';
import { sendSuccess } from '../utils/response.js';

export const create = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.user._id, req.body);
    return sendSuccess(res, 201, 'Review submitted successfully', { review });
  } catch (err) {
    next(err);
  }
};

export const getUserReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await reviewService.getReviewsByUserId(req.params.userId, page, limit);
    return sendSuccess(res, 200, 'Reviews retrieved', result.reviews, result.meta);
  } catch (err) {
    next(err);
  }
};
