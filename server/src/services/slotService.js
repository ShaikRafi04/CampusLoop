import mongoose from 'mongoose';
import { Availability } from '../models/Availability.js';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import { AVAILABILITY_TYPES, BOOKING_STATUS } from '../config/enums.js';
import { AppError } from '../utils/AppError.js';

/**
 * Format a Date object to YYYY-MM-DD in a given timezone
 */
export const formatDateInTimezone = (date, timezone = 'Asia/Kolkata') => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date); // outputs YYYY-MM-DD
};

/**
 * Get day of week (0-6, 0=Sunday) in a given timezone
 */
export const getDayOfWeekInTimezone = (date, timezone = 'Asia/Kolkata') => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).format(date);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days.indexOf(parts);
};

/**
 * Compute bookable start slots for a mentor & duration within a date span [from, to]
 */
export const computeAvailableSlots = async (mentorId, durationMinutes, fromDate, toDate) => {
  const mentor = await User.findById(mentorId);
  if (!mentor) {
    throw new AppError('Mentor not found', 404, 'NOT_FOUND');
  }

  const timezone = mentor.timezone || 'Asia/Kolkata';

  const from = new Date(fromDate);
  const to = new Date(toDate);

  // Maximum 14 days span check per PRD 8.4
  const maxSpanMs = 14 * 24 * 60 * 60 * 1000;
  if (to.getTime() - from.getTime() > maxSpanMs) {
    throw new AppError('Slot range span cannot exceed 14 days', 400, 'VALIDATION_ERROR');
  }

  // Fetch mentor availability windows
  const availabilityRules = await Availability.find({ mentorId });

  // Fetch existing overlapping bookings (ACCEPTED or PENDING)
  const existingBookings = await Booking.find({
    mentorId,
    status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.DISPUTED] },
    scheduledStart: { $lt: to },
    scheduledEnd: { $gt: from },
  });

  const slots = [];
  const now = new Date();
  const minimumNoticeMs = 2 * 60 * 60 * 1000; // 2 hours in advance per PRD 4.2
  const earliestAllowedStart = new Date(now.getTime() + minimumNoticeMs);

  // Iterate day by day from 'from' to 'to'
  let currentDay = new Date(from);
  while (currentDay <= to) {
    const dateStr = formatDateInTimezone(currentDay, timezone);
    const dayOfWeek = getDayOfWeekInTimezone(currentDay, timezone);

    // Check for DATE_OVERRIDE on this date
    const dateOverrides = availabilityRules.filter(
      (r) => r.type === AVAILABILITY_TYPES.DATE_OVERRIDE && r.date === dateStr
    );

    let activeWindows = [];

    if (dateOverrides.length > 0) {
      // Overrides present: if any has isAvailable: false, blacked out, otherwise use true overrides
      const isBlackout = dateOverrides.some((o) => !o.isAvailable);
      if (!isBlackout) {
        activeWindows = dateOverrides.filter((o) => o.isAvailable);
      }
    } else {
      // Use WEEKLY rules
      activeWindows = availabilityRules.filter(
        (r) => r.type === AVAILABILITY_TYPES.WEEKLY && r.dayOfWeek === dayOfWeek
      );
    }

    // Generate candidate slots for each active window
    for (const win of activeWindows) {
      const [startHour, startMin] = win.startTime.split(':').map(Number);
      const [endHour, endMin] = win.endTime.split(':').map(Number);

      // Create local day instant in mentor timezone
      const windowStartMs = startHour * 60 + startMin;
      const windowEndMs = endHour * 60 + endMin;

      for (let slotStartMin = windowStartMs; slotStartMin + durationMinutes <= windowEndMs; slotStartMin += 30) {
        const hour = Math.floor(slotStartMin / 60);
        const min = slotStartMin % 60;
        const timeString = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;

        // Parse ISO UTC string for the date and time in the mentor's timezone
        // Build ISO string using mentor's local date
        const localIso = `${dateStr}T${timeString}`;
        const slotStartDate = new Date(new Date(localIso).toLocaleString('en-US', { timeZone: timezone }));
        // Precise UTC constructor
        const slotStartUtc = new Date(
          new Date(localIso).getTime() - getTimezoneOffsetMs(localIso, timezone)
        );
        const slotEndUtc = new Date(slotStartUtc.getTime() + durationMinutes * 60 * 1000);

        if (slotStartUtc < earliestAllowedStart) {
          continue;
        }

        // Check conflict with existing bookings
        const hasOverlap = existingBookings.some((b) => {
          return slotStartUtc < b.scheduledEnd && slotEndUtc > b.scheduledStart;
        });

        if (!hasOverlap) {
          slots.push(slotStartUtc.toISOString());
        }
      }
    }

    currentDay.setDate(currentDay.getDate() + 1);
  }

  // Return unique sorted ISO strings
  const uniqueSlots = Array.from(new Set(slots)).sort();
  return uniqueSlots;
};

function getTimezoneOffsetMs(dateStr, timeZone) {
  const date = new Date(dateStr);
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
  return tzDate.getTime() - utcDate.getTime();
}
