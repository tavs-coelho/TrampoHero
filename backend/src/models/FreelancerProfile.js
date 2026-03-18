import mongoose from 'mongoose';

/**
 * FreelancerProfile – extended professional details for freelancers.
 * One-to-one with User (role: 'freelancer').
 */
const workHistorySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const freelancerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    headline: {
      type: String,
      default: '',
      maxlength: [140, 'Headline cannot exceed 140 characters'],
    },
    skills: {
      type: [String],
      default: [],
      validate: {
        validator: (v) => v.length <= 20,
        message: 'A maximum of 20 skills is allowed',
      },
    },
    workHistory: {
      type: [workHistorySchema],
      default: [],
    },
    availableDays: {
      type: [String],
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      default: [],
    },
    profilePhotoUrl: {
      type: String,
      default: null,
    },
    portfolioUrls: {
      type: [String],
      default: [],
      validate: {
        validator: (v) => v.length <= 10,
        message: 'A maximum of 10 portfolio items is allowed',
      },
    },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner',
    },
    hourlyRate: {
      type: Number,
      default: null,
      min: [0, 'Hourly rate cannot be negative'],
    },
    totalJobsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    cpf: {
      type: String,
      default: null,
      trim: true,
      match: [/^\d{11}$/, 'CPF must contain exactly 11 digits'],
    },
    pix: {
      keyType: { type: String, enum: ['cpf', 'phone', 'email', 'random', null], default: null },
      key: { type: String, default: null, trim: true },
    },
  },
  { timestamps: true }
);

freelancerProfileSchema.index({ userId: 1 });
freelancerProfileSchema.index({ isAvailable: 1 });
freelancerProfileSchema.index({ experienceLevel: 1 });
freelancerProfileSchema.index({ cpf: 1 }, { sparse: true });

export default mongoose.model('FreelancerProfile', freelancerProfileSchema);
