import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
  },
  employer: {
    type: String,
    required: true,
  },
  employerRating: {
    type: Number,
    default: 5.0,
  },
  niche: {
    type: String,
    enum: ['Gastronomia', 'Construção', 'Eventos', 'Serviços Gerais'],
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  payment: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: 0,
  },
  paymentType: {
    type: String,
    enum: ['dia', 'hora', 'job'],
    default: 'dia',
  },
  description: {
    type: String,
    default: '',
  },
  date: {
    type: String,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'applied', 'ongoing', 'waiting_approval', 'completed', 'paid', 'cancelled'],
    default: 'open',
  },
  checkInTime: String,
  checkOutTime: String,
  proofPhoto: String,
  checkin: {
    latitude: { type: Number },
    longitude: { type: Number },
    recordedAt: { type: Date },
  },
  isAnticipated: { type: Boolean, default: false },
  isBoosted: { type: Boolean, default: false },
  isEscrowGuaranteed: { type: Boolean, default: false },
  minRatingRequired: { type: Number, default: 0 },
  escrowPaymentIntentId: { type: String, default: null },
  escrowStatus: {
    type: String,
    enum: ['none', 'held', 'released', 'refunded'],
    default: 'none',
  },
  applicants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    appliedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  }],
}, {
  timestamps: true,
});

// Index for efficient queries
jobSchema.index({ status: 1, niche: 1 });
jobSchema.index({ employerId: 1 });

export default mongoose.model('Job', jobSchema);
