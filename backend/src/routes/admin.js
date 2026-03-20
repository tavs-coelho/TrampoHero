import express from 'express';
import { query, param, body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import AdminAction from '../models/AdminAction.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import JobApplication from '../models/JobApplication.js';
import Contract from '../models/Contract.js';
import Review from '../models/Review.js';
import Transaction from '../models/Transaction.js';
import SupportTicket from '../models/SupportTicket.js';

const router = express.Router();
const userSensitiveFields =
  '-password -emailVerificationToken -emailVerificationExpiry -resetPasswordToken -resetPasswordExpiry';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

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
      openTickets,
      recentTransactions,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: 'freelancer' }),
      User.countDocuments({ role: 'employer' }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'open' }),
      Job.countDocuments({ status: { $in: ['completed', 'paid'] } }),
      User.countDocuments({ 'kyc.status': 'pending' }),
      SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
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
        tickets: { open: openTickets },
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
      const page = Math.max(1, Number(req.query.page ?? 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
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
          .select(userSensitiveFields)
          .sort({ createdAt: -1, _id: -1 })
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
      const user = await User.findById(req.params.id).select(userSensitiveFields).lean();
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
// @desc    Update a user (tier, isPrime, analyticsAccess, bio, niche)
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
      }).select(userSensitiveFields);

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      await AdminAction.create({
        adminId: req.user.id,
        action: 'user_update',
        targetType: 'User',
        targetId: user._id,
        details: { updates },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      });

      res.json({ success: true, data: user });
    } catch (error) {
      console.error('[PATCH /admin/users/:id]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   PATCH /api/admin/users/:id/role
// @desc    Update a user's role
// @access  Admin
router.patch(
  '/users/:id/role',
  [param('id').isMongoId(), body('role').isIn(['freelancer', 'employer', 'admin'])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { role } = req.body;
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      await AdminAction.create({
        adminId: req.user.id,
        action: 'user_role_change',
        targetType: 'User',
        targetId: user._id,
        details: { newRole: role },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      });

      res.json({ success: true, data: { id: user._id, email: user.email, role: user.role } });
    } catch (error) {
      console.error('[PATCH /admin/users/:id/role]', error.message);
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
      const page = Math.max(1, Number(req.query.page ?? 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
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
// @desc    Remove a job (admin)
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

      res.json({ success: true, message: 'Job removed' });
    } catch (error) {
      console.error('[DELETE /admin/jobs/:id]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// ─── Job Applications ─────────────────────────────────────────────────────────

// @route   GET /api/admin/applications
// @desc    List all job applications with optional filters
// @access  Admin
router.get(
  '/applications',
  [
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'withdrawn', 'cancelled']),
    query('jobId').optional().isMongoId(),
    query('freelancerId').optional().isMongoId(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { status, jobId, freelancerId } = req.query;
      const page = Math.max(1, Number(req.query.page ?? 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
      const skip = (page - 1) * limit;

      const filter = {};
      if (status) filter.status = status;
      if (jobId) filter.jobId = jobId;
      if (freelancerId) filter.freelancerId = freelancerId;

      const [applications, total] = await Promise.all([
        JobApplication.find(filter)
          .populate('jobId', 'title niche payment status')
          .populate('freelancerId', 'name email rating')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        JobApplication.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: applications,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      console.error('[GET /admin/applications]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// ─── Contracts ────────────────────────────────────────────────────────────────

// @route   GET /api/admin/contracts
// @desc    List all contracts with optional filters
// @access  Admin
router.get(
  '/contracts',
  [
    query('status').optional().isIn(['generated', 'signed_freelancer', 'signed_employer', 'signed_both', 'disputed', 'voided']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { status } = req.query;
      const page = Math.max(1, Number(req.query.page ?? 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
      const skip = (page - 1) * limit;

      const filter = {};
      if (status) filter.status = status;

      const [contracts, total] = await Promise.all([
        Contract.find(filter)
          .populate('jobId', 'title niche')
          .populate('freelancerId', 'name email')
          .populate('employerId', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Contract.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: contracts,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      console.error('[GET /admin/contracts]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// ─── Transactions / Payments ──────────────────────────────────────────────────

// @route   GET /api/admin/transactions
// @desc    List all platform transactions
// @access  Admin
router.get(
  '/transactions',
  [
    query('type').optional().isString(),
    query('userId').optional().isMongoId(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { type, userId } = req.query;
      const page = Math.max(1, Number(req.query.page ?? 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
      const skip = (page - 1) * limit;

      const filter = {};
      if (type) filter.type = type;
      if (userId) filter.userId = userId;

      const [transactions, total] = await Promise.all([
        Transaction.find(filter)
          .populate('userId', 'name email role')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Transaction.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: transactions,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      console.error('[GET /admin/transactions]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// ─── Review Management ────────────────────────────────────────────────────────

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
// @desc    List KYC submissions by status
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
    body('rejectionReason')
      .if(body('decision').equals('rejected'))
      .notEmpty()
      .withMessage('rejectionReason is required when rejecting'),
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

      await AdminAction.create({
        adminId: req.user.id,
        action: decision === 'approved' ? 'kyc_approve' : 'kyc_reject',
        targetType: 'User',
        targetId: user._id,
        details: { decision, rejectionReason: rejectionReason || null },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      });

      res.json({ success: true, data: user });
    } catch (error) {
      console.error('[PATCH /admin/kyc/:userId]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// ─── Support Tickets ──────────────────────────────────────────────────────────

// @route   GET /api/admin/tickets
// @desc    List all support tickets with optional filters
// @access  Admin
router.get(
  '/tickets',
  [
    query('status').optional().isIn(['open', 'in_progress', 'waiting_user', 'resolved', 'closed']),
    query('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    query('category').optional().isIn(['payment', 'job', 'account', 'kyc', 'technical', 'other']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { status, priority, category } = req.query;
      const page = Math.max(1, Number(req.query.page ?? 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
      const skip = (page - 1) * limit;

      const filter = {};
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (category) filter.category = category;

      const [tickets, total] = await Promise.all([
        SupportTicket.find(filter)
          .populate('userId', 'name email role')
          .populate('assignedAdminId', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        SupportTicket.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: tickets,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      console.error('[GET /admin/tickets]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   GET /api/admin/tickets/:id
// @desc    Get a single support ticket with full message thread
// @access  Admin
router.get(
  '/tickets/:id',
  [param('id').isMongoId().withMessage('Invalid ticket id')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const ticket = await SupportTicket.findById(req.params.id)
        .populate('userId', 'name email role')
        .populate('assignedAdminId', 'name email')
        .lean();

      if (!ticket) {
        return res.status(404).json({ success: false, error: 'Ticket not found' });
      }

      res.json({ success: true, data: ticket });
    } catch (error) {
      console.error('[GET /admin/tickets/:id]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   PATCH /api/admin/tickets/:id
// @desc    Update ticket status or assign to an admin
// @access  Admin
router.patch(
  '/tickets/:id',
  [
    param('id').isMongoId().withMessage('Invalid ticket id'),
    body('status').optional().isIn(['open', 'in_progress', 'waiting_user', 'resolved', 'closed']),
    body('assignedAdminId').optional().isMongoId(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const allowedFields = ['status', 'assignedAdminId', 'priority'];
      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (updates.status === 'resolved') updates.resolvedAt = new Date();
      if (updates.status === 'closed') updates.closedAt = new Date();

      const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, updates, { new: true })
        .populate('userId', 'name email role')
        .populate('assignedAdminId', 'name email');

      if (!ticket) {
        return res.status(404).json({ success: false, error: 'Ticket not found' });
      }

      const actionType = updates.assignedAdminId
        ? 'ticket_assign'
        : updates.status === 'resolved'
        ? 'ticket_resolve'
        : updates.status === 'closed'
        ? 'ticket_close'
        : 'ticket_update';

      await AdminAction.create({
        adminId: req.user.id,
        action: actionType,
        targetType: 'SupportTicket',
        targetId: ticket._id,
        details: { updates },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      });

      res.json({ success: true, data: ticket });
    } catch (error) {
      console.error('[PATCH /admin/tickets/:id]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   POST /api/admin/tickets/:id/reply
// @desc    Add an admin reply to a support ticket
// @access  Admin
router.post(
  '/tickets/:id/reply',
  [
    param('id').isMongoId().withMessage('Invalid ticket id'),
    body('message').notEmpty().isString().isLength({ max: 2000 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const ticket = await SupportTicket.findById(req.params.id);
      if (!ticket) {
        return res.status(404).json({ success: false, error: 'Ticket not found' });
      }

      ticket.messages.push({
        authorId: req.user.id,
        authorRole: 'admin',
        message: req.body.message,
      });

      if (ticket.status === 'open') {
        ticket.status = 'in_progress';
      }

      await ticket.save();

      await AdminAction.create({
        adminId: req.user.id,
        action: 'ticket_reply',
        targetType: 'SupportTicket',
        targetId: ticket._id,
        details: { messageLength: req.body.message.length },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      });

      res.json({ success: true, data: ticket });
    } catch (error) {
      console.error('[POST /admin/tickets/:id/reply]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// ─── Audit Log ────────────────────────────────────────────────────────────────

// @route   GET /api/admin/actions
// @desc    List admin audit log entries (paginated)
// @access  Admin
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
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
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

export default router;
