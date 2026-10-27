import { AppError } from '../utils/AppError.js';

const FORBIDDEN_CLIENT_KEYS = ['role', 'wallet', 'isSuspended', 'status', 'creditBalance', 'ratingSummary', 'scheduleVersion'];

export const sanitizeKeys = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
      continue;
    }
    if (FORBIDDEN_CLIENT_KEYS.includes(key)) {
      console.warn(`[Security] Client attempted to set forbidden key: ${key}`);
      delete obj[key];
      continue;
    }
    if (typeof obj[key] === 'object') {
      sanitizeKeys(obj[key]);
    }
  }
  return obj;
};

export const validate = (schema) => (req, res, next) => {
  try {
    if (req.body) sanitizeKeys(req.body);
    if (req.query) sanitizeKeys(req.query);

    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.query !== undefined) req.query = parsed.query;
    if (parsed.params !== undefined) req.params = parsed.params;

    next();
  } catch (err) {
    if (err.errors) {
      const details = err.errors.map((e) => ({
        field: e.path.slice(1).join('.') || e.path[0] || 'input',
        message: e.message,
      }));
      return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', details));
    }
    next(err);
  }
};
