import express from 'express';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Withdrawal from '../models/Withdrawal.js';
import { env } from '../config/env.js';

const WITHDRAWAL_FEE = env.WITHDRAWAL_FEE;
const MIN_WITHDRAWAL = env.MIN_WITHDRAWAL ?? 0;
const PAYMENT_GATEWAY_PROVIDER = env.PAYMENT_GATEWAY_PROVIDER ?? 'stripe';

const router = express.Router();

const PIX_KEY_TYPES = {
  CPF: 'cpf',
  CNPJ: 'cnpj',
  EMAIL: 'email',
  PHONE: 'phone',
  RANDOM: 'random',
};

function detectPixKeyType(pixKey) {
  if (!pixKey) return null;
  if (pixKey.includes('@')) return PIX_KEY_TYPES.EMAIL;
  const digits = pixKey.replace(/\D/g, '');
  if (digits.length === 11) return PIX_KEY_TYPES.CPF;
  if (digits.length === 14) return PIX_KEY_TYPES.CNPJ;
  if (digits.length === 13 && digits.startsWith('55')) return PIX_KEY_TYPES.PHONE;
  return PIX_KEY_TYPES.RANDOM;
}

function maskPixKey(pixKey) {
  if (!pixKey) return '';
  const trimmed = pixKey.trim();
  if (!trimmed) return '';
  if (trimmed.includes('@')) {
    const atIndex = trimmed.indexOf('@');
    const localPart = trimmed.slice(0, atIndex);
    const domain = trimmed.slice(atIndex + 1);
    const firstChar = localPart[0] ?? '*';
    const domainParts = domain?.split('.') ?? [];
    const baseDomain = domainParts[0] ?? '';
    const tld = domainParts.length > 1 ? domainParts.slice(1).join('.') : '';
    const maskedDomain = baseDomain
      ? `${baseDomain[0]}${'*'.repeat(Math.max(baseDomain.length - 1, 0))}`
      : '***';
    return `${firstChar}***@${maskedDomain}${tld ? `.${tld}` : ''}`;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length >= 4) {
    return `***${digits.slice(-4)}`;
  }
  if (trimmed.length <= 4) return '***';
  return `${'*'.repeat(trimmed.length - 4)}${trimmed.slice(-4)}`;
}

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
    if (!pixKey || typeof pixKey !== 'string' || !pixKey.trim()) {
      return res.status(400).json({ success: false, error: 'PIX key is required' });
    }
    if (amount < MIN_WITHDRAWAL) {
      return res.status(400).json({
        success: false,
        error: `Minimum withdrawal amount is R$ ${MIN_WITHDRAWAL.toFixed(2)}`,
      });
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
    const pixKeyMasked = maskPixKey(pixKey);
    const pixKeyType = detectPixKeyType(pixKey);

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
      gatewayProvider: PAYMENT_GATEWAY_PROVIDER,
    });

    // Record the wallet transaction
    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'withdrawal',
      status: 'pending',
      amount: -amount,
      description: `Saque PIX (${pixKeyMasked})`,
      fee,
      withdrawalId: withdrawal._id,
      pixKeyMasked,
      pixKeyType,
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
