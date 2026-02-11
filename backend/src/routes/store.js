import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/store/products
// @desc    Get store products
// @access  Public
router.get('/products', async (req, res) => {
  try {
    const { category, niche } = req.query;
    
    // TODO: Get products from database
    const products = [
      {
        id: 'p1',
        name: 'Kit Garçom Profissional',
        category: 'uniform',
        price: 89.90,
        inStock: true
      }
    ];
    
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/store/orders
// @desc    Create order
// @access  Private
router.post('/orders', authenticate, async (req, res) => {
  try {
    const { products, shippingAddress } = req.body;
    
    // TODO: Create order in database
    const order = {
      id: 'order-' + Date.now(),
      userId: req.user.id,
      products,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
