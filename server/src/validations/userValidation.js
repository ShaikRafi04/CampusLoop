import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(60).optional(),
    bio: z.string().trim().max(500).optional(),
    college: z.string().trim().optional(),
    department: z.string().trim().optional(),
    academicYear: z.number().int().min(1).max(8).optional(),
    timezone: z.string().trim().optional(),
    skillsWanted: z.array(z.string().trim()).max(15).optional(),
    interests: z.array(z.string().trim()).max(15).optional(),
    profileImage: z.string().trim().url().or(z.literal('')).optional(),
  }),
});
