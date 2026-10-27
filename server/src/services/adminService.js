import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Skill } from '../models/Skill.js';
import { Booking } from '../models/Booking.js';
import { CreditTransaction } from '../models/CreditTransaction.js';
import { Report } from '../models/Report.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';
import { runInTransaction } from './bookingService.js';
import {
  BOOKING_STATUS,
  TRANSACTION_TYPES,
  TRANSACTION_DIRECTIONS,
  TRANSACTION_STATUS,
} from '../config/enums.js';

export const getOverview = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    activeOfferings,
    completedSessions,
    openReports,
    recentAuditLogs,
    bookingsByStatus,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ lastLoginAt: { $gte: thirtyDaysAgo } }),
    Skill.countDocuments({ isActive: true }),
    Booking.countDocuments({ status: BOOKING_STATUS.COMPLETED }),
    Report.countDocuments({ status: { $in: ['OPEN', 'UNDER_REVIEW'] } }),
    AuditLog.find().sort({ createdAt: -1 }).limit(10).populate('actorId', 'name email'),
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const bookingCounts = {};
  bookingsByStatus.forEach((b) => {
    bookingCounts[b._id] = b.count;
  });

  return {
    totalUsers,
    activeUsers,
    activeOfferings,
    completedSessions,
    openReports,
    bookingCounts,
    recentAuditLogs,
  };
};

export const getAnalytics = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [completed, cancelled, disputed, categoryStats] = await Promise.all([
    Booking.countDocuments({ status: BOOKING_STATUS.COMPLETED, updatedAt: { $gte: thirtyDaysAgo } }),
    Booking.countDocuments({ status: BOOKING_STATUS.CANCELLED, updatedAt: { $gte: thirtyDaysAgo } }),
    Booking.countDocuments({ status: BOOKING_STATUS.DISPUTED, updatedAt: { $gte: thirtyDaysAgo } }),
    Skill.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const totalFinished = completed + cancelled + disputed;
  const completionRate = totalFinished > 0 ? Math.round((completed / totalFinished) * 100) : 100;

  return {
    completionRate,
    completedLast30Days: completed,
    cancelledLast30Days: cancelled,
    disputedLast30Days: disputed,
    topCategories: categoryStats.map((c) => ({ category: c._id, count: c.count })),
  };
};

export const searchUsers = async (queryParams) => {
  const { q, role, isSuspended, page = 1, limit = 15 } = queryParams;
  const filter = {};

  if (role) filter.role = role;
  if (isSuspended !== undefined) filter.isSuspended = isSuspended === 'true';

  if (q && q.trim()) {
    const regex = new RegExp(q.trim(), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { college: regex }];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('+suspensionReason')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  return {
    users,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getUserDetails = async (userId) => {
  const user = await User.findById(userId).select('+suspensionReason');
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  const [offeringsCount, bookingsCount] = await Promise.all([
    Skill.countDocuments({ ownerId: userId }),
    Booking.countDocuments({ $or: [{ learnerId: userId }, { mentorId: userId }] }),
  ]);

  return {
    user,
    stats: {
      offeringsCount,
      bookingsCount,
    },
  };
};

export const suspendUser = async (userId, adminId, reason) => {
  if (!reason || reason.trim().length === 0) {
    throw new AppError('Suspension reason is mandatory', 400, 'VALIDATION_ERROR');
  }

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  user.isSuspended = true;
  user.suspensionReason = reason;
  await user.save();

  // Flag upcoming ACCEPTED bookings involving this user per PRD 4.6
  await Booking.updateMany(
    {
      $or: [{ learnerId: userId }, { mentorId: userId }],
      status: BOOKING_STATUS.ACCEPTED,
      scheduledStart: { $gt: new Date() },
    },
    {
      $addToSet: { flags: 'PARTICIPANT_SUSPENDED' },
    }
  );

  // Write AuditLog
  await new AuditLog({
    actorId: adminId,
    action: 'USER_SUSPENDED',
    targetType: 'USER',
    targetId: userId,
    details: { reason },
  }).save();

  return user;
};

export const reactivateUser = async (userId, adminId, reason) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  user.isSuspended = false;
  user.suspensionReason = '';
  await user.save();

  await new AuditLog({
    actorId: adminId,
    action: 'USER_REACTIVATED',
    targetType: 'USER',
    targetId: userId,
    details: { reason: reason || 'Reactivated by admin' },
  }).save();

  return user;
};

export const adjustCredits = async (userId, adminId, { amount, reason, idempotencyKey }) => {
  if (!Number.isInteger(amount) || amount === 0) {
    throw new AppError('Amount must be a non-zero integer', 400, 'VALIDATION_ERROR');
  }
  if (!reason || reason.trim().length === 0) {
    throw new AppError('Adjustment reason is required', 400, 'VALIDATION_ERROR');
  }

  const key = idempotencyKey || `admin-adj:${new mongoose.Types.ObjectId()}`;

  return await runInTransaction(async (session) => {
    const user = await User.findById(userId).session(session);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    if (user.wallet.available + amount < 0) {
      throw new AppError('Credit adjustment would cause negative available balance', 422, 'INSUFFICIENT_CREDITS');
    }

    user.wallet.available += amount;
    await user.save(session ? { session } : {});

    const direction = amount > 0 ? TRANSACTION_DIRECTIONS.CREDIT : TRANSACTION_DIRECTIONS.DEBIT;

    const tx = new CreditTransaction({
      userId,
      type: TRANSACTION_TYPES.ADMIN_ADJUSTMENT,
      direction,
      amount: Math.abs(amount),
      balanceAfter: { available: user.wallet.available, reserved: user.wallet.reserved },
      status: TRANSACTION_STATUS.COMPLETED,
      idempotencyKey: key,
      description: `Admin adjustment: ${reason}`,
      createdBy: adminId,
    });
    await tx.save(session ? { session } : {});

    await new AuditLog({
      actorId: adminId,
      action: 'CREDIT_ADJUSTED',
      targetType: 'USER',
      targetId: userId,
      details: { amount, reason, idempotencyKey: key },
    }).save(session ? { session } : {});

    return { user, transaction: tx };
  });
};

export const getReports = async (type, status) => {
  const filter = {};
  if (type) filter.type = type;
  if (status) filter.status = status;

  return await Report.find(filter)
    .populate('reporterId', 'name email')
    .populate('reportedUserId', 'name email isSuspended')
    .populate('bookingId', 'skillTitle status scheduledStart')
    .sort({ createdAt: -1 });
};

export const resolveReport = async (reportId, adminId, { status, resolution, note }) => {
  const report = await Report.findById(reportId);
  if (!report) throw new AppError('Report not found', 404, 'NOT_FOUND');

  if (status) report.status = status;
  if (resolution) {
    report.resolution = resolution;
    report.resolvedBy = adminId;
    report.resolvedAt = new Date();
  }

  if (note && note.trim()) {
    report.adminNotes.push({
      adminId,
      note: note.trim(),
      at: new Date(),
    });
  }

  await report.save();

  await new AuditLog({
    actorId: adminId,
    action: 'REPORT_RESOLVED',
    targetType: 'REPORT',
    targetId: reportId,
    details: { status: report.status, resolution },
  }).save();

  return report;
};

export const getAuditLogs = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find()
      .populate('actorId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    AuditLog.countDocuments(),
  ]);

  return {
    logs,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};
