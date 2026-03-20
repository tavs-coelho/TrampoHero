import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import SupportTicket from '../models/SupportTicket.js';
import AdminAction from '../models/AdminAction.js';

const router = express.Router();

const CATEGORIES = ['payment', 'job', 'account', 'kyc', 'technical', 'dispute', 'fraud', 'compliance', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['open', 'in_progress', 'waiting_user', 'manual_review', 'resolved', 'closed'];
const INCIDENT_TYPES = ['general', 'dispute_company_freelancer', 'fraud_report'];

const SLA_HOURS_BY_CATEGORY = {
  fraud: 1,
  dispute: 8,
  payment: 8,
  account: 12,
  kyc: 24,
  compliance: 24,
  technical: 24,
  job: 24,
  other: 48,
};

const RESPONSE_TEMPLATES = [
  {
    key: 'first_response_general',
    category: 'other',
    text: 'Olá! Recebemos seu chamado e já estamos analisando. Retornaremos dentro do SLA informado.',
  },
  {
    key: 'first_response_payment',
    category: 'payment',
    text: 'Recebemos sua solicitação sobre pagamento. Vamos validar as transações e retornar com atualização.',
  },
  {
    key: 'dispute_ack',
    category: 'dispute',
    text: 'Disputa registrada. Nosso time fará revisão manual do histórico e evidências compartilhadas.',
  },
  {
    key: 'fraud_ack',
    category: 'fraud',
    text: 'Denúncia de fraude recebida. O caso foi priorizado e entrou em fluxo de análise de risco.',
  },
];

const PRIORITIZATION_RULES = [
  'Fraude e denúncia de fraude são críticas (SLA 1h, revisão manual obrigatória).',
  'Disputa empresa x freelancer é alta prioridade (SLA 8h, revisão manual obrigatória).',
  'Pagamentos são alta prioridade (SLA 8h).',
  'Demais incidentes seguem prioridade média/baixa por categoria.',
];

const parseBoolean = (value) => value === true || value === 'true';

const getPriorityByContext = ({ category, incidentType, isCompanyVsFreelancerDispute, isFraudReported }) => {
  if (category === 'fraud' || isFraudReported || incidentType === 'fraud_report') return 'critical';
  if (category === 'dispute' || isCompanyVsFreelancerDispute || incidentType === 'dispute_company_freelancer') return 'high';
  if (category === 'payment') return 'high';
  if (category === 'account' || category === 'technical') return 'medium';
  return 'low';
};

const computeSlaTargetAt = (category) => {
  const hours = SLA_HOURS_BY_CATEGORY[category] ?? 48;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

const buildOpeningHistory = ({ userId, category, incidentType, priority, manualReviewRequired }) => {
  const entries = [
    {
      type: 'ticket_opened',
      actorId: userId,
      actorRole: 'user',
      description: `Ticket aberto em ${category} (${incidentType})`,
      metadata: { category, incidentType },
    },
    {
      type: 'priority_changed',
      actorId: null,
      actorRole: 'system',
      description: `Priorização automática: ${priority}`,
      metadata: { priority },
    },
  ];

  if (manualReviewRequired) {
    entries.push({
      type: 'manual_review',
      actorId: null,
      actorRole: 'system',
      description: 'Ticket direcionado para revisão manual',
      fromStatus: 'open',
      toStatus: 'manual_review',
      metadata: { reason: 'incident_policy' },
    });
  }

  return entries;
};

const ensureHistory = (ticket) => {
  if (!Array.isArray(ticket.history)) {
    ticket.history = [];
  }
};

const resolveIncidentType = ({ incidentType, category, isCompanyVsFreelancerDispute, isFraudReported }) => {
  if (incidentType) return incidentType;
  if (category === 'fraud' || isFraudReported) return 'fraud_report';
  if (category === 'dispute' || isCompanyVsFreelancerDispute) return 'dispute_company_freelancer';
  return 'general';
};

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
    body('incidentType').optional().isIn(INCIDENT_TYPES).withMessage(`incidentType must be one of: ${INCIDENT_TYPES.join(', ')}`),
    body('isCompanyVsFreelancerDispute').optional().isBoolean(),
    body('isFraudReported').optional().isBoolean(),
    body('relatedJobId').optional().isMongoId(),
    body('relatedTransactionId').optional().isMongoId(),
    body('relatedDisputeId').optional().isMongoId(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const {
        subject,
        description,
        category,
        priority,
        incidentType,
        isCompanyVsFreelancerDispute,
        isFraudReported,
        relatedJobId,
        relatedTransactionId,
        relatedDisputeId,
      } = req.body;

      const normalizedIncidentType = resolveIncidentType({
        incidentType,
        category,
        isCompanyVsFreelancerDispute: parseBoolean(isCompanyVsFreelancerDispute),
        isFraudReported: parseBoolean(isFraudReported),
      });
      const manualReviewRequired =
        normalizedIncidentType === 'fraud_report' ||
        normalizedIncidentType === 'dispute_company_freelancer' ||
        parseBoolean(isFraudReported) ||
        category === 'fraud';
      const resolvedPriority =
        priority ||
        getPriorityByContext({
          category,
          incidentType: normalizedIncidentType,
          isCompanyVsFreelancerDispute: parseBoolean(isCompanyVsFreelancerDispute),
          isFraudReported: parseBoolean(isFraudReported),
        });

      const ticket = await SupportTicket.create({
        userId: req.user.id,
        subject,
        description,
        category,
        priority: resolvedPriority,
        status: manualReviewRequired ? 'manual_review' : 'open',
        incidentType: normalizedIncidentType,
        manualReviewRequired,
        slaTargetAt: computeSlaTargetAt(category),
        relatedJobId: relatedJobId || null,
        relatedTransactionId: relatedTransactionId || null,
        relatedDisputeId: relatedDisputeId || null,
        messages: [
          {
            authorId: req.user.id,
            authorRole: 'user',
            message: description,
          },
        ],
        history: buildOpeningHistory({
          userId: req.user.id,
          category,
          incidentType: normalizedIncidentType,
          priority: resolvedPriority,
          manualReviewRequired,
        }),
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
    const { status, category, incidentType } = req.query;
    if (status) query.status = status;
    if (category) query.category = category;
    if (incidentType) query.incidentType = incidentType;

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
      ensureHistory(ticket);
      ticket.lastResponseAt = new Date();
      if (req.user.role === 'admin' && !ticket.firstResponseAt) {
        ticket.firstResponseAt = ticket.lastResponseAt;
      }

      // Update status: admin reply puts ticket in waiting_user; user reply reopens it
      const previousStatus = ticket.status;
      if (req.user.role === 'admin') {
        ticket.status = 'waiting_user';
      } else if (ticket.status === 'waiting_user') {
        ticket.status = 'in_progress';
      }

      ticket.history.push({
        type: 'reply',
        actorId: req.user.id,
        actorRole: req.user.role === 'admin' ? 'admin' : 'user',
        description: req.user.role === 'admin' ? 'Resposta enviada pelo suporte' : 'Resposta enviada pelo usuário',
        metadata: { messageLength: req.body.message.length },
      });

      if (previousStatus !== ticket.status) {
        ticket.history.push({
          type: 'status_changed',
          actorId: req.user.id,
          actorRole: req.user.role === 'admin' ? 'admin' : 'user',
          description: `Status alterado de ${previousStatus} para ${ticket.status}`,
          fromStatus: previousStatus,
          toStatus: ticket.status,
        });
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
      body('status').isIn(STATUSES).withMessage('Invalid status'),
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
      ensureHistory(ticket);
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
      ticket.history.push({
        type: req.body.status === 'manual_review' ? 'manual_review' : 'status_changed',
        actorId: req.user.id,
        actorRole: 'admin',
        description: `Status alterado de ${prevStatus} para ${req.body.status}`,
        fromStatus: prevStatus,
        toStatus: req.body.status,
      });

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
      const previousStatus = ticket.status;
      if (ticket.status === 'open') ticket.status = 'in_progress';
      ensureHistory(ticket);
      ticket.history.push({
        type: 'assigned',
        actorId: req.user.id,
        actorRole: 'admin',
        description: 'Ticket atribuído para atendimento',
        metadata: { assignedTo: req.user.id },
      });
      if (previousStatus !== ticket.status) {
        ticket.history.push({
          type: 'status_changed',
          actorId: req.user.id,
          actorRole: 'admin',
          description: `Status alterado de ${previousStatus} para ${ticket.status}`,
          fromStatus: previousStatus,
          toStatus: ticket.status,
        });
      }
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

// @route   GET /api/support/operations/meta
// @desc    Get support operational metadata (SLA, categories, status, templates)
// @access  Private
router.get('/operations/meta', authenticate, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  return res.json({
    success: true,
    data: {
      categories: CATEGORIES,
      statuses: STATUSES,
      priorities: PRIORITIES,
      incidentTypes: INCIDENT_TYPES,
      slaHoursByCategory: SLA_HOURS_BY_CATEGORY,
      responseTemplates: isAdmin ? RESPONSE_TEMPLATES : [],
      prioritizationRules: isAdmin ? PRIORITIZATION_RULES : [],
    },
  });
});

// @route   POST /api/support/:id/manual-review
// @desc    Mark ticket for manual review (admin only)
// @access  Private (admin)
router.post(
  '/:id/manual-review',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid ticket id'),
    body('reason').optional().trim().isLength({ max: 300 }),
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

      const previousStatus = ticket.status;
      ticket.status = 'manual_review';
      ticket.manualReviewRequired = true;
      ensureHistory(ticket);
      ticket.history.push({
        type: 'manual_review',
        actorId: req.user.id,
        actorRole: 'admin',
        description: 'Ticket movido para revisão manual',
        fromStatus: previousStatus,
        toStatus: 'manual_review',
        metadata: { reason: req.body.reason || null },
      });
      await ticket.save();

      await AdminAction.create({
        adminId: req.user.id,
        action: 'ticket_update',
        targetType: 'SupportTicket',
        targetId: ticket._id,
        details: { manualReview: true, previousStatus, reason: req.body.reason || null },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      });

      res.json({ success: true, data: ticket });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

export default router;
