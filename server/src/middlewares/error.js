import { AppError } from '../utils/AppError.js';
import { sendError } from '../utils/response.js';
import { ENV } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';
  let details = err.details || [];

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    code = 'VALIDATION_ERROR';
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    if (field === 'email') {
      message = 'An account with this email address already exists';
      code = 'EMAIL_TAKEN';
    } else {
      message = `Duplicate value entered for ${field}`;
      code = 'CONFLICT';
    }
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'UNAUTHENTICATED';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
    code = 'TOKEN_EXPIRED';
  }

  if (statusCode === 500 && ENV.NODE_ENV === 'production') {
    message = 'Internal server error';
    details = [];
  } else if (statusCode === 500 && ENV.NODE_ENV !== 'test') {
    console.error('[Error Middleware]', err);
  }

  return sendError(res, statusCode, message, code, details);
};
