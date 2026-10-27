import { z } from 'zod';
import { DISPUTE_CATEGORIES } from '../config/enums.js';

export const createBookingSchema = z.object({
  body: z.object({
    skillId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid skill ID format'),
    scheduledStart: z.string().datetime('scheduledStart must be a valid ISO 8601 UTC date string'),
    learningObjective: z
      .string()
      .trim()
      .min(5, 'Learning objective must be at least 5 characters')
      .max(300, 'Learning objective cannot exceed 300 characters'),
    message: z.string().trim().max(500, 'Message cannot exceed 500 characters').optional().default(''),
  }),
});

export const cancelBookingSchema = z.object({
  body: z.object({
    reason: z.string().trim().max(300, 'Cancellation reason cannot exceed 300 characters').optional().default(''),
  }),
});

export const disputeBookingSchema = z.object({
  body: z.object({
    category: z.enum(DISPUTE_CATEGORIES, { errorMap: () => ({ message: 'Invalid dispute category' }) }),
    description: z
      .string()
      .trim()
      .min(10, 'Dispute description must be at least 10 characters')
      .max(1000, 'Dispute description cannot exceed 1000 characters'),
  }),
});
