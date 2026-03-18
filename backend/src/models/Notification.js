import mongoose from 'mongoose';

/**
 * Notification – persists in-app notifications for users.
 * Push delivery is handled by Azure Notification Hubs; this model
 * records each notification so users can see a notification inbox.
 */
const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'job_approved',
        'job_completed',
        'job_cancelled',
        'new_applicant',
        'application_approved',
        'application_rejected',
        'payment_received',
        'withdrawal_processed',
        'withdrawal_failed',
        'review_received',
        'contract_generated',
        'kyc_approved',
        'kyc_rejected',
        'support_reply',
        'system',
        'referral_bonus',
        'challenge_completed',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    body: {
      type: String,
      required: true,
      maxlength: [300, 'Body cannot exceed 300 characters'],
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    relatedJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
