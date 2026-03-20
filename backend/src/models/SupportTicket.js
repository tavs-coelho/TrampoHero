import mongoose from 'mongoose';

/**
 * SupportTicket – customer support requests submitted by users.
 */
const ticketMessageSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorRole: {
      type: String,
      enum: ['user', 'admin'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    attachmentUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const ticketHistorySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['ticket_opened', 'status_changed', 'assigned', 'reply', 'manual_review', 'priority_changed'],
      required: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actorRole: {
      type: String,
      enum: ['user', 'admin', 'system'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    fromStatus: {
      type: String,
      default: null,
    },
    toStatus: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [150, 'Subject cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    category: {
      type: String,
      enum: ['payment', 'job', 'account', 'kyc', 'technical', 'dispute', 'fraud', 'compliance', 'other'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'waiting_user', 'manual_review', 'resolved', 'closed'],
      default: 'open',
    },
    incidentType: {
      type: String,
      enum: ['general', 'dispute_company_freelancer', 'fraud_report'],
      default: 'general',
    },
    assignedAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    messages: {
      type: [ticketMessageSchema],
      default: [],
    },
    relatedJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
    },
    relatedTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    relatedDisputeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispute',
      default: null,
    },
    slaTargetAt: {
      type: Date,
      default: null,
    },
    firstResponseAt: {
      type: Date,
      default: null,
    },
    lastResponseAt: {
      type: Date,
      default: null,
    },
    manualReviewRequired: {
      type: Boolean,
      default: false,
    },
    history: {
      type: [ticketHistorySchema],
      default: [],
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    satisfactionScore: {
      type: Number,
      default: null,
      min: [1, 'Score must be at least 1'],
      max: [5, 'Score must be at most 5'],
    },
  },
  { timestamps: true }
);

supportTicketSchema.index({ userId: 1, status: 1 });
supportTicketSchema.index({ status: 1, priority: 1 });
supportTicketSchema.index({ assignedAdminId: 1, status: 1 });
supportTicketSchema.index({ createdAt: -1 });
supportTicketSchema.index({ category: 1, slaTargetAt: 1 });
supportTicketSchema.index({ incidentType: 1, createdAt: -1 });

export default mongoose.model('SupportTicket', supportTicketSchema);
