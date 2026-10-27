import { z } from 'zod';
import {
  SKILL_CATEGORIES,
  DIFFICULTY_LEVELS,
  SESSION_DURATIONS,
  SESSION_FORMATS,
} from '../config/enums.js';

export const createSkillSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(80, 'Title cannot exceed 80 characters'),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').max(1000, 'Description cannot exceed 1000 characters'),
    category: z.enum(SKILL_CATEGORIES, { errorMap: () => ({ message: 'Invalid category' }) }),
    difficulty: z.nativeEnum(DIFFICULTY_LEVELS),
    experienceYears: z.number().min(0).max(50),
    durationMinutes: z.number().refine((val) => SESSION_DURATIONS.includes(val), {
      message: 'Duration must be 30, 60, 90, or 120 minutes',
    }),
    creditCost: z
      .number()
      .int()
      .min(5, 'Minimum cost is 5 credits')
      .max(50, 'Maximum cost is 50 credits')
      .refine((val) => val % 5 === 0, { message: 'Credit cost must be a multiple of 5' }),
    format: z.nativeEnum(SESSION_FORMATS),
    tags: z.array(z.string().trim().max(24)).max(8).optional().default([]),
    meetingLink: z.string().trim().optional().default(''),
  }),
});

export const updateSkillSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(80).optional(),
    description: z.string().trim().min(10).max(1000).optional(),
    category: z.enum(SKILL_CATEGORIES).optional(),
    difficulty: z.nativeEnum(DIFFICULTY_LEVELS).optional(),
    experienceYears: z.number().min(0).max(50).optional(),
    durationMinutes: z
      .number()
      .refine((val) => SESSION_DURATIONS.includes(val), {
        message: 'Duration must be 30, 60, 90, or 120 minutes',
      })
      .optional(),
    creditCost: z
      .number()
      .int()
      .min(5)
      .max(50)
      .refine((val) => val % 5 === 0, { message: 'Credit cost must be a multiple of 5' })
      .optional(),
    format: z.nativeEnum(SESSION_FORMATS).optional(),
    tags: z.array(z.string().trim().max(24)).max(8).optional(),
    meetingLink: z.string().trim().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const skillQuerySchema = z.object({
  query: z.object({
    q: z.string().trim().max(100).optional(),
    category: z.string().optional(),
    difficulty: z.string().optional(),
    format: z.string().optional(),
    minCredits: z.coerce.number().optional(),
    maxCredits: z.coerce.number().optional(),
    minRating: z.coerce.number().optional(),
    availableWithin: z.coerce.number().optional(),
    sort: z.enum(['rating_desc', 'cost_asc', 'experience_desc', 'newest']).optional().default('newest'),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(12),
  }),
});
