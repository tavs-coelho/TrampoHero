/**
 * Dispute routes for TrampoHero:
 *   POST  /api/disputes                – Open a dispute for a job
 *   GET   /api/disputes/:id            – Get dispute details
 *   GET   /api/disputes                – List disputes for the authenticated user
 *   POST  /api/disputes/:id/resolve    – Admin resolves a dispute (requires admin role)
 *   POST  /api/disputes/:id/cancel     – Initiator cancels an open dispute
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Dispute from '../models/Dispute.js';
import Refund from '../models/Refund.js';
import { gateway, gatewayProviderName } from '../services/gatewayAdapter.js';

// Floating-point tolerance when validating that split amounts don't exceed the job payment
const SPLIT_AMOUNT_TOLERANCE = 0.01;

const router = express.Router();

// ─── Open Dispute ─────────────────────────────────────────────────────────────

/**
 * @route  POST /api/disputes
 * @desc   Open a dispute for a job. Both employer and freelancer can open a dispute
 *         while the job escrow is held or recently released.
 * @access Private
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { jobId, reason } = req.body;

    if (!jobId) {
      return res.status(400).json({ success: false, error: 'jobId is required' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'reason is required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    // Only the employer or the hired freelancer may open a dispute
    const hiredApplicant = job.applicants.find(a => a.status === 'approved');
    const isEmployer = job.employerId.toString() === req.user.id;
    const isFreelancer = hiredApplicant && hiredApplicant.userId.toString() === req.user.id;

    if (!isEmployer && !isFreelancer) {
      return res.status(403).json({ success: false, error: 'Not authorized to open a dispute for this job' });
    }

    if (!hiredApplicant) {
      return res.status(400).json({ success: false, error: 'No hired freelancer found for this job' });
    }

    // Only jobs with escrow held or already released can be disputed
    const disputeableStatuses = ['held', 'released'];
    if (!disputeableStatuses.includes(job.escrowStatus)) {
      return res.status(400).json({ success: false, error: `Cannot open a dispute for a job with escrow status "${job.escrowStatus}"` });
    }

    // Prevent duplicate disputes
    const existing = await Dispute.findOne({ jobId });
    if (existing) {
      return res.status(409).json({ success: false, error: 'A dispute already exists for this job', data: existing });
    }

    const dispute = await Dispute.create({
      initiatedBy: req.user.id,
      employerId: job.employerId,
      freelancerId: hiredApplicant.userId,
      jobId: job._id,
      reason: reason.trim(),
    });

    // Record a hold transaction on both parties to show funds are frozen
    await Promise.all([
      Transaction.create({
        userId: job.employerId,
        type: 'dispute_hold',
        status: 'pending',
        amount: 0,
        description: `Disputa aberta: ${job.title}`,
        relatedJobId: job._id,
        disputeId: dispute._id,
      }),
      Transaction.create({
        userId: hiredApplicant.userId,
        type: 'dispute_hold',
        status: 'pending',
        amount: 0,
        description: `Disputa aberta: ${job.title}`,
        relatedJobId: job._id,
        disputeId: dispute._id,
      }),
    ]);

    res.status(201).json({ success: true, data: dispute });
  } catch (error) {
    console.error('[disputes/open]', error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── List Disputes ────────────────────────────────────────────────────────────

/**
 * @route  GET /api/disputes
 * @desc   List all disputes where the authenticated user is employer or freelancer.
 * @access Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const disputes = await Dispute.find({
      $or: [{ employerId: req.user.id }, { freelancerId: req.user.id }],
    }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, data: disputes });
  } catch (error) {
    console.error('[disputes/list]', error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── Get Dispute ──────────────────────────────────────────────────────────────

/**
 * @route  GET /api/disputes/:id
 * @desc   Get details of a specific dispute.
 * @access Private (must be employer, freelancer, or admin)
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ success: false, error: 'Dispute not found' });
    }

    const isParty =
      dispute.employerId.toString() === req.user.id ||
      dispute.freelancerId.toString() === req.user.id ||
      req.user.role === 'admin';

    if (!isParty) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    res.json({ success: true, data: dispute });
  } catch (error) {
    console.error('[disputes/get]', error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── Resolve Dispute (Admin) ──────────────────────────────────────────────────

/**
 * @route  POST /api/disputes/:id/resolve
 * @desc   Admin resolves a dispute. Depending on the resolution, funds are
 *         refunded to the employer or released to the freelancer (or split).
 * @access Private (admin only)
 *
 * Body:
 *   resolution: 'employer' | 'freelancer' | 'split'
 *   employerAmount: number (BRL) – required when resolution is 'split'
 *   freelancerAmount: number (BRL) – required when resolution is 'split'
 *   notes: string
 */
router.post('/:id/resolve', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { resolution, employerAmount, freelancerAmount, notes } = req.body;

    if (!['employer', 'freelancer', 'split'].includes(resolution)) {
      return res.status(400).json({ success: false, error: 'resolution must be "employer", "freelancer", or "split"' });
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ success: false, error: 'Dispute not found' });
    }

    if (!['open', 'under_review'].includes(dispute.status)) {
      return res.status(400).json({ success: false, error: 'Dispute is already resolved or cancelled' });
    }

    const job = await Job.findById(dispute.jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Related job not found' });
    }

    const jobPaymentCents = Math.round(job.payment * 100);
    let resolvedEmployerBRL = 0;
    let resolvedFreelancerBRL = 0;

    if (resolution === 'employer') {
      resolvedEmployerBRL = job.payment;
      resolvedFreelancerBRL = 0;
    } else if (resolution === 'freelancer') {
      resolvedEmployerBRL = 0;
      resolvedFreelancerBRL = job.payment;
    } else {
      // split
      const employerSplit = parseFloat(employerAmount);
      const freelancerSplit = parseFloat(freelancerAmount);

      if (!Number.isFinite(employerSplit) || !Number.isFinite(freelancerSplit)) {
        return res.status(400).json({ success: false, error: 'Invalid split amounts: must be finite numbers' });
      }

      if (employerSplit < 0 || freelancerSplit < 0) {
        return res.status(400).json({ success: false, error: 'Invalid split amounts: values cannot be negative' });
      }

      const total = parseFloat((employerSplit + freelancerSplit).toFixed(2));

      // Require that the split exactly matches the job payment within a small tolerance.
      if (total < job.payment - SPLIT_AMOUNT_TOLERANCE || total > job.payment + SPLIT_AMOUNT_TOLERANCE) {
        return res.status(400).json({
          success: false,
          error: `Split amounts (${total}) must sum to the job payment (${job.payment}) within a tolerance of ${SPLIT_AMOUNT_TOLERANCE}`,
        });
      }

      resolvedEmployerBRL = employerSplit;
      resolvedFreelancerBRL = freelancerSplit;
    }

    // Issue refund to employer if applicable
    if (resolvedEmployerBRL > 0 && job.escrowPaymentIntentId) {
      const refundAmountCents = Math.round(resolvedEmployerBRL * 100);
      const gatewayProvider = gatewayProviderName;
      let gatewayRefundId = null;
      let refundRecord;

      try {
        // If escrow is still held (uncaptured PaymentIntent), a direct refund will typically fail.
        if (job.escrowStatus === 'held') {
          throw new Error('Cannot process refund while escrow is held (payment not captured).');
        }

        const gatewayRefund = await gateway.createRefund({
          paymentIntentId: job.escrowPaymentIntentId,
          // Omit amountCents for a full refund (Stripe default); pass it for partial refunds.
          amountCents: refundAmountCents < jobPaymentCents ? refundAmountCents : undefined,
        });
        gatewayRefundId = gatewayRefund.id;

        refundRecord = await Refund.create({
          userId: dispute.employerId,
          jobId: job._id,
          amount: resolvedEmployerBRL,
          reason: 'dispute_resolved',
          status: 'completed',
          gatewayRefundId,
          gatewayProvider,
          processedAt: new Date(),
        });

        await Transaction.create({
          userId: dispute.employerId,
          type: 'refund',
          status: 'completed',
          amount: resolvedEmployerBRL,
          description: `Reembolso via resolução de disputa: ${job.title}`,
          relatedJobId: job._id,
          disputeId: dispute._id,
          refundId: refundRecord._id,
        });
      } catch (gatewayErr) {
        const failureReason =
          (gatewayErr && gatewayErr.message) || 'Failed to process refund via payment gateway.';

        console.error('[disputes/resolve] Gateway refund failed:', failureReason);

        refundRecord = await Refund.create({
          userId: dispute.employerId,
          jobId: job._id,
          amount: resolvedEmployerBRL,
          reason: 'dispute_resolved',
          status: 'failed',
          failureReason,
          gatewayRefundId,
          gatewayProvider,
          processedAt: new Date(),
        });

        await Transaction.create({
          userId: dispute.employerId,
          type: 'refund',
          status: 'failed',
          amount: resolvedEmployerBRL,
          description: `Falha no reembolso via resolução de disputa: ${job.title}`,
          relatedJobId: job._id,
          disputeId: dispute._id,
          refundId: refundRecord._id,
          failureReason,
        });

        // Re-throw so that the route handler can return an error response
        throw gatewayErr;
      }
    }

    // Credit freelancer wallet if applicable
    if (resolvedFreelancerBRL > 0) {
      const escrowAlreadyReleased = job.escrowStatus === 'released';

      if (escrowAlreadyReleased) {
        // Avoid double-paying the freelancer if escrow was already released
        console.warn(
          '[disputes/resolve] Skipping freelancer credit because escrow is already released for job',
          job._id.toString()
        );
      } else {
        await User.findByIdAndUpdate(dispute.freelancerId, {
          $inc: { 'wallet.balance': resolvedFreelancerBRL },
        });

        await Transaction.create({
          userId: dispute.freelancerId,
          type: 'dispute_release',
          status: 'completed',
          amount: resolvedFreelancerBRL,
          description: `Pagamento liberado via resolução de disputa: ${job.title}`,
          relatedJobId: job._id,
          disputeId: dispute._id,
        });
      }
    }

    // Update dispute record
    const statusMap = { employer: 'resolved_employer', freelancer: 'resolved_freelancer', split: 'resolved_split' };
    dispute.status = statusMap[resolution];
    dispute.resolvedBy = req.user.id;
    dispute.resolvedAt = new Date();
    dispute.resolution = {
      employerAmount: resolvedEmployerBRL,
      freelancerAmount: resolvedFreelancerBRL,
      notes: notes ?? null,
    };
    await dispute.save();

    // Update escrow status on the job
    job.escrowStatus = resolvedEmployerBRL > 0 ? 'refunded' : 'released';
    await job.save();

    res.json({ success: true, data: dispute });
  } catch (error) {
    console.error('[disputes/resolve]', error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── Cancel Dispute ───────────────────────────────────────────────────────────

/**
 * @route  POST /api/disputes/:id/cancel
 * @desc   The initiator cancels an open dispute (before it goes under review).
 * @access Private
 */
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ success: false, error: 'Dispute not found' });
    }

    if (dispute.initiatedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Only the dispute initiator can cancel it' });
    }

    if (dispute.status !== 'open') {
      return res.status(400).json({ success: false, error: 'Only open disputes can be cancelled' });
    }

    dispute.status = 'cancelled';
    await dispute.save();

    res.json({ success: true, data: dispute });
  } catch (error) {
    console.error('[disputes/cancel]', error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
