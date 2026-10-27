import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { CreditTransaction } from '../models/CreditTransaction.js';
import { AppError } from '../utils/AppError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from '../utils/token.js';
import { ENV } from '../config/env.js';
import {
  ROLES,
  TRANSACTION_TYPES,
  TRANSACTION_DIRECTIONS,
  TRANSACTION_STATUS,
} from '../config/enums.js';

export const registerUser = async (userData) => {
  const { name, email, password, college, department, academicYear } = userData;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new AppError('Unable to register with these details', 409, 'EMAIL_TAKEN');
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const initialGrant = ENV.INITIAL_CREDIT_GRANT;
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Use a transaction session if available
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err) {
    // If sessions are not supported (e.g. standalone test), session remains null
    session = null;
  }

  try {
    const user = new User({
      name,
      email: normalizedEmail,
      passwordHash,
      role: ROLES.STUDENT,
      college: college || '',
      department: department || '',
      academicYear: academicYear || 1,
      wallet: {
        available: initialGrant,
        reserved: 0,
      },
      refreshTokens: [{ tokenHash, expiresAt }],
      lastLoginAt: new Date(),
    });

    await user.save(session ? { session } : {});

    // Create Initial Credit Grant ledger entry
    const grantTransaction = new CreditTransaction({
      userId: user._id,
      type: TRANSACTION_TYPES.INITIAL_GRANT,
      direction: TRANSACTION_DIRECTIONS.CREDIT,
      amount: initialGrant,
      balanceAfter: {
        available: initialGrant,
        reserved: 0,
      },
      status: TRANSACTION_STATUS.COMPLETED,
      idempotencyKey: `grant:${user._id}`,
      description: 'Welcome bonus learning credits',
    });

    await grantTransaction.save(session ? { session } : {});

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    const accessToken = generateAccessToken(user);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  } catch (err) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    if (err.code === 11000) {
      throw new AppError('Unable to register with these details', 409, 'EMAIL_TAKEN');
    }
    throw err;
  }
};

export const loginUser = async (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash +refreshTokens');

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Clean expired refresh tokens and add new one
  const validTokens = (user.refreshTokens || []).filter((t) => t.expiresAt > new Date());
  validTokens.push({ tokenHash, expiresAt });
  user.refreshTokens = validTokens;
  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = generateAccessToken(user);

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  };
};

export const rotateRefreshToken = async (oldRefreshToken) => {
  if (!oldRefreshToken) {
    throw new AppError('Refresh token required', 401, 'UNAUTHENTICATED');
  }

  const oldHash = hashToken(oldRefreshToken);
  const user = await User.findOne({ 'refreshTokens.tokenHash': oldHash }).select('+refreshTokens');

  if (!user) {
    // Check if token reuse occurred or invalid token
    throw new AppError('Invalid or expired refresh token', 401, 'UNAUTHENTICATED');
  }

  const tokenRecord = user.refreshTokens.find((t) => t.tokenHash === oldHash);
  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    user.refreshTokens = user.refreshTokens.filter((t) => t.tokenHash !== oldHash);
    await user.save();
    throw new AppError('Refresh token has expired', 401, 'TOKEN_EXPIRED');
  }

  // Rotate token: remove old token, add new one
  user.refreshTokens = user.refreshTokens.filter((t) => t.tokenHash !== oldHash);
  const newRefreshToken = generateRefreshToken();
  const newHash = hashToken(newRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  user.refreshTokens.push({ tokenHash: newHash, expiresAt });
  await user.save();

  const accessToken = generateAccessToken(user);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: user.toJSON(),
  };
};

export const logoutUser = async (userId, refreshToken) => {
  if (!refreshToken) return;
  const hashed = hashToken(refreshToken);
  await User.updateOne(
    { _id: userId },
    { $pull: { refreshTokens: { tokenHash: hashed } } }
  );
};
