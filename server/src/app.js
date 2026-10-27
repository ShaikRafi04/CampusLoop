import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import crypto from 'crypto';
import { ENV } from './config/env.js';
import { errorHandler } from './middlewares/error.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { sendSuccess } from './utils/response.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import skillRoutes from './routes/skillRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

// Trust proxy (required for secure cookies and accurate client IP behind Render/Vercel)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet());

// CORS configuration with allowlist
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      if (ENV.CLIENT_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin ${origin} not allowed by policy`));
    },
    credentials: true,
  })
);

// Body parsers with 100 KB limit per PRD 8.1
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// Sanitize against NoSQL injection ($ and . keys)
app.use(mongoSanitize());

// Request ID middleware
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// General API rate limiter
app.use('/api/v1', apiLimiter);

// Health check route
app.get('/api/v1/health', (req, res) => {
  return sendSuccess(res, 200, 'CampusLoop API is healthy', {
    status: 'UP',
    timestamp: new Date().toISOString(),
    env: ENV.NODE_ENV,
  });
});

// Mount modular API routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/skills', skillRoutes);
app.use('/api/v1/availability', availabilityRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/goals', goalRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 handler for unmatched routes
app.use('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
    details: [],
  });
});

// Central error handling middleware
app.use(errorHandler);

export default app;
