/**
 * Withdrawal model – tracks each freelancer withdrawal request through its lifecycle.
 *
 * Status flow:
 *   pending → processing → completed
 *                       ↘ failed      → wallet.scheduled -= amount; wallet.balance += amount (rollback)
 *   pending → cancelled               → wallet.scheduled -= amount; wallet.balance += amount (rollback)
 *
 * Wallet accounting (handled in the route layer):
 *   - On creation:   wallet.balance  -= amount
 *                    wallet.scheduled += amount
 *   - On completion: wallet.scheduled -= amount; wallet.withdrawn += amount
 *   - On failure:    wallet.scheduled -= amount; wallet.balance   += amount (full rollback)
 *   - On cancel:     wallet.scheduled -= amount; wallet.balance   += amount (full rollback)
 */

import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  /** Gross withdrawal amount requested (BRL). */
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Withdrawal amount must be positive'],
  },
  /** Gateway fee deducted from the gross amount. */
  fee: {
    type: Number,
    default: 0,
    min: 0,
  },
  /** Net amount actually sent to the recipient (amount - fee). */
  netAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  /** PIX key supplied by the user (CPF, phone, email or random key). */
  pixKey: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  /** Provider-specific payment/transfer ID returned by the gateway. */
  gatewayTransferId: {
    type: String,
    default: null,
  },
  /** Payment gateway used (e.g. "stripe", "asaas", "pagar_me"). */
  gatewayProvider: {
    type: String,
    default: 'stripe',
  },
  /** Free-text reason for failure or cancellation. */
  failureReason: {
    type: String,
    default: null,
  },
  /** ISO timestamp when the gateway confirmed the transfer. */
  processedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

withdrawalSchema.index({ userId: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ gatewayTransferId: 1 });

withdrawalSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Withdrawal', withdrawalSchema);
