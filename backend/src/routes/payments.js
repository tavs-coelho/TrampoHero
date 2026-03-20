/**
 * Payment routes for TrampoHero:
 *   POST   /api/payments/escrow                – Create escrow payment for a job
 *   POST   /api/payments/release-escrow/:jobId – Release escrow after job completion
 *   POST   /api/payments/subscription          – Start Hero Prime subscription checkout
 *   DELETE /api/payments/subscription          – Cancel Hero Prime subscription
 *   POST   /api/payments/webhook               – Stripe webhook handler (raw body)
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Refund from '../models/Refund.js';
import { gateway, gatewayProviderName } from '../services/gatewayAdapter.js';
import { env } from '../config/env.js';

const router = express.Router();

// ─── Wallet Deposit PaymentIntent ─────────────────────────────────────────────

/**
 * @route  POST /api/payments/create-intent
 * @desc   Create a Stripe PaymentIntent for a wallet top-up.
 *         Returns the client_secret so the frontend can confirm payment via Stripe.js.
 * @access Private
 */
router.post('/create-intent', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({ success: false, error: 'amount is required' });
    }

    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({ success: false, error: 'amount must be a positive number (in BRL)' });
    }

    const amountCents = Math.round(amountNumber * 100);
    if (!Number.isInteger(amountCents) || amountCents < 1) {
      return res.status(400).json({ success: false, error: 'amount must be at least R$ 0.01' });
    }

    const paymentIntent = await gateway.createPaymentIntent({
      amountCents,
      userId: req.user.id,
      description: 'Depósito na carteira TrampoHero',
    });

    res.status(201).json({
      success: true,
      data: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      },
    });
  } catch (error) {
    console.error('[payments/create-intent]', error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── Escrow ──────────────────────────────────────────────────────────────────

/**
 * @route  POST /api/payments/escrow
 * @desc   Employer creates an escrow payment intent for a job.
 *         The payment is authorized but not captured until job completion.
 * @access Private (employer)
 */
router.post('/escrow', authenticate, async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ success: false, error: 'jobId is required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    if (job.employerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (job.escrowStatus !== 'none') {
      return res.status(400).json({ success: false, error: 'Escrow already exists for this job' });
    }

    // Convert BRL to cents
    const amountCents = Math.round(job.payment * 100);

    const paymentIntent = await gateway.createEscrowPaymentIntent({
      amountCents,
      employerId: req.user.id,
      jobId: job._id.toString(),
      description: `Escrow – ${job.title}`,
    });

    // Save PaymentIntent ID on the job
    job.escrowPaymentIntentId = paymentIntent.id;
    job.escrowStatus = 'held';
    await job.save();

    // Record the escrow transaction
    await Transaction.create({
      userId: req.user.id,
      type: 'escrow',
      status: 'pending',
      amount: -(job.payment),
      description: `Escrow retido para: ${job.title}`,
      fee: parseFloat((paymentIntent.metadata.feeAmountCents / 100).toFixed(2)),
      relatedJobId: job._id,
      stripePaymentIntentId: paymentIntent.id,
    });

    res.status(201).json({
      success: true,
      data: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        totalAmountCents: paymentIntent.amount,
      },
    });
  } catch (error) {
    console.error('[payments/escrow]', error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── Release Escrow ──────────────────────────────────────────────────────────

/**
 * @route  POST /api/payments/release-escrow/:jobId
 * @desc   Employer releases escrow once job is completed.
 *         Platform fee is deducted and net amount is credited to freelancer wallet.
 * @access Private (employer)
 */
router.post('/release-escrow/:jobId', authenticate, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    if (job.employerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (job.escrowStatus !== 'held') {
      return res.status(400).json({ success: false, error: 'No held escrow found for this job' });
    }

    if (!job.escrowPaymentIntentId) {
      return res.status(400).json({ success: false, error: 'No escrow payment intent found' });
    }

    // Find the hired freelancer (approved applicant)
    const hiredApplicant = job.applicants.find(a => a.status === 'approved');
    if (!hiredApplicant) {
      return res.status(400).json({ success: false, error: 'No approved freelancer found for this job' });
    }

    const freelancer = await User.findById(hiredApplicant.userId);
    if (!freelancer) {
      return res.status(404).json({ success: false, error: 'Freelancer not found' });
    }

    const jobAmountCents = Math.round(job.payment * 100);
    const freelancerIsPrime = freelancer.isPrime || freelancer.subscription?.plan === 'hero_prime';

    const { capturedIntent, freelancerNetCents, platformFeeCents } = await gateway.releaseEscrow({
      paymentIntentId: job.escrowPaymentIntentId,
      jobAmountCents,
      freelancerIsPrime,
    });

    const freelancerNetBRL = freelancerNetCents / 100;
    const platformFeeBRL  = platformFeeCents / 100;

    // Credit freelancer wallet
    await User.findByIdAndUpdate(hiredApplicant.userId, {
      $inc: { 'wallet.balance': freelancerNetBRL },
    });

    // Record release transactions
    await Transaction.create({
      userId: hiredApplicant.userId,
      type: 'escrow_release',
      status: 'completed',
      amount: freelancerNetBRL,
      description: `Pagamento liberado: ${job.title}`,
      fee: platformFeeBRL,
      relatedJobId: job._id,
      stripePaymentIntentId: capturedIntent.id,
    });

    // Record the fee charge transaction for the employer record
    if (platformFeeBRL > 0) {
      await Transaction.create({
        userId: req.user.id,
        type: 'fee_charge',
        status: 'completed',
        amount: -platformFeeBRL,
        description: `Taxa de serviço: ${job.title}`,
        fee: platformFeeBRL,
        relatedJobId: job._id,
        stripePaymentIntentId: capturedIntent.id,
      });
    }

    // Update escrow status and job status
    job.escrowStatus = 'released';
    job.status = 'paid';
    await job.save();

    res.json({
      success: true,
      data: {
        freelancerNetBRL,
        platformFeeBRL,
        freelancerIsPrime,
      },
    });
  } catch (error) {
    console.error('[payments/release-escrow]', error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── Cancel Escrow (Refund) ───────────────────────────────────────────────────

/**
 * @route  POST /api/payments/cancel-escrow/:jobId
 * @desc   Employer cancels the job before escrow is captured, triggering a full refund.
 * @access Private (employer)
 */
router.post('/cancel-escrow/:jobId', authenticate, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    if (job.employerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (job.escrowStatus !== 'held') {
      return res.status(400).json({ success: false, error: 'No held escrow to cancel for this job' });
    }

    if (!job.escrowPaymentIntentId) {
      return res.status(400).json({ success: false, error: 'No escrow payment intent found' });
    }

    // Cancel (void) the uncaptured PaymentIntent – Stripe refunds the authorised hold
    await gateway.cancelEscrow(job.escrowPaymentIntentId);

    // Create a Refund record for audit trail
    const refundRecord = await Refund.create({
      userId: req.user.id,
      jobId: job._id,
      amount: job.payment,
      reason: 'job_cancelled',
      status: 'completed',
      gatewayProvider: gatewayProviderName,
      processedAt: new Date(),
    });

    // Record the refund transaction
    await Transaction.create({
      userId: req.user.id,
      type: 'escrow_refund',
      status: 'completed',
      amount: job.payment,
      description: `Reembolso de escrow: ${job.title}`,
      relatedJobId: job._id,
      stripePaymentIntentId: job.escrowPaymentIntentId,
      refundId: refundRecord._id,
    });

    // Mark the original escrow transaction as refunded
    await Transaction.findOneAndUpdate(
      { stripePaymentIntentId: job.escrowPaymentIntentId, type: 'escrow' },
      { status: 'refunded' },
    );

    // Update job
    job.escrowStatus = 'refunded';
    job.status = 'cancelled';
    await job.save();

    res.json({ success: true, data: { refund: refundRecord } });
  } catch (error) {
    console.error('[payments/cancel-escrow]', error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── Subscription ─────────────────────────────────────────────────────────────

/**
 * @route  POST /api/payments/subscription
 * @desc   Start Hero Prime subscription checkout session.
 * @access Private
 */
router.post('/subscription', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.subscription?.plan === 'hero_prime' && user.subscription?.status === 'active') {
      return res.status(400).json({ success: false, error: 'Already subscribed to Hero Prime' });
    }

    const stripeCustomerId = await gateway.getOrCreateCustomer(user);

    // Persist the Stripe customer ID immediately so future calls reuse it
    if (!user.subscription?.stripeCustomerId) {
      await User.findByIdAndUpdate(req.user.id, {
        'subscription.stripeCustomerId': stripeCustomerId,
      });
    }

    const successUrl = req.body.successUrl || `${env.FRONTEND_URL}/subscription/success`;
    const cancelUrl  = req.body.cancelUrl  || `${env.FRONTEND_URL}/subscription/cancel`;

    const session = await gateway.createSubscriptionCheckoutSession({
      stripeCustomerId,
      userId: req.user.id,
      successUrl,
      cancelUrl,
    });

    res.status(201).json({
      success: true,
      data: {
        sessionId: session.id,
        checkoutUrl: session.url,
      },
    });
  } catch (error) {
    console.error('[payments/subscription]', error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route  DELETE /api/payments/subscription
 * @desc   Cancel the current Hero Prime subscription.
 * @access Private
 */
router.delete('/subscription', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.subscription?.stripeSubscriptionId) {
      return res.status(400).json({ success: false, error: 'No active subscription found' });
    }

    await gateway.cancelSubscription(user.subscription.stripeSubscriptionId);

    await User.findByIdAndUpdate(req.user.id, {
      isPrime: false,
      'subscription.plan': 'none',
      'subscription.status': 'canceled',
      'subscription.stripeSubscriptionId': null,
    });

    res.json({ success: true, message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('[payments/subscription DELETE]', error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── Webhook ──────────────────────────────────────────────────────────────────

/**
 * @route  POST /api/payments/webhook
 * @desc   Stripe webhook handler. Must receive raw body (not JSON-parsed).
 *         express.raw() is applied at the app level in server.js for this path.
 * @access Public (verified by Stripe signature)
 */
router.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = gateway.constructWebhookEvent(req.body, signature);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  try {
    switch (event.type) {
      // ── Subscription events ────────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription') {
          const userId = session.metadata?.userId;
          const subscriptionId = session.subscription;
          if (userId && subscriptionId) {
            await User.findByIdAndUpdate(userId, {
              isPrime: true,
              'subscription.plan': 'hero_prime',
              'subscription.status': 'active',
              'subscription.stripeSubscriptionId': subscriptionId,
            });

            await Transaction.create({
              userId,
              type: 'subscription',
              status: 'completed',
              amount: -29.90,
              description: 'Assinatura Hero Prime',
              stripeSubscriptionId: subscriptionId,
            });
          }
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        if (subscriptionId) {
          // Find user by subscription ID and extend their period
          const user = await User.findOne({ 'subscription.stripeSubscriptionId': subscriptionId });
          if (user) {
            const periodEnd = new Date(invoice.lines?.data?.[0]?.period?.end * 1000 || Date.now());
            await User.findByIdAndUpdate(user._id, {
              isPrime: true,
              'subscription.status': 'active',
              'subscription.currentPeriodEnd': periodEnd,
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const user = await User.findOne({ 'subscription.stripeSubscriptionId': subscription.id });
        if (user) {
          await User.findByIdAndUpdate(user._id, {
            isPrime: false,
            'subscription.plan': 'none',
            'subscription.status': 'canceled',
            'subscription.stripeSubscriptionId': null,
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const user = await User.findOne({ 'subscription.stripeSubscriptionId': subscription.id });
        if (user) {
          const isPrime = subscription.status === 'active';
          await User.findByIdAndUpdate(user._id, {
            isPrime,
            'subscription.status': subscription.status,
            'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
          });
        }
        break;
      }

      // ── PaymentIntent / Escrow events ──────────────────────────────────────
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        if (paymentIntent.metadata?.type === 'wallet_deposit') {
          const userId = paymentIntent.metadata?.userId;
          if (userId) {
            const amountBRL = (paymentIntent.amount_received ?? paymentIntent.amount) / 100;
            await User.findByIdAndUpdate(userId, {
              $inc: { 'wallet.balance': amountBRL },
            });
            await Transaction.create({
              userId,
              type: 'deposit',
              status: 'completed',
              amount: amountBRL,
              description: 'Depósito via cartão',
              stripePaymentIntentId: paymentIntent.id,
            });
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        if (paymentIntent.metadata?.type === 'escrow') {
          const jobId = paymentIntent.metadata?.jobId;
          if (jobId) {
            await Job.findByIdAndUpdate(jobId, { escrowStatus: 'none', escrowPaymentIntentId: null });
            await Transaction.findOneAndUpdate(
              { stripePaymentIntentId: paymentIntent.id },
              { status: 'failed' },
            );
          }
        }
        break;
      }

      default:
        // Unhandled event types are silently ignored
        break;
    }
  } catch (handlerError) {
    console.error(`[webhook] Error processing event ${event.type}:`, handlerError.message);
    // Return 200 to avoid Stripe retrying; log for investigation
  }

  res.json({ received: true });
});

export default router;
