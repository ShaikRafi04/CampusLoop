import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ENV } from '../config/env.js';

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    ENV.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

export const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = ENV.NODE_ENV === 'production';

  // Access Token Cookie (15 min)
  res.cookie('cl_access', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax', // 'lax' for local dev, 'none' if cross-origin HTTPS in production
    maxAge: 15 * 60 * 1000,
    path: '/',
  });

  // Refresh Token Cookie (7 days)
  if (refreshToken) {
    res.cookie('cl_refresh', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });
  }
};

export const clearAuthCookies = (res) => {
  const isProduction = ENV.NODE_ENV === 'production';
  res.cookie('cl_access', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0),
    path: '/',
  });
  res.cookie('cl_refresh', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0),
    path: '/api/v1/auth',
  });
};
