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
