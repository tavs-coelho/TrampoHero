import mongoose from 'mongoose';

/**
 * JobApplication – tracks each individual freelancer application for a job.
 * Extracted from the embedded Job.applicants array to allow rich querying
 * and scaling independently. The legacy Job.applicants array remains for
 * backward compatibility during the migration period.
 */
const jobApplicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'withdrawn', 'cancelled'],
      default: 'pending',
    },
    coverMessage: {
      type: String,
      default: '',
      maxlength: [800, 'Cover message cannot exceed 800 characters'],
    },
    proposedRate: {
      type: Number,
      default: null,
      min: [0, 'Proposed rate cannot be negative'],
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// A freelancer can only apply once per job
jobApplicationSchema.index({ jobId: 1, freelancerId: 1 }, { unique: true });
jobApplicationSchema.index({ freelancerId: 1, status: 1 });
jobApplicationSchema.index({ jobId: 1, status: 1 });
jobApplicationSchema.index({ createdAt: -1 });

export default mongoose.model('JobApplication', jobApplicationSchema);
