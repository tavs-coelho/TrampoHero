import express from 'express';
import { query, param, body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import AdminAction from '../models/AdminAction.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Review from '../models/Review.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

// @route   GET /api/admin/actions
// @desc    List admin audit log entries (paginated)
// @access  Private (admin)
router.get(
  '/actions',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('action').optional().isString(),
    query('adminId').optional().isMongoId(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const filter = {};
      if (req.query.action) filter.action = req.query.action;
      if (req.query.adminId) filter.adminId = req.query.adminId;

      const [actions, total] = await Promise.all([
        AdminAction.find(filter)
          .populate('adminId', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        AdminAction.countDocuments(filter),
      ]);

      res.json({
        success: true,
        count: actions.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        data: actions,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   PUT /api/admin/users/:id/ban
// @desc    Ban a user
// @access  Private (admin)
router.put(
  '/users/:id/ban',
  [
    param('id').isMongoId().withMessage('Invalid user id'),
    body('reason').optional().isString().isLength({ max: 500 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      if (user.role === 'admin') {
        return res.status(400).json({ success: false, error: 'Cannot ban an admin user' });
      }

      user.isBanned = true;
      user.bannedAt = new Date();
      user.banReason = req.body.reason || null;
      await user.save();

      await AdminAction.create({
        adminId: req.user.id,
        action: 'user_ban',
        targetType: 'User',
        targetId: user._id,
        details: { reason: req.body.reason || null },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      });

      res.json({ success: true, message: 'User banned', data: { userId: user._id } });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   PUT /api/admin/users/:id/unban
// @desc    Unban a user
// @access  Private (admin)
router.put(
  '/users/:id/unban',
  [param('id').isMongoId().withMessage('Invalid user id')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      user.isBanned = false;
      user.bannedAt = null;
      user.banReason = null;
      await user.save();

      await AdminAction.create({
        adminId: req.user.id,
        action: 'user_unban',
        targetType: 'User',
        targetId: user._id,
        details: {},
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      });

      res.json({ success: true, message: 'User unbanned', data: { userId: user._id } });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   DELETE /api/admin/jobs/:id
// @desc    Remove a job (admin)
// @access  Private (admin)
router.delete(
  '/jobs/:id',
  [
    param('id').isMongoId().withMessage('Invalid job id'),
    body('reason').optional().isString().isLength({ max: 500 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const job = await Job.findById(req.params.id);
      if (!job) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      await job.deleteOne();

      await AdminAction.create({
        adminId: req.user.id,
        action: 'job_remove',
        targetType: 'Job',
        targetId: job._id,
        details: { reason: req.body.reason || null },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      });

      res.json({ success: true, message: 'Job removed' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   DELETE /api/admin/reviews/:id
// @desc    Remove a review (admin)
// @access  Private (admin)
router.delete(
  '/reviews/:id',
  [
    param('id').isMongoId().withMessage('Invalid review id'),
    body('reason').optional().isString().isLength({ max: 500 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const review = await Review.findById(req.params.id);
      if (!review) {
        return res.status(404).json({ success: false, error: 'Review not found' });
      }

      await review.deleteOne();

      await AdminAction.create({
        adminId: req.user.id,
        action: 'review_remove',
        targetType: 'Review',
        targetId: review._id,
        details: { reason: req.body.reason || null },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      });

      res.json({ success: true, message: 'Review removed' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

export default router;
