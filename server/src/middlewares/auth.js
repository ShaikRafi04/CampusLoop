import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { ENV } from '../config/env.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies?.cl_access;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required', 401, 'UNAUTHENTICATED'));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Access token expired', 401, 'TOKEN_EXPIRED'));
      }
      return next(new AppError('Invalid authentication token', 401, 'UNAUTHENTICATED'));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User not found', 401, 'UNAUTHENTICATED'));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.cl_access;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    } catch (e) {
      // Ignore invalid token for optional routes
    }

    next();
  } catch (err) {
    next(err);
  }
};

export const requireActiveAccount = (req, res, next) => {
  if (req.user?.isSuspended) {
    return next(
      new AppError(
        'Your account is suspended and restricted to read-only access',
        403,
        'ACCOUNT_SUSPENDED'
      )
    );
  }
  next();
};

export const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return next(new AppError('Access forbidden: insufficient permissions', 403, 'FORBIDDEN'));
  }
  next();
};
