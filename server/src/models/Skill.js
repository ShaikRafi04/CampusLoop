import mongoose from 'mongoose';
import {
  SKILL_CATEGORIES,
  DIFFICULTY_LEVELS,
  SESSION_DURATIONS,
  SESSION_FORMATS,
} from '../config/enums.js';

const skillSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 80,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      required: true,
      enum: SKILL_CATEGORIES,
    },
    difficulty: {
      type: String,
      required: true,
      enum: Object.values(DIFFICULTY_LEVELS),
    },
    experienceYears: {
      type: Number,
      required: true,
      min: 0,
      max: 50,
    },
    durationMinutes: {
      type: Number,
      required: true,
      enum: SESSION_DURATIONS,
    },
    creditCost: {
      type: Number,
      required: true,
      min: 5,
      max: 50,
      validate: {
        validator: (v) => v % 5 === 0,
        message: '{VALUE} must be a multiple of 5',
      },
    },
    format: {
      type: String,
      required: true,
      enum: Object.values(SESSION_FORMATS),
    },
    tags: {
      type: [String],
      validate: [
        (tags) => tags.length <= 8 && tags.every((t) => t.length <= 24),
        'Maximum 8 tags with up to 24 characters each allowed',
      ],
      default: [],
    },
    meetingLink: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    ratingSummary: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    mentorName: {
      type: String,
      default: '',
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

skillSchema.index({ ownerId: 1, isActive: 1 });
skillSchema.index({ category: 1, isActive: 1 });
skillSchema.index({ title: 'text', tags: 'text', category: 'text' });

export const Skill = mongoose.model('Skill', skillSchema);
