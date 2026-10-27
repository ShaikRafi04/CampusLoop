import { CreditTransaction } from '../models/CreditTransaction.js';
import { User } from '../models/User.js';
import { sendSuccess } from '../utils/response.js';
import { TRANSACTION_TYPES } from '../config/enums.js';

export const getWallet = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return sendSuccess(res, 200, 'Wallet retrieved', {
      available: user.wallet.available,
      reserved: user.wallet.reserved,
    });
  } catch (err) {
    next(err);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, type } = req.query;
    const filter = { userId: req.user._id };
    if (type) filter.type = type;

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      CreditTransaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      CreditTransaction.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Transactions retrieved', transactions, {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    next(err);
  }
};

export const getWalletSummary = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    const [earnedAgg, spentAgg] = await Promise.all([
      CreditTransaction.aggregate([
        {
          $match: {
            userId: user._id,
            type: { $in: [TRANSACTION_TYPES.SESSION_REWARD, TRANSACTION_TYPES.INITIAL_GRANT] },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      CreditTransaction.aggregate([
        {
          $match: {
            userId: user._id,
            type: TRANSACTION_TYPES.SESSION_SETTLEMENT,
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    return sendSuccess(res, 200, 'Wallet summary calculated', {
      available: user.wallet.available,
      reserved: user.wallet.reserved,
      totalEarned: earnedAgg[0]?.total || 0,
      totalSpent: spentAgg[0]?.total || 0,
    });
  } catch (err) {
    next(err);
  }
};
