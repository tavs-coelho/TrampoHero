import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  }],
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['pix', 'card', 'wallet'],
    default: 'pix',
  },
}, {
  timestamps: true,
});

// Index for efficient queries
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

export default mongoose.model('Order', orderSchema);
