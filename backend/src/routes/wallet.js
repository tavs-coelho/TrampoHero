import express from 'express';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { env } from '../config/env.js';

const WITHDRAWAL_FEE = env.WITHDRAWAL_FEE;

const router = express.Router();

// @route   GET /api/wallet/balance
// @desc    Get wallet balance
// @access  Private
router.get('/balance', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user.wallet });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/wallet/transactions
// @desc    Get transaction history
// @access  Private
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/wallet/deposit
// @desc    Deposit funds
// @access  Private
router.post('/deposit', authenticate, async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    // Create transaction
    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'deposit',
      amount,
      description: `Depósito via ${paymentMethod === 'pix' ? 'PIX' : 'Cartão'}`,
    });

    // Update user wallet
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'wallet.balance': amount },
    });

    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/wallet/withdraw
// @desc    Request withdrawal
// @access  Private
router.post('/withdraw', authenticate, async (req, res) => {
  try {
    const { amount, pixKey } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    const user = await User.findById(req.user.id);
    if (!user || user.wallet.balance < amount) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    const fee = user.isPrime ? 0 : WITHDRAWAL_FEE;

    // Create transaction
    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'withdrawal',
      amount: -(amount + fee),
      description: `Saque PIX (${pixKey})`,
      fee,
    });

    // Update user wallet
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'wallet.balance': -(amount + fee) },
    });

    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
