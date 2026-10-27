import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'production';
const isProduction = nodeEnv === 'production';
const clientOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!['development', 'test', 'production'].includes(nodeEnv)) {
  throw new Error('NODE_ENV must be development, test, or production');
}

if (isProduction) {
  const requiredVariables = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'CLIENT_ORIGINS'];
  const missingVariables = requiredVariables.filter((name) => !process.env[name]?.trim());
  if (missingVariables.length > 0) {
    throw new Error(`Missing required production environment variables: ${missingVariables.join(', ')}`);
  }
  if (clientOrigins.length === 0) {
    throw new Error('CLIENT_ORIGINS must contain at least one HTTPS origin in production');
  }

  if (!/^mongodb(?:\+srv)?:\/\//.test(process.env.MONGODB_URI)) {
    throw new Error('MONGODB_URI must be a MongoDB connection URI in production');
  }

  for (const secretName of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
    if (process.env[secretName].length < 64) {
      throw new Error(`${secretName} must be at least 64 characters in production`);
    }
  }

  if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different');
  }

  for (const origin of clientOrigins) {
    let parsedOrigin;
    try {
      parsedOrigin = new URL(origin);
    } catch {
      throw new Error(`CLIENT_ORIGINS contains an invalid URL: ${origin}`);
    }

    if (parsedOrigin.protocol !== 'https:' || parsedOrigin.origin !== origin) {
      throw new Error(`Production CLIENT_ORIGINS must contain HTTPS origins without paths: ${origin}`);
    }
  }
}

export const ENV = {
  NODE_ENV: nodeEnv,
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/campusloop?replicaSet=rs0',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'fallback_development_access_secret_campusloop_min_64_characters_long_now',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback_development_refresh_secret_campusloop_min_64_characters_long_now',
  CLIENT_ORIGINS: clientOrigins,
  INITIAL_CREDIT_GRANT: parseInt(process.env.INITIAL_CREDIT_GRANT, 10) || 50,
  DEFAULT_TIMEZONE: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
};
