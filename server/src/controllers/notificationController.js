import * as notificationService from '../services/notificationService.js';
import { sendSuccess } from '../utils/response.js';

export const list = async (req, res, next) => {
  try {
    const { unread, page = 1, limit = 20 } = req.query;
    const result = await notificationService.getNotifications(
      req.user._id,
      unread === 'true',
      Number(page),
      Number(limit)
    );
    return sendSuccess(res, 200, 'Notifications retrieved', result.notifications, result.meta);
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);
    return sendSuccess(res, 200, 'Unread notification count', { count });
  } catch (err) {
    next(err);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const notif = await notificationService.markAsRead(req.params.id, req.user._id);
    return sendSuccess(res, 200, 'Notification marked as read', { notification: notif });
  } catch (err) {
    next(err);
  }
};

export const markAllRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user._id);
    return sendSuccess(res, 200, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};
