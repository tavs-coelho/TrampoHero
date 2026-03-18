import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import AdminAction from '../models/AdminAction.js';
import Job from '../models/Job.js';
import Review from '../models/Review.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

const router = express.Router();

// Escape special characters in a string intended for use in a RegExp.
// This helps avoid unexpected regex behavior and excessive backtracking
// from user-controlled input.
const escapeRegex = (value) =>
  typeof value === 'string'
    ? value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    : value;

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

// ─── Admin Audit Logs ──────────────────────────────────────────────────────────

// @route   GET /api/admin/actions
// @desc    List admin audit log entries (paginated)
// @access  Admin
router.get(
  '/actions',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('action').optional().isString(),
    query('adminId').optional().isMongoId(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const page = req.query.page ?? 1;
      const limit = req.query.limit ?? 20;
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
      console.error('[GET /admin/actions]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

// @route   GET /api/admin/stats
// @desc    Platform overview (users, jobs, revenue)
// @access  Admin
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      freelancerCount,
      employerCount,
      totalJobs,
      openJobs,
      completedJobs,
      pendingKyc,
      recentTransactions,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: 'freelancer' }),
      User.countDocuments({ role: 'employer' }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'open' }),
      Job.countDocuments({ status: { $in: ['completed', 'paid'] } }),
      User.countDocuments({ 'kyc.status': 'pending' }),
      Transaction.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const revenueAgg = await Transaction.aggregate([
      { $match: { type: { $in: ['fee_charge', 'subscription'] }, amount: { $lt: 0 } } },
      { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total ?? 0;

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, freelancers: freelancerCount, employers: employerCount },
        jobs: { total: totalJobs, open: openJobs, completed: completedJobs },
        kyc: { pendingReview: pendingKyc },
        revenue: { total: totalRevenue },
        recentTransactions,
      },
    });
  } catch (error) {
    console.error('[GET /admin/stats]', error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── User Management ──────────────────────────────────────────────────────────

// @route   GET /api/admin/users
// @desc    List all users with optional filters
// @access  Admin
router.get(
  '/users',
  [
    query('role').optional().isIn(['freelancer', 'employer', 'admin']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().trim().isLength({ max: 100 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { role } = req.query;
      const rawSearch = req.query.search;
      const search = typeof rawSearch === 'string' ? rawSearch : '';
      const page = req.query.page ?? 1;
      const limit = req.query.limit ?? 20;
      const skip = (page - 1) * limit;

      const filter = {};
      if (role) filter.role = role;
      if (search) {
        const safeSearch = escapeRegex(search);
        filter.$or = [
          { name: { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } },
        ];
      }

      const [users, total] = await Promise.all([
        User.find(filter)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: users,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      console.error('[GET /admin/users]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   GET /api/admin/users/:id
// @desc    Get user details
// @access  Admin
router.get(
  '/users/:id',
  [param('id').isMongoId().withMessage('Invalid user id')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const user = await User.findById(req.params.id).select('-password').lean();
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      res.json({ success: true, data: user });
    } catch (error) {
      console.error('[GET /admin/users/:id]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   PATCH /api/admin/users/:id
// @desc    Update a user (tier, isPrime, suspend, etc.)
// @access  Admin
router.patch(
  '/users/:id',
  [
    param('id').isMongoId().withMessage('Invalid user id'),
    body('tier').optional().isIn(['Free', 'Pro', 'Ultra']),
    body('isPrime').optional().isBoolean(),
    body('analyticsAccess').optional().isIn(['free', 'premium']),
    body('niche').optional().trim().isLength({ max: 50 }),
    body('bio').optional().trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const allowedFields = ['tier', 'isPrime', 'analyticsAccess', 'bio', 'niche'];
      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      const user = await User.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
      }).select('-password');

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      res.json({ success: true, data: user });
    } catch (error) {
      console.error('[PATCH /admin/users/:id]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   PUT /api/admin/users/:id/ban
// @desc    Ban a user
// @access  Admin
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
      console.error('[PUT /admin/users/:id/ban]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   PUT /api/admin/users/:id/unban
// @desc    Unban a user
// @access  Admin
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
      console.error('[PUT /admin/users/:id/unban]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// ─── Job Management ───────────────────────────────────────────────────────────

// @route   GET /api/admin/jobs
// @desc    List all jobs with optional filters
// @access  Admin
router.get(
  '/jobs',
  [
    query('status').optional().isIn(['open', 'applied', 'ongoing', 'completed', 'waiting_approval', 'paid', 'cancelled']),
    query('niche').optional().trim(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { status, niche } = req.query;
      const page = req.query.page ?? 1;
      const limit = req.query.limit ?? 20;
      const skip = (page - 1) * limit;

      const filter = {};
      if (status) filter.status = status;
      if (niche) filter.niche = niche;

      const [jobs, total] = await Promise.all([
        Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Job.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: jobs,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      console.error('[GET /admin/jobs]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   DELETE /api/admin/jobs/:id
// @desc    Remove a job (e.g. spam/inappropriate)
// @access  Admin
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

      res.json({ success: true, message: 'Job removed successfully' });
    } catch (error) {
      console.error('[DELETE /admin/jobs/:id]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   DELETE /api/admin/reviews/:id
// @desc    Remove a review (admin)
// @access  Admin
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
      console.error('[DELETE /admin/reviews/:id]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// ─── KYC Management ───────────────────────────────────────────────────────────

// @route   GET /api/admin/kyc
// @desc    List KYC submissions awaiting review
// @access  Admin
router.get(
  '/kyc',
  [query('status').optional().isIn(['pending', 'approved', 'rejected', 'not_submitted'])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const status = req.query.status ?? 'pending';
      const users = await User.find({ 'kyc.status': status })
        .select('name email kyc createdAt')
        .sort({ 'kyc.submittedAt': 1 })
        .lean();

      res.json({ success: true, count: users.length, data: users });
    } catch (error) {
      console.error('[GET /admin/kyc]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   PATCH /api/admin/kyc/:userId
// @desc    Approve or reject a KYC submission
// @access  Admin
router.patch(
  '/kyc/:userId',
  [
    param('userId').isMongoId().withMessage('Invalid user id'),
    body('decision').isIn(['approved', 'rejected']).withMessage('decision must be "approved" or "rejected"'),
    body('rejectionReason').if(body('decision').equals('rejected')).notEmpty().withMessage('rejectionReason is required when rejecting'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { decision, rejectionReason } = req.body;

      const update = {
        'kyc.status': decision,
        'kyc.reviewedAt': new Date(),
      };
      if (decision === 'rejected' && rejectionReason) {
        update['kyc.rejectionReason'] = rejectionReason;
      }

      const user = await User.findOneAndUpdate(
        { _id: req.params.userId, 'kyc.status': 'pending' },
        update,
        { new: true }
      ).select('name email kyc');

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found or KYC not pending' });
      }

      res.json({ success: true, data: user });
    } catch (error) {
      console.error('[PATCH /admin/kyc/:userId]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

export default router;
