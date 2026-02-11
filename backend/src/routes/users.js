import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  try {
    // TODO: Get user from database
    res.json({ success: true, data: { id: req.user.id } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, async (req, res) => {
  try {
    // TODO: Update user in database
    res.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
