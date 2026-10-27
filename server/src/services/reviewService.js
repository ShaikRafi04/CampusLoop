import mongoose from 'mongoose';
import { Review } from '../models/Review.js';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import { Skill } from '../models/Skill.js';
import { AppError } from '../utils/AppError.js';
import { BOOKING_STATUS } from '../config/enums.js';

export const createReview = async (reviewerId, { bookingId, rating, comment = '' }) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new AppError('Invalid booking ID', 400, 'VALIDATION_ERROR');
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError('Booking not found', 404, 'NOT_FOUND');

  // Must be COMPLETED
  if (booking.status !== BOOKING_STATUS.COMPLETED) {
    throw new AppError('Reviews are only allowed after a session is completed', 422, 'BUSINESS_RULE_VIOLATION');
  }

  const isLearner = booking.learnerId.toString() === reviewerId.toString();
  const isMentor = booking.mentorId.toString() === reviewerId.toString();

  if (!isLearner && !isMentor) {
    throw new AppError('Only participants of this completed session can leave a review', 403, 'FORBIDDEN');
  }

  const revieweeId = isLearner ? booking.mentorId : booking.learnerId;

  // Check duplicate review
  const existing = await Review.findOne({ bookingId, reviewerId });
  if (existing) {
    throw new AppError('You have already submitted a review for this session', 409, 'DUPLICATE_REVIEW');
  }

  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err) {
    session = null;
  }

  try {
    const review = new Review({
      bookingId,
      reviewerId,
      revieweeId,
      rating,
      comment,
    });

    await review.save(session ? { session } : {});

    // Recalculate reviewee rating summary
    const reviews = await Review.find({ revieweeId, isHidden: false }).session(session);
    const count = reviews.length;
    const average = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

    await User.updateOne(
      { _id: revieweeId },
      { $set: { ratingSummary: { average: Math.round(average * 10) / 10, count } } },
      session ? { session } : {}
    );

    // If reviewee is the mentor, update skill cached ratingSummary as well
    if (isLearner) {
      const skillReviews = await Review.find({
        bookingId: { $in: await Booking.find({ skillId: booking.skillId, status: BOOKING_STATUS.COMPLETED }).distinct('_id') },
        revieweeId: booking.mentorId,
        isHidden: false,
      }).session(session);

      const skillCount = skillReviews.length;
      const skillAvg = skillCount > 0 ? skillReviews.reduce((sum, r) => sum + r.rating, 0) / skillCount : 0;

      await Skill.updateOne(
        { _id: booking.skillId },
        { $set: { ratingSummary: { average: Math.round(skillAvg * 10) / 10, count: skillCount } } },
        session ? { session } : {}
      );
    }

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    return review;
  } catch (err) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    if (err.code === 11000) {
      throw new AppError('Duplicate review for this session', 409, 'DUPLICATE_REVIEW');
    }
    throw err;
  }
};

export const getReviewsByUserId = async (userId, page = 1, limit = 10) => {
  const filter = { revieweeId: userId, isHidden: false };
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('reviewerId', 'name profileImage college')
      .populate('bookingId', 'skillTitle')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments(filter),
  ]);

  return {
    reviews,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};
