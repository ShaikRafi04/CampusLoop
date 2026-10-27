import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/AppError.js';
import { ENV } from '../config/env.js';

const rateLimitHandler = (message) => (req, res, next) => {
  next(new AppError(message, 429, 'RATE_LIMITED'));
};

export const authLimiter = ENV.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => `${req.ip}_${req.body?.email || ''}`,
      handler: rateLimitHandler('Too many login attempts. Please try again in 15 minutes.'),
    });

export const registerLimiter = ENV.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      handler: rateLimitHandler('Too many accounts created from this IP. Please try again after an hour.'),
    });

export const apiLimiter = ENV.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
      handler: rateLimitHandler('Too many requests. Please slow down.'),
    });
