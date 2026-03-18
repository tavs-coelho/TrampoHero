import express from 'express';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Withdrawal from '../models/Withdrawal.js';

const WITHDRAWAL_FEE = (() => {
  const raw = process.env.WITHDRAWAL_FEE;
  const parsed = raw === undefined ? 2.50 : Number(raw);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('Invalid WITHDRAWAL_FEE configuration: expected a non-negative number.');
  }

  return parsed;
})();
const MIN_WITHDRAWAL = 10; // Minimum BRL amount for a withdrawal request

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
// @desc    Request withdrawal – deducts from balance, creates pending Withdrawal record
// @access  Private
router.post('/withdraw', authenticate, async (req, res) => {
  try {
    const { amount, pixKey } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    if (amount < MIN_WITHDRAWAL) {
      return res.status(400).json({ success: false, error: `Minimum withdrawal amount is R$ ${MIN_WITHDRAWAL.toFixed(2)}` });
    }

    if (!pixKey || !pixKey.trim()) {
      return res.status(400).json({ success: false, error: 'PIX key is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.wallet.balance < amount) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    const fee = user.isPrime ? 0 : WITHDRAWAL_FEE;
    const netAmount = parseFloat((amount - fee).toFixed(2));

    if (netAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Net amount after fee must be positive' });
    }

    // Create the Withdrawal record (pending – awaiting gateway processing)
    const withdrawal = await Withdrawal.create({
      userId: req.user.id,
      amount,
      fee,
      netAmount,
      pixKey: pixKey.trim(),
      status: 'pending',
      gatewayProvider: process.env.PAYMENT_GATEWAY_PROVIDER ?? 'stripe',
    });

    // Record the wallet transaction
    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'withdrawal',
      status: 'pending',
      amount: -amount,
      description: `Saque PIX (${pixKey.trim()})`,
      fee,
      withdrawalId: withdrawal._id,
    });

    // Move amount from balance → scheduled (processing)
    await User.findByIdAndUpdate(req.user.id, {
      $inc: {
        'wallet.balance': -amount,
        'wallet.scheduled': amount,
      },
    });

    res.status(201).json({ success: true, data: { withdrawal, transaction } });
  } catch (error) {
    console.error('[wallet/withdraw]', error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/wallet/withdrawals
// @desc    List the user's withdrawal requests
// @access  Private
router.get('/withdrawals', authenticate, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data: withdrawals });
  } catch (error) {
    console.error('[wallet/withdrawals]', error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
