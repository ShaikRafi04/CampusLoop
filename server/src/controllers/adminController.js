import * as adminService from '../services/adminService.js';
import { sendSuccess } from '../utils/response.js';

export const getOverview = async (req, res, next) => {
  try {
    const data = await adminService.getOverview();
    return sendSuccess(res, 200, 'Admin overview metrics retrieved', data);
  } catch (err) {
    next(err);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const data = await adminService.getAnalytics();
    return sendSuccess(res, 200, 'Analytics retrieved', data);
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const result = await adminService.searchUsers(req.query);
    return sendSuccess(res, 200, 'Users retrieved', result.users, result.meta);
  } catch (err) {
    next(err);
  }
};

export const getUserDetails = async (req, res, next) => {
  try {
    const data = await adminService.getUserDetails(req.params.id);
    return sendSuccess(res, 200, 'User details retrieved', data);
  } catch (err) {
    next(err);
  }
};

export const suspendUser = async (req, res, next) => {
  try {
    const user = await adminService.suspendUser(req.params.id, req.user._id, req.body.reason);
    return sendSuccess(res, 200, 'User suspended successfully', { user });
  } catch (err) {
    next(err);
  }
};

export const reactivateUser = async (req, res, next) => {
  try {
    const user = await adminService.reactivateUser(req.params.id, req.user._id, req.body.reason);
    return sendSuccess(res, 200, 'User reactivated successfully', { user });
  } catch (err) {
    next(err);
  }
};

export const adjustCredits = async (req, res, next) => {
  try {
    const result = await adminService.adjustCredits(req.params.id, req.user._id, req.body);
    return sendSuccess(res, 200, 'Credit adjustment completed and audited', result);
  } catch (err) {
    next(err);
  }
};

export const listReports = async (req, res, next) => {
  try {
    const { type, status } = req.query;
    const reports = await adminService.getReports(type, status);
    return sendSuccess(res, 200, 'Reports retrieved', { reports });
  } catch (err) {
    next(err);
  }
};

export const resolveReport = async (req, res, next) => {
  try {
    const report = await adminService.resolveReport(req.params.id, req.user._id, req.body);
    return sendSuccess(res, 200, 'Report resolution recorded', { report });
  } catch (err) {
    next(err);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await adminService.getAuditLogs(Number(page), Number(limit));
    return sendSuccess(res, 200, 'Audit logs retrieved', result.logs, result.meta);
  } catch (err) {
    next(err);
  }
};
