import * as authService from '../services/authService.js';
import { setAuthCookies, clearAuthCookies } from '../utils/token.js';
import { sendSuccess } from '../utils/response.js';

export const register = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.registerUser(req.body);
    setAuthCookies(res, accessToken, refreshToken);
    return sendSuccess(res, 201, 'Registration successful', { user, accessToken });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.loginUser(email, password);
    setAuthCookies(res, accessToken, refreshToken);
    return sendSuccess(res, 200, 'Login successful', { user, accessToken });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.cl_refresh || req.body?.refreshToken;
    if (req.user) {
      await authService.logoutUser(req.user._id, refreshToken);
    }
    clearAuthCookies(res);
    return sendSuccess(res, 200, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'Current user retrieved', { user: req.user.toJSON() });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const oldRefreshToken = req.cookies?.cl_refresh || req.body?.refreshToken;
    const { accessToken, refreshToken, user } = await authService.rotateRefreshToken(oldRefreshToken);
    setAuthCookies(res, accessToken, refreshToken);
    return sendSuccess(res, 200, 'Token refreshed successfully', { accessToken, user });
  } catch (err) {
    next(err);
  }
};
