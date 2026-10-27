import { z } from 'zod';

export const createGoalSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(100),
    description: z.string().trim().max(500).optional().default(''),
    skillName: z.string().trim().min(1, 'Skill name is required'),
    targetSessions: z.number().int().min(1).max(50),
    deadline: z.string().datetime().optional(),
  }),
});

export const updateGoalSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(100).optional(),
    description: z.string().trim().max(500).optional(),
    targetSessions: z.number().int().min(1).max(50).optional(),
    deadline: z.string().datetime().optional(),
    status: z.enum(['IN_PROGRESS', 'CANCELLED']).optional(),
  }),
});
