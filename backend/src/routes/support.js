import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import SupportTicket from '../models/SupportTicket.js';
import AdminAction from '../models/AdminAction.js';

const router = express.Router();

const CATEGORIES = ['payment', 'job', 'account', 'kyc', 'technical', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

// @route   POST /api/support
// @desc    Open a new support ticket
// @access  Private
router.post(
  '/',
  authenticate,
  [
    body('subject').trim().notEmpty().withMessage('subject is required').isLength({ max: 150 }),
    body('description').trim().notEmpty().withMessage('description is required').isLength({ max: 3000 }),
    body('category').isIn(CATEGORIES).withMessage(`category must be one of: ${CATEGORIES.join(', ')}`),
    body('priority').optional().isIn(PRIORITIES).withMessage(`priority must be one of: ${PRIORITIES.join(', ')}`),
    body('relatedJobId').optional().isMongoId(),
    body('relatedTransactionId').optional().isMongoId(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { subject, description, category, priority, relatedJobId, relatedTransactionId } = req.body;

      const ticket = await SupportTicket.create({
        userId: req.user.id,
        subject,
        description,
        category,
        priority: priority || 'medium',
        relatedJobId: relatedJobId || null,
        relatedTransactionId: relatedTransactionId || null,
        messages: [
          {
            authorId: req.user.id,
            authorRole: 'user',
            message: description,
          },
        ],
      });

      res.status(201).json({ success: true, data: ticket });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   GET /api/support
// @desc    List support tickets for the authenticated user (or all for admin)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const { status } = req.query;
    if (status) query.status = status;

    const tickets = await SupportTicket.find(query)
      .populate('userId', 'name email role')
      .populate('assignedAdminId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/support/:id
// @desc    Get a single ticket (owner or admin)
// @access  Private
router.get(
  '/:id',
  authenticate,
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
        .populate('messages.authorId', 'name role');

      if (!ticket) {
        return res.status(404).json({ success: false, error: 'Ticket not found' });
      }

      const isOwner = ticket.userId._id.toString() === req.user.id;
      if (!isOwner && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }

      res.json({ success: true, data: ticket });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   POST /api/support/:id/reply
// @desc    Add a message to a ticket (owner or admin)
// @access  Private
router.post(
  '/:id/reply',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid ticket id'),
    body('message').trim().notEmpty().withMessage('message is required').isLength({ max: 2000 }),
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

      const isOwner = ticket.userId.toString() === req.user.id;
      if (!isOwner && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }

      if (['resolved', 'closed'].includes(ticket.status)) {
        return res.status(400).json({ success: false, error: 'Cannot reply to a resolved or closed ticket' });
      }

      ticket.messages.push({
        authorId: req.user.id,
        authorRole: req.user.role === 'admin' ? 'admin' : 'user',
        message: req.body.message,
      });

      // Update status: admin reply puts ticket in waiting_user; user reply reopens it
      if (req.user.role === 'admin') {
        ticket.status = 'waiting_user';
      } else if (ticket.status === 'waiting_user') {
        ticket.status = 'in_progress';
      }

      await ticket.save();
      res.json({ success: true, data: ticket });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   PUT /api/support/:id/status
// @desc    Update ticket status (admin only)
// @access  Private (admin)
router.put(
  '/:id/status',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid ticket id'),
    body('status')
      .isIn(['open', 'in_progress', 'waiting_user', 'resolved', 'closed'])
      .withMessage('Invalid status'),
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

      const prevStatus = ticket.status;
      ticket.status = req.body.status;
      if (req.body.status === 'resolved') {
        ticket.resolvedAt = new Date();
      } else if (prevStatus === 'resolved') {
        ticket.resolvedAt = null;
      }
      if (req.body.status === 'closed') {
        ticket.closedAt = new Date();
      } else if (prevStatus === 'closed') {
        ticket.closedAt = null;
      }

      await ticket.save();

      if (req.body.status === 'resolved' || req.body.status === 'closed') {
        await AdminAction.create({
          adminId: req.user.id,
          action: req.body.status === 'resolved'
            ? 'ticket_resolve'
            : 'ticket_close',
          targetType: 'SupportTicket',
          targetId: ticket._id,
          details: { newStatus: req.body.status },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        });
      }

      res.json({ success: true, data: ticket });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   PUT /api/support/:id/assign
// @desc    Assign ticket to an admin (admin only)
// @access  Private (admin)
router.put(
  '/:id/assign',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId().withMessage('Invalid ticket id')],
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

      ticket.assignedAdminId = req.user.id;
      if (ticket.status === 'open') ticket.status = 'in_progress';
      await ticket.save();

      await AdminAction.create({
        adminId: req.user.id,
        action: 'ticket_assign',
        targetType: 'SupportTicket',
        targetId: ticket._id,
        details: { assignedTo: req.user.id },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      });

      res.json({ success: true, data: ticket });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   POST /api/support/:id/rate
// @desc    Rate a resolved ticket (owner only)
// @access  Private
router.post(
  '/:id/rate',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid ticket id'),
    body('score').isInt({ min: 1, max: 5 }).withMessage('score must be an integer between 1 and 5'),
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

      if (ticket.userId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }

      if (!['resolved', 'closed'].includes(ticket.status)) {
        return res.status(400).json({ success: false, error: 'Can only rate resolved or closed tickets' });
      }

      ticket.satisfactionScore = req.body.score;
      await ticket.save();

      res.json({ success: true, data: ticket });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

export default router;
