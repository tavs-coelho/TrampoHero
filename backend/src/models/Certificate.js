import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  courseTitle: {
    type: String,
    required: true,
  },
  issuer: {
    type: String,
    default: 'TrampoHero Academy',
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  certificateNumber: {
    type: String,
    required: true,
    unique: true,
  },
}, {
  timestamps: true,
});

// Generate certificate number before saving
certificateSchema.pre('save', function(next) {
  if (!this.certificateNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.certificateNumber = `TH-${timestamp}-${random}`;
  }
  next();
});

export default mongoose.model('Certificate', certificateSchema);
