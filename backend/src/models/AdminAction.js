import mongoose from 'mongoose';

/**
 * AdminAction – immutable audit log for every privileged action performed by
 * admin users. Records are append-only; never delete or update.
 */
const adminActionSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: [
        'kyc_approve',
        'kyc_reject',
        'user_ban',
        'user_unban',
        'user_update',
        'user_role_change',
        'job_remove',
        'job_boost',
        'payment_refund',
        'withdrawal_approve',
        'withdrawal_reject',
        'ticket_assign',
        'ticket_reply',
        'ticket_update',
        'ticket_resolve',
        'ticket_close',
        'review_remove',
        'company_verify',
        'company_reject',
        'contract_void',
        'system_config',
        'admin_note',
      ],
      required: true,
    },
    targetType: {
      type: String,
      enum: ['User', 'Job', 'Transaction', 'SupportTicket', 'Review', 'Contract', 'CompanyProfile', 'System'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    // Audit records must never be modified after creation
  }
);

adminActionSchema.index({ adminId: 1, createdAt: -1 });
adminActionSchema.index({ targetType: 1, targetId: 1 });
adminActionSchema.index({ action: 1, createdAt: -1 });
adminActionSchema.index({ createdAt: -1 });

export default mongoose.model('AdminAction', adminActionSchema);
