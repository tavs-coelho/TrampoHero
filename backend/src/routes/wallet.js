import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/wallet/balance
// @desc    Get wallet balance
// @access  Private
router.get('/balance', authenticate, async (req, res) => {
  try {
    // TODO: Get wallet from database
    const wallet = {
      balance: 1250.40,
      pending: 300,
      scheduled: 180
    };
    res.json({ success: true, data: wallet });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/wallet/withdraw
// @desc    Request withdrawal
// @access  Private
router.post('/withdraw', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;
    // TODO: Process withdrawal
    res.json({ success: true, message: 'Withdrawal requested' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
