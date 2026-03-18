import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

// @route   GET /api/admin/users
// @desc    List all users (admin only)
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({}).skip(skip).limit(limit).select(
        '-password -emailVerificationToken -emailVerificationExpiry -resetPasswordToken -resetPasswordExpiry'
      ),
      User.countDocuments(),
    ]);

    res.json({ success: true, data: users, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('[admin/users]', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PATCH /api/admin/users/:id/role
// @desc    Update a user's role (admin only)
// @access  Admin
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['freelancer', 'employer', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    console.error('[admin/users/:id/role]', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
