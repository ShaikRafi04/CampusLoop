import mongoose from 'mongoose';
import {
  TRANSACTION_TYPES,
  TRANSACTION_DIRECTIONS,
  TRANSACTION_STATUS,
} from '../config/enums.js';

const creditTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    type: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: true,
    },
    direction: {
      type: String,
      enum: Object.values(TRANSACTION_DIRECTIONS),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} must be an integer',
      },
    },
    balanceAfter: {
      available: { type: Number, required: true, min: 0 },
      reserved: { type: Number, required: true, min: 0 },
    },
    status: {
      type: String,
      enum: Object.values(TRANSACTION_STATUS),
      default: TRANSACTION_STATUS.COMPLETED,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    timestamps: false,
    strict: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

creditTransactionSchema.index({ userId: 1, createdAt: -1 });

export const CreditTransaction = mongoose.model(
  'CreditTransaction',
  creditTransactionSchema
);
