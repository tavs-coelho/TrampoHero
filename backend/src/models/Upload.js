import mongoose from 'mongoose';

/**
 * Tracks a file uploaded to Azure Blob Storage via a SAS URL.
 */
const uploadSchema = new mongoose.Schema(
  {
    /** The Azure Blob Storage blob name (unique within the container). */
    blobName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    /** Publicly accessible blob URL (after upload completes). */
    blobUrl: {
      type: String,
      required: true,
      trim: true,
    },
    /** MIME type declared by the client at SAS-request time. */
    contentType: {
      type: String,
      required: true,
      trim: true,
    },
    /** Upload category for routing/display purposes. */
    category: {
      type: String,
      enum: ['job-proof', 'profile-photo', 'check-in'],
      required: true,
    },
    /** Uploading user. */
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    /** Optional: job this upload is associated with. */
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
    },
    /** Whether the client has confirmed the upload completed. */
    confirmed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Upload', uploadSchema);
