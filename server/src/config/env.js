import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/campusloop?replicaSet=rs0',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'fallback_development_access_secret_campusloop_min_64_characters_long_now',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback_development_refresh_secret_campusloop_min_64_characters_long_now',
  CLIENT_ORIGINS: (process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',').map((o) => o.trim()),
  INITIAL_CREDIT_GRANT: parseInt(process.env.INITIAL_CREDIT_GRANT, 10) || 50,
  DEFAULT_TIMEZONE: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
};
