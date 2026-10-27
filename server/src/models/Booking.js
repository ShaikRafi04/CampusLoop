import mongoose from 'mongoose';
import { BOOKING_STATUS } from '../config/enums.js';

const bookingSchema = new mongoose.Schema(
  {
    learnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    scheduledStart: {
      type: Date,
      required: true,
    },
    scheduledEnd: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
      required: true,
    },
    learningObjective: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    creditCost: {
      type: Number,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
    skillTitle: {
      type: String,
      required: true,
    },
    completionRequestedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cancellationReason: {
      type: String,
      maxlength: 300,
    },
    cancelledAt: {
      type: Date,
    },
    flags: {
      type: [String],
      default: [],
    },
    statusHistory: [
      {
        from: { type: String, required: true },
        to: { type: String, required: true },
        actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
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

bookingSchema.index({ mentorId: 1, scheduledStart: 1 });
bookingSchema.index({ learnerId: 1, scheduledStart: 1 });
bookingSchema.index({ status: 1, completionRequestedAt: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
