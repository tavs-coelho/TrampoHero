/**
 * Dispute model – represents a formal disagreement between employer and freelancer
 * over a completed job.
 *
 * Status flow:
 *   open → under_review → resolved_employer  (employer wins → refund issued)
 *                       → resolved_freelancer (freelancer wins → payment released)
 *                       → resolved_split      (partial split decided by admin)
 *        → cancelled   (withdrawn by initiator before review)
 *
 * While a dispute is `open` or `under_review`, the related escrow funds are frozen.
 */

import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema({
  /** User who opened the dispute (employer or freelancer). */
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  freelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved_employer', 'resolved_freelancer', 'resolved_split', 'cancelled'],
    default: 'open',
  },
  /** Admin who reviewed/resolved the dispute. */
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  /**
   * Resolution details – populated when status is resolved_*.
   * - `employerAmount`: amount refunded to employer (BRL)
   * - `freelancerAmount`: amount released to freelancer (BRL)
   * - `notes`: admin notes explaining the resolution
   */
  resolution: {
    employerAmount: { type: Number, default: 0 },
    freelancerAmount: { type: Number, default: 0 },
    notes: { type: String, default: null },
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
  /** Supporting evidence URLs uploaded by either party. */
  evidenceUrls: [{
    type: String,
  }],
}, {
  timestamps: true,
});

disputeSchema.index({ jobId: 1 }, { unique: true });
disputeSchema.index({ initiatedBy: 1, createdAt: -1 });
disputeSchema.index({ status: 1 });

disputeSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Dispute', disputeSchema);
