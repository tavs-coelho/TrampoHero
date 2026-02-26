import express from 'express';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

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
router.put('/profile', authenticate, async (req, res) => {
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
});

// @route   POST /api/users/push-device
// @desc    Register or refresh a push device token and tags
// @access  Private
router.post('/push-device', authenticate, async (req, res) => {
  try {
    const { deviceToken, platform } = req.body;

    if (!deviceToken || !platform) {
      return res.status(400).json({
        success: false,
        error: 'deviceToken and platform are required',
      });
    }

    if (!['android', 'ios'].includes(platform)) {
      return res.status(400).json({
        success: false,
        error: 'platform must be "android" or "ios"',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Replace existing entry for this token (upsert by token)
    user.pushDevices = user.pushDevices.filter(d => d.token !== deviceToken);
    user.pushDevices.push({ token: deviceToken, platform, registeredAt: new Date() });
    // Keep at most 10 device entries per user (drop oldest first)
    if (user.pushDevices.length > 10) {
      user.pushDevices = user.pushDevices.slice(-10);
    }
    await user.save();

    res.json({ success: true });
  } catch (error) {
    console.error('[push-device] Error registering push token:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
