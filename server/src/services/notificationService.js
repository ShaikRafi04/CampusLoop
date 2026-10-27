import mongoose from 'mongoose';
import { Notification } from '../models/Notification.js';

export const createNotification = async (data) => {
  try {
    const notif = new Notification(data);
    await notif.save();
    return notif;
  } catch (err) {
    // Edge case per PRD Section 11: Notification creation failure after commit must not roll back underlying operations
    console.error('[NotificationService] Failed to create notification:', err.message);
    return null;
  }
};

export const getNotifications = async (userId, unreadOnly = false, page = 1, limit = 20) => {
  const filter = { userId };
  if (unreadOnly) filter.isRead = false;

  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Notification.countDocuments(filter),
  ]);

  return {
    notifications,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ userId, isRead: false });
};

export const markAsRead = async (notificationId, userId) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { isRead: true } },
    { new: true }
  );
};

export const markAllAsRead = async (userId) => {
  await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
};
