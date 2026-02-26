import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Challenge title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Challenge description is required'],
  },
  icon: {
    type: String,
    default: 'fa-fire',
  },
  reward: {
    type: {
      type: String,
      enum: ['cash', 'coins', 'medal'],
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  requirement: {
    type: {
      type: String,
      enum: ['jobs_completed', 'referrals', 'rating_maintained', 'courses_completed', 'consecutive_days'],
      required: true,
    },
    target: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    current: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
    claimedAt: { type: Date, default: null },
  }],
}, {
  timestamps: true,
});

// Index for efficient queries
challengeSchema.index({ isActive: 1, endDate: 1 });
challengeSchema.index({ 'participants.userId': 1 });

export default mongoose.model('Challenge', challengeSchema);
