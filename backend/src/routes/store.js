import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

const router = express.Router();

// @route   GET /api/store/products
// @desc    Get store products
// @access  Public
router.get('/products', async (req, res) => {
  try {
    const { category, niche, inStock } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (niche) filter.relatedNiches = niche;
    if (inStock === 'true') filter.inStock = true;

    const products = await Product.find(filter).sort({ rating: -1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/store/products/:id
// @desc    Get single product
// @access  Public
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/store/orders
// @desc    Create order
// @access  Private
router.post('/orders', authenticate, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Order must contain at least one item' });
    }

    // Validate products and calculate total
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = productMap.get(item.productId.toString ? item.productId.toString() : item.productId);
      if (!product) {
        return res.status(404).json({ success: false, error: `Product ${item.productId} not found` });
      }
      if (!product.inStock) {
        return res.status(400).json({ success: false, error: `Product "${product.name}" is out of stock` });
      }

      const quantity = item.quantity || 1;
      total += product.price * quantity;
      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity,
      });
    }

    const order = await Order.create({
      userId: req.user.id,
      items: orderItems,
      total: Math.round(total * 100) / 100,
      shippingAddress,
      paymentMethod: paymentMethod || 'pix',
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/store/orders
// @desc    Get user orders
// @access  Private
router.get('/orders', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/store/orders/:id
// @desc    Get single order
// @access  Private
router.get('/orders/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
