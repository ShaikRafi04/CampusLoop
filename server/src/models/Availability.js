import mongoose from 'mongoose';
import { AVAILABILITY_TYPES } from '../config/enums.js';

const availabilitySchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(AVAILABILITY_TYPES),
      required: true,
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      required: function () {
        return this.type === AVAILABILITY_TYPES.WEEKLY;
      },
    },
    date: {
      type: String, // 'YYYY-MM-DD'
      required: function () {
        return this.type === AVAILABILITY_TYPES.DATE_OVERRIDE;
      },
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'],
    },
    startTime: {
      type: String, // 'HH:mm'
      required: true,
      match: [/^([01]\d|2[0-3]):(00|30)$/, 'Time must be HH:mm on a 30-minute boundary'],
    },
    endTime: {
      type: String, // 'HH:mm'
      required: true,
      match: [/^([01]\d|2[0-3]):(00|30)$/, 'Time must be HH:mm on a 30-minute boundary'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    strict: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Pre-validate hook to ensure startTime < endTime and mutually exclusive dayOfWeek/date
availabilitySchema.pre('validate', function (next) {
  if (this.startTime && this.endTime && this.startTime >= this.endTime) {
    this.invalidate('endTime', 'endTime must be strictly greater than startTime');
  }

  if (this.type === AVAILABILITY_TYPES.WEEKLY && this.date) {
    this.date = undefined;
  }
  if (this.type === AVAILABILITY_TYPES.DATE_OVERRIDE && this.dayOfWeek !== undefined) {
    this.dayOfWeek = undefined;
  }

  next();
});

availabilitySchema.index({ mentorId: 1, type: 1, dayOfWeek: 1 });
availabilitySchema.index({ mentorId: 1, date: 1 });

export const Availability = mongoose.model('Availability', availabilitySchema);
