import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'anticipation', 'job_payment', 'coin_earned', 'coin_redeemed', 'loan', 'loan_repayment', 'referral_bonus', 'challenge_reward', 'escrow', 'escrow_release', 'subscription', 'fee_charge'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed',
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  fee: {
    type: Number,
    default: 0,
  },
  coins: {
    type: Number,
    default: 0,
  },
  relatedJobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  },
  stripePaymentIntentId: {
    type: String,
    default: null,
  },
  stripeSubscriptionId: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Index for efficient wallet history queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ stripePaymentIntentId: 1 });

export default mongoose.model('Transaction', transactionSchema);
