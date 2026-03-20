import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';

const router = express.Router();

// ─── Auth-specific rate limiter (brute-force protection) ──────────────────────
const authLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many attempts, please try again later.' },
});

// ─── Shared password validation rules ─────────────────────────────────────────
const passwordRules = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function issueAccessToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRE }
  );
}

function issueRefreshToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRE }
  );
}

function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ─── Register ─────────────────────────────────────────────────────────────────

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  ...passwordRules,
  body('name').trim().notEmpty(),
  body('role').isIn(['freelancer', 'employer'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, name, role, niche, referralCode } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Resolve referral code to a referrer ID
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    // Generate email verification token
    const rawVerificationToken = generateSecureToken();
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(rawVerificationToken)
      .digest('hex');

    const user = await User.create({
      email,
      password,
      name,
      role,
      niche: niche || 'Gastronomia',
      referredBy,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      isEmailVerified: false,
    });

    // Send verification email (non-blocking – do not fail registration if it errors)
    sendVerificationEmail(user.email, rawVerificationToken).catch((err) =>
      console.error('[auth] Failed to send verification email:', err.message)
    );

    const token = issueAccessToken(user);
    const refreshToken = issueRefreshToken(user);

    res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      }
    });
  } catch (error) {
    console.error('[auth/register]', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = issueAccessToken(user);
    const refreshToken = issueRefreshToken(user);

    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      }
    });
  } catch (error) {
    console.error('[auth/login]', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── Refresh token ────────────────────────────────────────────────────────────

// @route   POST /api/auth/refresh
// @desc    Exchange a valid refresh token for a new access token
// @access  Public
router.post('/refresh', authLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'refreshToken is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ success: false, error: 'Invalid token type' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const newToken = issueAccessToken(user);
    const newRefreshToken = issueRefreshToken(user);

    res.json({ success: true, token: newToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('[auth/refresh]', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── Verify email ─────────────────────────────────────────────────────────────

// @route   POST /api/auth/verify-email
// @desc    Verify email address using the token sent during registration
// @access  Public
router.post('/verify-email', [
  body('token').trim().notEmpty().withMessage('Token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(req.body.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpiry');

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired verification token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('[auth/verify-email]', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend the email verification link
// @access  Private
router.post('/resend-verification', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, error: 'Email is already verified' });
    }

    const rawToken = generateSecureToken();
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    sendVerificationEmail(user.email, rawToken).catch((err) =>
      console.error('[auth] Failed to resend verification email:', err.message)
    );

    res.json({ success: true, message: 'Verification email resent' });
  } catch (error) {
    console.error('[auth/resend-verification]', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── Forgot / reset password ──────────────────────────────────────────────────

// @route   POST /api/auth/forgot-password
// @desc    Request a password-reset link
// @access  Public
router.post('/forgot-password', authLimiter, [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Always return 200 to avoid user enumeration
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const rawToken = generateSecureToken();
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h
      await user.save();

      sendPasswordResetEmail(user.email, rawToken).catch((err) =>
        console.error('[auth] Failed to send reset email:', err.message)
      );
    }

    res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('[auth/forgot-password]', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using the token from the reset email
// @access  Public
router.post('/reset-password', [
  body('token').trim().notEmpty().withMessage('Token is required'),
  ...passwordRules,
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(req.body.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpiry +password');

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('[auth/reset-password]', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
