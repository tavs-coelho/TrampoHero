import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

const PUSH_PLATFORMS = ['apns', 'fcmv1'];

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  authenticate,
  [
    body('name').optional().trim().notEmpty().withMessage('name cannot be blank').isLength({ max: 100 }).withMessage('name must be at most 100 characters'),
    body('bio').optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage('bio must be at most 500 characters'),
    body('niche').optional().trim().notEmpty().withMessage('niche cannot be blank').isLength({ max: 100 }).withMessage('niche must be at most 100 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const allowedFields = ['name', 'bio', 'niche'];
      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   POST /api/users/push-device
// @desc    Register or update a device push token for the authenticated user
// @access  Private
router.post(
  '/push-device',
  authenticate,
  [
    body('deviceToken').isString().trim().notEmpty().withMessage('deviceToken is required'),
    body('platform').isIn(PUSH_PLATFORMS).withMessage(`platform must be one of: ${PUSH_PLATFORMS.join(', ')}`),
    body('tags').optional().isArray().withMessage('tags must be an array'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { deviceToken, platform, tags = [] } = req.body;

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Upsert: replace existing entry for this token, or push a new one
      const existingIndex = user.pushDevices.findIndex((d) => d.deviceToken === deviceToken);
      if (existingIndex >= 0) {
        user.pushDevices[existingIndex].platform = platform;
        user.pushDevices[existingIndex].tags = tags;
        user.pushDevices[existingIndex].updatedAt = new Date();
      } else {
        user.pushDevices.push({ deviceToken, platform, tags, updatedAt: new Date() });
      }

      await user.save();

      return res.status(201).json({
        success: true,
        data: { userId: user._id, deviceToken, platform, tags },
      });
    } catch (error) {
      console.error('[POST /users/push-device]', error.message);
      return res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

export default router;
