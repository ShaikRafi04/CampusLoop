import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { ROLES } from '../config/enums.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.STUDENT,
    },
    college: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    academicYear: {
      type: Number,
      min: 1,
      max: 8,
      default: 1,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: '',
    },
    profileImage: {
      type: String,
      default: '',
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    skillsWanted: {
      type: [String],
      validate: [(val) => val.length <= 15, '{PATH} exceeds limit of 15'],
      default: [],
    },
    interests: {
      type: [String],
      validate: [(val) => val.length <= 15, '{PATH} exceeds limit of 15'],
      default: [],
    },
    wallet: {
      available: {
        type: Number,
        min: 0,
        default: 0,
      },
      reserved: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    ratingSummary: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    completedSessionsAsMentor: {
      type: Number,
      default: 0,
    },
    completedSessionsAsLearner: {
      type: Number,
      default: 0,
    },
    mentorCancellations: {
      type: Number,
      default: 0,
    },
    scheduleVersion: {
      type: Number,
      default: 0,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspensionReason: {
      type: String,
      default: '',
    },
    refreshTokens: {
      type: [
        {
          tokenHash: { type: String, required: true },
          expiresAt: { type: Date, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      select: false,
      default: [],
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strict: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.passwordHash;
        delete ret.refreshTokens;
        delete ret.scheduleVersion;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ role: 1 });

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
