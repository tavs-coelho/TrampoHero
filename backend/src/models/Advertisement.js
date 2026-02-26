import mongoose from 'mongoose';

const advertisementSchema = new mongoose.Schema({
  advertiserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  advertiserName: {
    type: String,
    required: [true, 'Advertiser name is required'],
  },
  type: {
    type: String,
    enum: ['banner', 'sponsored_post', 'featured_listing'],
    required: true,
  },
  content: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    ctaText: { type: String, default: '' },
    ctaUrl: { type: String, default: '' },
  },
  targeting: {
    niches: [{
      type: String,
      enum: ['Gastronomia', 'Construção', 'Eventos', 'Serviços Gerais'],
    }],
    userActivity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  budget: {
    type: Number,
    required: [true, 'Budget is required'],
    min: 0,
  },
  spent: {
    type: Number,
    default: 0,
  },
  impressions: {
    type: Number,
    default: 0,
  },
  clicks: {
    type: Number,
    default: 0,
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
}, {
  timestamps: true,
});

// Index for efficient queries
advertisementSchema.index({ advertiserId: 1 });
advertisementSchema.index({ isActive: 1, endDate: 1 });
advertisementSchema.index({ 'targeting.niches': 1 });

export default mongoose.model('Advertisement', advertisementSchema);
