import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['freelancer', 'employer'],
    required: true,
  },
  bio: {
    type: String,
    default: '',
  },
  niche: {
    type: String,
    enum: ['Gastronomia', 'Construção', 'Eventos', 'Serviços Gerais'],
    default: 'Gastronomia',
  },
  rating: {
    type: Number,
    default: 5.0,
    min: 0,
    max: 5,
  },
  tier: {
    type: String,
    enum: ['Free', 'Pro', 'Ultra'],
    default: 'Free',
  },
  isPrime: {
    type: Boolean,
    default: false,
  },
  wallet: {
    balance: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    scheduled: { type: Number, default: 0 },
  },
  activeJobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null,
  },
  medals: [{
    medalId: String,
    name: String,
    icon: String,
    color: String,
    description: String,
    isCertified: { type: Boolean, default: false },
    earnedAt: { type: Date, default: Date.now },
  }],
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  referralBonusPaid: {
    type: Boolean,
    default: false,
  },
  analyticsAccess: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free',
  },
  trampoCoins: {
    balance: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now },
    streakBonus: { type: Boolean, default: false },
  },
  subscription: {
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    plan: { type: String, enum: ['none', 'hero_prime'], default: 'none' },
    status: { type: String, enum: ['active', 'canceled', 'past_due', 'none'], default: 'none' },
    currentPeriodEnd: { type: Date, default: null },
  },
  kyc: {
    status: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted',
    },
    documentFrontUrl: { type: String, default: null },
    documentBackUrl: { type: String, default: null },
    selfieUrl: { type: String, default: null },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
  },
  pushDevices: [{
    deviceToken: { type: String, required: true },
    platform: { type: String, enum: ['apns', 'fcmv1'], required: true },
    tags: [{ type: String }],
    updatedAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate referral code on creation
userSchema.pre('save', function(next) {
  if (!this.referralCode) {
    const namePart = this.name.split(' ')[0].toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.referralCode = `${namePart}-HERO-${randomPart}`;
  }
  next();
});

export default mongoose.model('User', userSchema);
