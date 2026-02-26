import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating must be at most 5'],
  },
  comment: {
    type: String,
    default: '',
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters'],
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
}, {
  timestamps: true,
});

// Prevent duplicate reviews for the same job by the same author
reviewSchema.index({ authorId: 1, jobId: 1 }, { unique: true });
reviewSchema.index({ targetId: 1 });

export default mongoose.model('Review', reviewSchema);
