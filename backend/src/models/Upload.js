import mongoose from 'mongoose';

const uploadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
    },
    checkinId: {
      type: String,
      default: null,
    },
    blobName: {
      type: String,
      required: true,
    },
    containerName: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'pending',
    },
    url: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Upload', uploadSchema);
