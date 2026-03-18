import mongoose from 'mongoose';

/**
 * Contract – persists each digital contract generated at job completion.
 * The PDF itself is stored on Azure Blob / local filesystem; this record
 * tracks the metadata and proof of signature.
 */
const contractSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      unique: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pdfUrl: {
      type: String,
      required: [true, 'PDF URL is required'],
    },
    validationHash: {
      type: String,
      required: [true, 'Validation hash is required'],
      unique: true,
    },
    status: {
      type: String,
      enum: ['generated', 'signed_freelancer', 'signed_employer', 'signed_both', 'disputed', 'voided'],
      default: 'generated',
    },
    freelancerSignedAt: {
      type: Date,
      default: null,
    },
    employerSignedAt: {
      type: Date,
      default: null,
    },
    value: {
      type: Number,
      required: true,
      min: [0, 'Contract value cannot be negative'],
    },
    paymentType: {
      type: String,
      enum: ['dia', 'hora', 'job'],
      required: true,
    },
    jobDate: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

contractSchema.index({ jobId: 1 });
contractSchema.index({ freelancerId: 1 });
contractSchema.index({ employerId: 1 });
contractSchema.index({ validationHash: 1 });
contractSchema.index({ status: 1 });

export default mongoose.model('Contract', contractSchema);
