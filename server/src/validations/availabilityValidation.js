import { z } from 'zod';
import { AVAILABILITY_TYPES } from '../config/enums.js';

const timeRegex = /^([01]\d|2[0-3]):(00|30)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createAvailabilitySchema = z.object({
  body: z
    .object({
      type: z.nativeEnum(AVAILABILITY_TYPES),
      dayOfWeek: z.number().int().min(0).max(6).optional(),
      date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD').optional(),
      startTime: z.string().regex(timeRegex, 'Start time must be HH:mm on 30-minute boundary'),
      endTime: z.string().regex(timeRegex, 'End time must be HH:mm on 30-minute boundary'),
      isAvailable: z.boolean().optional().default(true),
    })
    .refine((data) => data.startTime < data.endTime, {
      message: 'endTime must be strictly greater than startTime',
      path: ['endTime'],
    })
    .refine(
      (data) => {
        if (data.type === AVAILABILITY_TYPES.WEEKLY) {
          return data.dayOfWeek !== undefined;
        }
        if (data.type === AVAILABILITY_TYPES.DATE_OVERRIDE) {
          return Boolean(data.date);
        }
        return true;
      },
      {
        message: 'dayOfWeek is required for WEEKLY and date is required for DATE_OVERRIDE',
        path: ['type'],
      }
    ),
});

export const updateAvailabilitySchema = z.object({
  body: z.object({
    startTime: z.string().regex(timeRegex).optional(),
    endTime: z.string().regex(timeRegex).optional(),
    isAvailable: z.boolean().optional(),
  }),
});

export const slotQuerySchema = z.object({
  query: z.object({
    from: z.string().min(1, 'from date is required'),
    to: z.string().min(1, 'to date is required'),
  }),
});
