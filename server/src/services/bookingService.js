import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import { Skill } from '../models/Skill.js';
import { User } from '../models/User.js';
import { CreditTransaction } from '../models/CreditTransaction.js';
import {
  BOOKING_STATUS,
  TRANSACTION_TYPES,
  TRANSACTION_DIRECTIONS,
  TRANSACTION_STATUS,
} from '../config/enums.js';
import { AppError } from '../utils/AppError.js';

/**
 * Execute an async function inside a MongoDB transaction with automatic WriteConflict retries
 */
export const runInTransaction = async (workFn, maxRetries = 5) => {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let session;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (sessionErr) {
      // Fallback if environment doesn't support sessions
      return await workFn(null);
    }

    try {
      const result = await workFn(session);
      await session.commitTransaction();
      session.endSession();
      return result;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();

      const isTransient =
        err.hasErrorLabel?.('TransientTransactionError') ||
        err.message?.includes('WriteConflict') ||
        err.code === 112;

      if (isTransient && attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 25 * (attempt + 1)));
        continue;
      }
      lastError = err;
      break;
    }
  }
  throw lastError;
};

export const requestBooking = async (learnerId, bookingData) => {
  const { skillId, scheduledStart: startIso, learningObjective, message } = bookingData;

  const learner = await User.findById(learnerId);
  if (!learner) throw new AppError('Learner not found', 404, 'NOT_FOUND');
  if (learner.isSuspended) throw new AppError('Your account is suspended', 403, 'ACCOUNT_SUSPENDED');

  const skill = await Skill.findById(skillId);
  if (!skill || !skill.isActive) {
    throw new AppError('Skill offering not found or inactive', 404, 'NOT_FOUND');
  }

  // Learner cannot book their own offering
  if (skill.ownerId.toString() === learnerId.toString()) {
    throw new AppError('You cannot book a session for your own offering', 422, 'BUSINESS_RULE_VIOLATION');
  }

  const mentorId = skill.ownerId;
  const cost = skill.creditCost;
  const durationMinutes = skill.durationMinutes;

  // Soft check: learner must have enough available credits
  if (learner.wallet.available < cost) {
    throw new AppError('Insufficient credits for this session', 422, 'INSUFFICIENT_CREDITS');
  }

  const scheduledStart = new Date(startIso);
  const now = new Date();
  const minNoticeMs = 2 * 60 * 60 * 1000;

  if (scheduledStart.getTime() < now.getTime() + minNoticeMs) {
    throw new AppError('Bookings must be scheduled at least 2 hours in advance', 400, 'VALIDATION_ERROR');
  }

  // 30-minute boundary check
  const minutes = scheduledStart.getUTCMinutes();
  const seconds = scheduledStart.getUTCSeconds();
  if ((minutes !== 0 && minutes !== 30) || seconds !== 0) {
    throw new AppError('Booking start time must fall on a 30-minute boundary (:00 or :30)', 400, 'VALIDATION_ERROR');
  }

  const scheduledEnd = new Date(scheduledStart.getTime() + durationMinutes * 60 * 1000);

  // Duplicate check: same learner, same skill, same start in PENDING or ACCEPTED
  const duplicate = await Booking.findOne({
    learnerId,
    skillId,
    scheduledStart,
    status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.ACCEPTED] },
  });
  if (duplicate) {
    throw new AppError('You already have an active booking for this skill and time', 409, 'DUPLICATE_BOOKING');
  }

  // Learner overlap check
  const learnerOverlap = await Booking.findOne({
    learnerId,
    status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.DISPUTED] },
    scheduledStart: { $lt: scheduledEnd },
    scheduledEnd: { $gt: scheduledStart },
  });
  if (learnerOverlap) {
    throw new AppError('You have another overlapping session scheduled during this time', 409, 'BOOKING_OVERLAP');
  }

  // Mentor overlap check
  const mentorOverlap = await Booking.findOne({
    mentorId,
    status: { $in: [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.DISPUTED] },
    scheduledStart: { $lt: scheduledEnd },
    scheduledEnd: { $gt: scheduledStart },
  });
  if (mentorOverlap) {
    throw new AppError('The mentor is already booked for an accepted session during this time', 409, 'BOOKING_OVERLAP');
  }

  const booking = new Booking({
    learnerId,
    mentorId,
    skillId,
    scheduledStart,
    scheduledEnd,
    status: BOOKING_STATUS.PENDING,
    learningObjective,
    message: message || '',
    creditCost: cost,
    durationMinutes,
    skillTitle: skill.title,
    statusHistory: [
      {
        from: 'NONE',
        to: BOOKING_STATUS.PENDING,
        actorId: learnerId,
        at: new Date(),
        note: 'Booking requested by learner',
      },
    ],
  });

  await booking.save();
  return booking;
};

export const acceptBooking = async (bookingId, mentorId) => {
  return await runInTransaction(async (session) => {
    // 1. Lock mentor scheduleVersion
    await User.updateOne(
      { _id: mentorId },
      { $inc: { scheduleVersion: 1 } },
      session ? { session } : {}
    );

    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      throw new AppError('Booking not found', 404, 'NOT_FOUND');
    }

    if (booking.mentorId.toString() !== mentorId.toString()) {
      throw new AppError('Only the mentor can accept this booking', 403, 'FORBIDDEN');
    }

    if (booking.status !== BOOKING_STATUS.PENDING) {
      throw new AppError('Booking is not in PENDING status', 409, 'INVALID_STATE_TRANSITION');
    }

    // 2. Overlap check against ACCEPTED / DISPUTED bookings
    const overlap = await Booking.findOne({
      _id: { $ne: bookingId },
      mentorId,
      status: { $in: [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.DISPUTED] },
      scheduledStart: { $lt: booking.scheduledEnd },
      scheduledEnd: { $gt: booking.scheduledStart },
    }).session(session);

    if (overlap) {
      throw new AppError('Cannot accept: overlapping booking exists', 409, 'BOOKING_OVERLAP');
    }

    // 3. Reserve learner credits atomically (PRD 5.3)
    const cost = booking.creditCost;
    const res = await User.updateOne(
      {
        _id: booking.learnerId,
        'wallet.available': { $gte: cost },
        isSuspended: false,
      },
      {
        $inc: {
          'wallet.available': -cost,
          'wallet.reserved': cost,
        },
      },
      session ? { session } : {}
    );

    if (res.matchedCount === 0) {
      throw new AppError('Learner has insufficient available credits', 422, 'INSUFFICIENT_CREDITS');
    }

    // Fetch updated learner balance
    const updatedLearner = await User.findById(booking.learnerId).session(session);

    // 4. Record RESERVATION transaction in ledger
    const reservationTx = new CreditTransaction({
      userId: booking.learnerId,
      bookingId: booking._id,
      type: TRANSACTION_TYPES.RESERVATION,
      direction: TRANSACTION_DIRECTIONS.DEBIT,
      amount: cost,
      balanceAfter: {
        available: updatedLearner.wallet.available,
        reserved: updatedLearner.wallet.reserved,
      },
      status: TRANSACTION_STATUS.COMPLETED,
      idempotencyKey: `reserve:${booking._id}`,
      description: `Credits reserved for session: ${booking.skillTitle}`,
    });

    await reservationTx.save(session ? { session } : {});

    // 5. Update booking status conditionally
    const updateResult = await Booking.updateOne(
      { _id: bookingId, status: BOOKING_STATUS.PENDING },
      {
        $set: { status: BOOKING_STATUS.ACCEPTED },
        $push: {
          statusHistory: {
            from: BOOKING_STATUS.PENDING,
            to: BOOKING_STATUS.ACCEPTED,
            actorId: mentorId,
            at: new Date(),
            note: 'Booking accepted by mentor',
          },
        },
      },
      session ? { session } : {}
    );

    if (updateResult.matchedCount === 0) {
      throw new AppError('Concurrent state change detected', 409, 'INVALID_STATE_TRANSITION');
    }

    return await Booking.findById(bookingId).session(session);
  });
};

export const rejectBooking = async (bookingId, mentorId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError('Booking not found', 404, 'NOT_FOUND');

  if (booking.mentorId.toString() !== mentorId.toString()) {
    throw new AppError('Only the mentor can reject this booking', 403, 'FORBIDDEN');
  }

  const res = await Booking.updateOne(
    { _id: bookingId, status: BOOKING_STATUS.PENDING },
    {
      $set: { status: BOOKING_STATUS.REJECTED },
      $push: {
        statusHistory: {
          from: BOOKING_STATUS.PENDING,
          to: BOOKING_STATUS.REJECTED,
          actorId: mentorId,
          at: new Date(),
          note: 'Booking rejected by mentor',
        },
      },
    }
  );

  if (res.matchedCount === 0) {
    throw new AppError('Cannot reject: booking is no longer pending', 409, 'INVALID_STATE_TRANSITION');
  }

  return await Booking.findById(bookingId);
};

export const cancelBooking = async (bookingId, actorId, reason = '') => {
  return await runInTransaction(async (session) => {
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) throw new AppError('Booking not found', 404, 'NOT_FOUND');

    const isLearner = booking.learnerId.toString() === actorId.toString();
    const isMentor = booking.mentorId.toString() === actorId.toString();

    if (!isLearner && !isMentor) {
      throw new AppError('Only session participants can cancel this booking', 403, 'FORBIDDEN');
    }

    if (booking.status === BOOKING_STATUS.COMPLETED || booking.status === BOOKING_STATUS.DISPUTED) {
      throw new AppError('Cannot cancel a completed or disputed session', 409, 'INVALID_STATE_TRANSITION');
    }

    const now = new Date();
    if (now >= booking.scheduledStart) {
      throw new AppError('Cannot cancel after session start time. Please use dispute flow.', 422, 'BUSINESS_RULE_VIOLATION');
    }

    const oldStatus = booking.status;
    const cost = booking.creditCost;

    if (oldStatus === BOOKING_STATUS.ACCEPTED) {
      const msBeforeStart = booking.scheduledStart.getTime() - now.getTime();
      const isOver24Hours = msBeforeStart >= 24 * 60 * 60 * 1000;

      if (isLearner && isOver24Hours) {
        await User.updateOne(
          { _id: booking.learnerId },
          { $inc: { 'wallet.reserved': -cost, 'wallet.available': cost } },
          session ? { session } : {}
        );
        const u = await User.findById(booking.learnerId).session(session);
        await new CreditTransaction({
          userId: booking.learnerId,
          bookingId: booking._id,
          type: TRANSACTION_TYPES.RELEASE,
          direction: TRANSACTION_DIRECTIONS.CREDIT,
          amount: cost,
          balanceAfter: { available: u.wallet.available, reserved: u.wallet.reserved },
          status: TRANSACTION_STATUS.COMPLETED,
          idempotencyKey: `release:${booking._id}`,
          description: 'Credits released after timely cancellation',
        }).save(session ? { session } : {});
      } else if (isLearner && !isOver24Hours) {
        await User.updateOne(
          { _id: booking.learnerId },
          { $inc: { 'wallet.reserved': -cost } },
          session ? { session } : {}
        );
        await User.updateOne(
          { _id: booking.mentorId },
          { $inc: { 'wallet.available': cost } },
          session ? { session } : {}
        );
        const m = await User.findById(booking.mentorId).session(session);
        await new CreditTransaction({
          userId: booking.mentorId,
          bookingId: booking._id,
          type: TRANSACTION_TYPES.SESSION_REWARD,
          direction: TRANSACTION_DIRECTIONS.CREDIT,
          amount: cost,
          balanceAfter: { available: m.wallet.available, reserved: m.wallet.reserved },
          status: TRANSACTION_STATUS.COMPLETED,
          idempotencyKey: `late-cancel:${booking._id}`,
          description: 'Late cancellation compensation',
        }).save(session ? { session } : {});
      } else if (isMentor) {
        await User.updateOne(
          { _id: booking.learnerId },
          { $inc: { 'wallet.reserved': -cost, 'wallet.available': cost } },
          session ? { session } : {}
        );
        await User.updateOne(
          { _id: booking.mentorId },
          { $inc: { mentorCancellations: 1 } },
          session ? { session } : {}
        );
        const u = await User.findById(booking.learnerId).session(session);
        await new CreditTransaction({
          userId: booking.learnerId,
          bookingId: booking._id,
          type: TRANSACTION_TYPES.RELEASE,
          direction: TRANSACTION_DIRECTIONS.CREDIT,
          amount: cost,
          balanceAfter: { available: u.wallet.available, reserved: u.wallet.reserved },
          status: TRANSACTION_STATUS.COMPLETED,
          idempotencyKey: `release:${booking._id}`,
          description: 'Credits released after mentor cancellation',
        }).save(session ? { session } : {});
      }
    }

    booking.status = BOOKING_STATUS.CANCELLED;
    booking.cancelledBy = actorId;
    booking.cancellationReason = reason;
    booking.cancelledAt = now;
    booking.statusHistory.push({
      from: oldStatus,
      to: BOOKING_STATUS.CANCELLED,
      actorId,
      at: now,
      note: reason || 'Booking cancelled',
    });

    await booking.save(session ? { session } : {});
    return booking;
  });
};

export const requestCompletion = async (bookingId, mentorId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError('Booking not found', 404, 'NOT_FOUND');

  if (booking.mentorId.toString() !== mentorId.toString()) {
    throw new AppError('Only the mentor can request completion', 403, 'FORBIDDEN');
  }

  if (booking.status !== BOOKING_STATUS.ACCEPTED) {
    throw new AppError('Booking is not accepted', 409, 'INVALID_STATE_TRANSITION');
  }

  const now = new Date();
  if (now < booking.scheduledEnd) {
    throw new AppError('Session completion can only be requested after scheduled end time', 422, 'BUSINESS_RULE_VIOLATION');
  }

  booking.completionRequestedAt = now;
  booking.statusHistory.push({
    from: BOOKING_STATUS.ACCEPTED,
    to: BOOKING_STATUS.ACCEPTED,
    actorId: mentorId,
    at: now,
    note: 'Mentor requested session completion confirmation',
  });

  await booking.save();
  return booking;
};

export const confirmCompletion = async (bookingId, learnerId) => {
  return await runInTransaction(async (session) => {
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) throw new AppError('Booking not found', 404, 'NOT_FOUND');

    if (booking.learnerId.toString() !== learnerId.toString()) {
      throw new AppError('Only the learner can confirm session completion', 403, 'FORBIDDEN');
    }

    // Idempotent: if already COMPLETED, return immediately per PRD 5.5
    if (booking.status === BOOKING_STATUS.COMPLETED) {
      return booking;
    }

    if (booking.status !== BOOKING_STATUS.ACCEPTED || !booking.completionRequestedAt) {
      throw new AppError('Session completion has not been requested by mentor', 409, 'INVALID_STATE_TRANSITION');
    }

    const cost = booking.creditCost;
    const now = new Date();

    // 1. Learner: wallet.reserved -= cost
    await User.updateOne(
      { _id: booking.learnerId },
      {
        $inc: {
          'wallet.reserved': -cost,
          completedSessionsAsLearner: 1,
        },
      },
      session ? { session } : {}
    );

    const learner = await User.findById(booking.learnerId).session(session);

    // 2. Insert SESSION_SETTLEMENT for learner with idempotency check
    try {
      await new CreditTransaction({
        userId: booking.learnerId,
        bookingId: booking._id,
        type: TRANSACTION_TYPES.SESSION_SETTLEMENT,
        direction: TRANSACTION_DIRECTIONS.DEBIT,
        amount: cost,
        balanceAfter: { available: learner.wallet.available, reserved: learner.wallet.reserved },
        status: TRANSACTION_STATUS.COMPLETED,
        idempotencyKey: `settle-learner:${booking._id}`,
        description: `Settled session: ${booking.skillTitle}`,
      }).save(session ? { session } : {});
    } catch (txErr) {
      if (txErr.code === 11000) {
        // Idempotency: operation already applied
        return await Booking.findById(bookingId).session(session);
      }
      throw txErr;
    }

    // 3. Mentor: wallet.available += cost
    await User.updateOne(
      { _id: booking.mentorId },
      {
        $inc: {
          'wallet.available': cost,
          completedSessionsAsMentor: 1,
        },
      },
      session ? { session } : {}
    );

    const mentor = await User.findById(booking.mentorId).session(session);

    // 4. Insert SESSION_REWARD for mentor with idempotency check
    try {
      await new CreditTransaction({
        userId: booking.mentorId,
        bookingId: booking._id,
        type: TRANSACTION_TYPES.SESSION_REWARD,
        direction: TRANSACTION_DIRECTIONS.CREDIT,
        amount: cost,
        balanceAfter: { available: mentor.wallet.available, reserved: mentor.wallet.reserved },
        status: TRANSACTION_STATUS.COMPLETED,
        idempotencyKey: `settle-mentor:${booking._id}`,
        description: `Reward for mentoring: ${booking.skillTitle}`,
      }).save(session ? { session } : {});
    } catch (txErr) {
      if (txErr.code === 11000) {
        return await Booking.findById(bookingId).session(session);
      }
      throw txErr;
    }

    // 5. Update booking to COMPLETED
    booking.status = BOOKING_STATUS.COMPLETED;
    booking.completedAt = now;
    booking.statusHistory.push({
      from: BOOKING_STATUS.ACCEPTED,
      to: BOOKING_STATUS.COMPLETED,
      actorId: learnerId,
      at: now,
      note: 'Learner confirmed completion; credits settled',
    });

    await booking.save(session ? { session } : {});
    return booking;
  });
};

export const getMyBookings = async (userId, role = 'learner', status = null, page = 1, limit = 12) => {
  const filter = {};
  if (role === 'mentor') {
    filter.mentorId = userId;
  } else {
    filter.learnerId = userId;
  }

  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('learnerId', 'name profileImage college department')
      .populate('mentorId', 'name profileImage college department ratingSummary')
      .populate('skillId', 'title category format meetingLink')
      .sort({ scheduledStart: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getBookingById = async (bookingId, userId, userRole) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new AppError('Invalid booking ID', 400, 'VALIDATION_ERROR');
  }

  const booking = await Booking.findById(bookingId)
    .populate('learnerId', 'name profileImage college department email')
    .populate('mentorId', 'name profileImage college department ratingSummary email')
    .populate('skillId', 'title category description durationMinutes format meetingLink');

  if (!booking) throw new AppError('Booking not found', 404, 'NOT_FOUND');

  const isLearner = booking.learnerId._id.toString() === userId.toString();
  const isMentor = booking.mentorId._id.toString() === userId.toString();
  const isAdmin = userRole === 'ADMIN';

  if (!isLearner && !isMentor && !isAdmin) {
    throw new AppError('Not authorized to access this booking', 403, 'FORBIDDEN');
  }

  return booking;
};

export const autoConfirmExpiredBookings = async (cutoffHours = 72) => {
  const cutoffDate = new Date(Date.now() - cutoffHours * 60 * 60 * 1000);
  const eligibleBookings = await Booking.find({
    status: BOOKING_STATUS.ACCEPTED,
    completionRequestedAt: { $exists: true, $lte: cutoffDate },
  });

  const results = { processed: 0, settled: 0, errors: [] };

  for (const b of eligibleBookings) {
    results.processed += 1;
    try {
      await runInTransaction(async (session) => {
        const booking = await Booking.findById(b._id).session(session);
        if (!booking || booking.status !== BOOKING_STATUS.ACCEPTED) return;

        const cost = booking.creditCost;
        const now = new Date();

        // 1. Learner reserved -= cost
        await User.updateOne(
          { _id: booking.learnerId },
          {
            $inc: {
              'wallet.reserved': -cost,
              completedSessionsAsLearner: 1,
            },
          },
          session ? { session } : {}
        );

        const learner = await User.findById(booking.learnerId).session(session);

        // 2. Transaction for learner
        try {
          await new CreditTransaction({
            userId: booking.learnerId,
            bookingId: booking._id,
            type: TRANSACTION_TYPES.SESSION_SETTLEMENT,
            direction: TRANSACTION_DIRECTIONS.DEBIT,
            amount: cost,
            balanceAfter: { available: learner.wallet.available, reserved: learner.wallet.reserved },
            status: TRANSACTION_STATUS.COMPLETED,
            idempotencyKey: `settle-learner:${booking._id}`,
            description: `Auto-confirmed session: ${booking.skillTitle}`,
          }).save(session ? { session } : {});
        } catch (txErr) {
          if (txErr.code !== 11000) throw txErr;
        }

        // 3. Mentor available += cost
        await User.updateOne(
          { _id: booking.mentorId },
          {
            $inc: {
              'wallet.available': cost,
              completedSessionsAsMentor: 1,
            },
          },
          session ? { session } : {}
        );

        const mentor = await User.findById(booking.mentorId).session(session);

        // 4. Transaction for mentor
        try {
          await new CreditTransaction({
            userId: booking.mentorId,
            bookingId: booking._id,
            type: TRANSACTION_TYPES.SESSION_REWARD,
            direction: TRANSACTION_DIRECTIONS.CREDIT,
            amount: cost,
            balanceAfter: { available: mentor.wallet.available, reserved: mentor.wallet.reserved },
            status: TRANSACTION_STATUS.COMPLETED,
            idempotencyKey: `settle-mentor:${booking._id}`,
            description: `Auto-confirmed reward: ${booking.skillTitle}`,
          }).save(session ? { session } : {});
        } catch (txErr) {
          if (txErr.code !== 11000) throw txErr;
        }

        // 5. Update booking to COMPLETED
        booking.status = BOOKING_STATUS.COMPLETED;
        booking.completedAt = now;
        booking.statusHistory.push({
          from: BOOKING_STATUS.ACCEPTED,
          to: BOOKING_STATUS.COMPLETED,
          actorId: null,
          at: now,
          note: `Auto-confirmed by system after ${cutoffHours}h inactivity without dispute`,
        });

        await booking.save(session ? { session } : {});
      });
      results.settled += 1;
    } catch (err) {
      results.errors.push({ bookingId: b._id, error: err.message });
    }
  }

  return results;
};

