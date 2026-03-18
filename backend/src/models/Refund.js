/**
 * Refund model – tracks refund operations against escrow or direct payments.
 *
 * Status flow:
 *   pending → completed
 *          ↘ failed
 *
 * A refund is created when:
 *   - An employer cancels a job before escrow is captured (full refund)
 *   - A dispute is resolved in the employer's favour (partial or full)
 */

import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema({
  /** User receiving the refund (employer). */
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  /** Job related to this refund. */
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  /** Original Transaction that is being refunded. */
  originalTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null,
  },
  /** Gross amount refunded (BRL). */
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Refund amount must be positive'],
  },
  reason: {
    type: String,
    enum: ['job_cancelled', 'dispute_resolved', 'duplicate', 'fraudulent', 'other'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  /** Provider-specific refund/payment ID (e.g. Stripe refund ID `re_xxx`). */
  gatewayRefundId: {
    type: String,
    default: null,
  },
  /** Payment gateway used. */
  gatewayProvider: {
    type: String,
    default: 'stripe',
  },
  failureReason: {
    type: String,
    default: null,
  },
  processedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

refundSchema.index({ userId: 1, createdAt: -1 });
refundSchema.index({ jobId: 1 });
refundSchema.index({ status: 1 });
refundSchema.index({ gatewayRefundId: 1 });

refundSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Refund', refundSchema);
