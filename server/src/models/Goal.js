import mongoose from 'mongoose';
import { GOAL_STATUS } from '../config/enums.js';

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    skillName: {
      type: String,
      required: true,
      trim: true,
    },
    targetSessions: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} must be an integer',
      },
    },
    completedSessions: {
      type: Number,
      default: 0,
      min: 0,
    },
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(GOAL_STATUS),
      default: GOAL_STATUS.IN_PROGRESS,
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

goalSchema.index({ userId: 1, status: 1 });

export const Goal = mongoose.model('Goal', goalSchema);
