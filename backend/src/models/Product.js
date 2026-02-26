import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  category: {
    type: String,
    enum: ['uniform', 'epi', 'tools', 'accessories'],
    required: true,
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: 0,
  },
  originalPrice: {
    type: Number,
    default: null,
  },
  description: {
    type: String,
    default: '',
  },
  imageUrl: {
    type: String,
    default: '',
  },
  inStock: {
    type: Boolean,
    default: true,
  },
  relatedNiches: [{
    type: String,
    enum: ['Gastronomia', 'Construção', 'Eventos', 'Serviços Gerais'],
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
productSchema.index({ category: 1, inStock: 1 });
productSchema.index({ relatedNiches: 1 });

export default mongoose.model('Product', productSchema);
