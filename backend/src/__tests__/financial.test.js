/**
 * Unit tests for the financial module additions:
 *  - POST /api/payments/cancel-escrow/:jobId  – Cancel escrow and refund employer
 *  - POST /api/disputes                       – Open a dispute
 *  - GET  /api/disputes                       – List disputes
 *  - GET  /api/disputes/:id                   – Get dispute
 *  - POST /api/disputes/:id/cancel            – Cancel a dispute
 *  - POST /api/wallet/withdraw                – Withdrawal with Withdrawal model
 *  - GET  /api/wallet/withdrawals             – List withdrawals
 *
 * All DB models and Stripe are mocked – no real network or DB needed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock env ─────────────────────────────────────────────────────────────────
vi.mock('../config/env.js', () => ({
  env: {
    STRIPE_SECRET_KEY: 'sk_test_mock',
    STRIPE_WEBHOOK_SECRET: 'whsec_mock',
    FRONTEND_URL: 'http://localhost:3000',
    JWT_SECRET: 'test_jwt_secret',
    MONGODB_URI: 'mongodb://localhost/test',
    NODE_ENV: 'test',
    PORT: 5000,
    RATE_LIMIT_MAX: 100,
    ALLOWED_ORIGINS: ['http://localhost:3000'],
    JWT_EXPIRE: '30d',
    GEMINI_API_KEY: '',
    AZURE_STORAGE_ACCOUNT_NAME: '',
    AZURE_STORAGE_ACCOUNT_KEY: '',
    AZURE_STORAGE_CONTAINER_NAME: 'uploads',
    ANH_CONNECTION_STRING: '',
    ANH_HUB_NAME: '',
    AZURE_WEBPUBSUB_CONNECTION_STRING: '',
    AZURE_WEBPUBSUB_HUB_NAME: '',
    WITHDRAWAL_FEE: 2.50,
    MIN_WITHDRAWAL: 10,
  },
}));

// ─── Mock Stripe ──────────────────────────────────────────────────────────────
const mockStripe = vi.hoisted(() => ({
  paymentIntents: {
    cancel: vi.fn(),
  },
  refunds: {
    create: vi.fn(),
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
}));

vi.mock('stripe', () => ({
  default: function MockStripe() { return mockStripe; },
}));

// ─── Mock Mongoose models ─────────────────────────────────────────────────────
vi.mock('../models/Job.js', () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock('../models/User.js', () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findOne: vi.fn(),
  },
}));

vi.mock('../models/Transaction.js', () => ({
  default: {
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('../models/Refund.js', () => ({
  default: {
    create: vi.fn(),
  },
}));

vi.mock('../models/Withdrawal.js', () => ({
  default: {
    create: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('../models/Dispute.js', () => ({
  default: {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
  },
}));

// ─── Mock JWT middleware ──────────────────────────────────────────────────────
vi.mock('../middleware/auth.js', () => ({
  authenticate: (req, _res, next) => {
    req.user = { id: 'employer-id-123', role: 'employer' };
    next();
  },
  authorize: (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access forbidden' });
    }
    next();
  },
}));

// ─── Import models (after mocks) ─────────────────────────────────────────────
import Job from '../models/Job.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Refund from '../models/Refund.js';
import Withdrawal from '../models/Withdrawal.js';
import Dispute from '../models/Dispute.js';

// ─── Build test Express apps ──────────────────────────────────────────────────
import express from 'express';
import request from 'supertest';
import paymentsRouter from '../routes/payments.js';
import disputesRouter from '../routes/disputes.js';
import walletRouter from '../routes/wallet.js';

function buildPaymentsApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/payments', paymentsRouter);
  return app;
}

function buildDisputesApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/disputes', disputesRouter);
  return app;
}

function buildWalletApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/wallet', walletRouter);
  return app;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Cancel Escrow Route
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /api/payments/cancel-escrow/:jobId', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 when job not found', async () => {
    Job.findById.mockResolvedValue(null);
    const res = await request(buildPaymentsApp())
      .post('/api/payments/cancel-escrow/missing-job');
    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not the employer', async () => {
    Job.findById.mockResolvedValue({
      _id: 'job-1',
      employerId: { toString: () => 'other-employer' },
      escrowStatus: 'held',
    });
    const res = await request(buildPaymentsApp())
      .post('/api/payments/cancel-escrow/job-1');
    expect(res.status).toBe(403);
  });

  it('returns 400 when escrow is not held', async () => {
    Job.findById.mockResolvedValue({
      _id: 'job-1',
      employerId: { toString: () => 'employer-id-123' },
      escrowStatus: 'none',
    });
    const res = await request(buildPaymentsApp())
      .post('/api/payments/cancel-escrow/job-1');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/held/i);
  });

  it('cancels escrow and returns the refund record', async () => {
    const mockJob = {
      _id: 'job-1',
      employerId: { toString: () => 'employer-id-123' },
      escrowStatus: 'held',
      escrowPaymentIntentId: 'pi_held_123',
      payment: 100,
      title: 'Test Job',
      save: vi.fn().mockResolvedValue(true),
    };
    Job.findById.mockResolvedValue(mockJob);
    mockStripe.paymentIntents.cancel.mockResolvedValue({ id: 'pi_held_123', status: 'canceled' });
    Refund.create.mockResolvedValue({ id: 'ref-1', amount: 100, status: 'completed' });
    Transaction.create.mockResolvedValue({});
    Transaction.findOneAndUpdate.mockResolvedValue({});

    const res = await request(buildPaymentsApp())
      .post('/api/payments/cancel-escrow/job-1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockStripe.paymentIntents.cancel).toHaveBeenCalledWith('pi_held_123');
    expect(Refund.create).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'job_cancelled', amount: 100, status: 'completed' }),
    );
    expect(mockJob.escrowStatus).toBe('refunded');
    expect(mockJob.status).toBe('cancelled');
    expect(mockJob.save).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Disputes Routes
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /api/disputes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when jobId is missing', async () => {
    const res = await request(buildDisputesApp())
      .post('/api/disputes')
      .send({ reason: 'No payment' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/jobId/i);
  });

  it('returns 400 when reason is missing', async () => {
    const res = await request(buildDisputesApp())
      .post('/api/disputes')
      .send({ jobId: 'job-1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/reason/i);
  });

  it('returns 404 when job not found', async () => {
    Job.findById.mockResolvedValue(null);
    const res = await request(buildDisputesApp())
      .post('/api/disputes')
      .send({ jobId: 'bad-id', reason: 'test' });
    expect(res.status).toBe(404);
  });

  it('returns 403 when user is neither employer nor freelancer', async () => {
    Job.findById.mockResolvedValue({
      _id: 'job-1',
      employerId: { toString: () => 'other-employer' },
      escrowStatus: 'held',
      applicants: [{ userId: { toString: () => 'other-freelancer' }, status: 'approved' }],
    });
    const res = await request(buildDisputesApp())
      .post('/api/disputes')
      .send({ jobId: 'job-1', reason: 'test' });
    expect(res.status).toBe(403);
  });

  it('returns 400 when escrow status is not disputeable', async () => {
    Job.findById.mockResolvedValue({
      _id: 'job-1',
      employerId: { toString: () => 'employer-id-123' },
      escrowStatus: 'none',
      applicants: [{ userId: { toString: () => 'freelancer-1' }, status: 'approved' }],
    });
    Dispute.findOne.mockResolvedValue(null);
    const res = await request(buildDisputesApp())
      .post('/api/disputes')
      .send({ jobId: 'job-1', reason: 'test' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/escrow status/i);
  });

  it('returns 409 when dispute already exists for job', async () => {
    Job.findById.mockResolvedValue({
      _id: 'job-1',
      employerId: { toString: () => 'employer-id-123' },
      escrowStatus: 'held',
      applicants: [{ userId: { toString: () => 'freelancer-1' }, status: 'approved' }],
    });
    Dispute.findOne.mockResolvedValue({ id: 'existing-dispute' });
    const res = await request(buildDisputesApp())
      .post('/api/disputes')
      .send({ jobId: 'job-1', reason: 'test' });
    expect(res.status).toBe(409);
  });

  it('creates a dispute when employer initiates for held escrow', async () => {
    Job.findById.mockResolvedValue({
      _id: 'job-1',
      employerId: { toString: () => 'employer-id-123' },
      escrowStatus: 'held',
      title: 'Test Job',
      applicants: [{ userId: { toString: () => 'freelancer-1' }, status: 'approved' }],
    });
    Dispute.findOne.mockResolvedValue(null);
    Dispute.create.mockResolvedValue({
      id: 'dispute-1',
      status: 'open',
      initiatedBy: 'employer-id-123',
    });
    Transaction.create.mockResolvedValue({});

    const res = await request(buildDisputesApp())
      .post('/api/disputes')
      .send({ jobId: 'job-1', reason: 'Freelancer did not complete work' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(Dispute.create).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'Freelancer did not complete work',
        initiatedBy: 'employer-id-123',
        jobId: 'job-1',
      }),
    );
  });
});

describe('GET /api/disputes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns list of disputes for authenticated user', async () => {
    Dispute.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        { id: 'dispute-1', status: 'open' },
        { id: 'dispute-2', status: 'resolved_freelancer' },
      ]),
    });

    const res = await request(buildDisputesApp()).get('/api/disputes');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });
});

describe('GET /api/disputes/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 when dispute not found', async () => {
    Dispute.findById.mockResolvedValue(null);
    const res = await request(buildDisputesApp()).get('/api/disputes/bad-id');
    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not a party to the dispute', async () => {
    Dispute.findById.mockResolvedValue({
      id: 'dispute-1',
      employerId: { toString: () => 'other-employer' },
      freelancerId: { toString: () => 'other-freelancer' },
    });
    const res = await request(buildDisputesApp()).get('/api/disputes/dispute-1');
    expect(res.status).toBe(403);
  });

  it('returns dispute when user is the employer', async () => {
    Dispute.findById.mockResolvedValue({
      id: 'dispute-1',
      status: 'open',
      employerId: { toString: () => 'employer-id-123' },
      freelancerId: { toString: () => 'other-freelancer' },
    });
    const res = await request(buildDisputesApp()).get('/api/disputes/dispute-1');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('open');
  });
});

describe('POST /api/disputes/:id/cancel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 when dispute not found', async () => {
    Dispute.findById.mockResolvedValue(null);
    const res = await request(buildDisputesApp())
      .post('/api/disputes/bad-id/cancel');
    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not the initiator', async () => {
    Dispute.findById.mockResolvedValue({
      id: 'dispute-1',
      status: 'open',
      initiatedBy: { toString: () => 'other-user' },
    });
    const res = await request(buildDisputesApp())
      .post('/api/disputes/dispute-1/cancel');
    expect(res.status).toBe(403);
  });

  it('returns 400 when dispute is not open', async () => {
    Dispute.findById.mockResolvedValue({
      id: 'dispute-1',
      status: 'under_review',
      initiatedBy: { toString: () => 'employer-id-123' },
    });
    const res = await request(buildDisputesApp())
      .post('/api/disputes/dispute-1/cancel');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/open/i);
  });

  it('cancels an open dispute initiated by the authenticated user', async () => {
    const mockDispute = {
      id: 'dispute-1',
      status: 'open',
      initiatedBy: { toString: () => 'employer-id-123' },
      save: vi.fn().mockResolvedValue(true),
    };
    Dispute.findById.mockResolvedValue(mockDispute);

    const res = await request(buildDisputesApp())
      .post('/api/disputes/dispute-1/cancel');

    expect(res.status).toBe(200);
    expect(mockDispute.status).toBe('cancelled');
    expect(mockDispute.save).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Wallet Withdrawal Routes
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /api/wallet/withdraw', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when amount is missing', async () => {
    const res = await request(buildWalletApp())
      .post('/api/wallet/withdraw')
      .send({ pixKey: '123.456.789-09' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid amount/i);
  });

  it('returns 400 when amount is below minimum', async () => {
    const res = await request(buildWalletApp())
      .post('/api/wallet/withdraw')
      .send({ amount: 5, pixKey: 'test@email.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/minimum/i);
  });

  it('returns 400 when pixKey is missing', async () => {
    const res = await request(buildWalletApp())
      .post('/api/wallet/withdraw')
      .send({ amount: 50 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/pix key/i);
  });

  it('returns 400 when balance is insufficient', async () => {
    User.findById.mockResolvedValue({
      _id: 'employer-id-123',
      isPrime: false,
      wallet: { balance: 20 },
    });
    const res = await request(buildWalletApp())
      .post('/api/wallet/withdraw')
      .send({ amount: 50, pixKey: 'test@email.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient/i);
  });

  it('creates a Withdrawal record and moves amount to scheduled', async () => {
    User.findById.mockResolvedValue({
      _id: 'employer-id-123',
      isPrime: false,
      wallet: { balance: 200 },
    });
    Withdrawal.create.mockResolvedValue({
      id: 'wd-1',
      amount: 100,
      fee: 2.50,
      netAmount: 97.50,
      pixKey: 'test@email.com',
      status: 'pending',
    });
    Transaction.create.mockResolvedValue({ id: 'tx-1' });
    User.findByIdAndUpdate.mockResolvedValue({});

    const res = await request(buildWalletApp())
      .post('/api/wallet/withdraw')
      .send({ amount: 100, pixKey: 'test@email.com' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(Withdrawal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 100,
        fee: 2.50,
        netAmount: 97.50,
        status: 'pending',
        pixKey: 'test@email.com',
      }),
    );
    // Amount moves from balance to scheduled (not immediately deducted fully)
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'employer-id-123',
      expect.objectContaining({
        $inc: { 'wallet.balance': -100, 'wallet.scheduled': 100 },
      }),
    );
  });

  it('waives fee for Hero Prime users', async () => {
    User.findById.mockResolvedValue({
      _id: 'employer-id-123',
      isPrime: true,
      wallet: { balance: 200 },
    });
    Withdrawal.create.mockResolvedValue({ id: 'wd-2', status: 'pending' });
    Transaction.create.mockResolvedValue({});
    User.findByIdAndUpdate.mockResolvedValue({});

    const res = await request(buildWalletApp())
      .post('/api/wallet/withdraw')
      .send({ amount: 100, pixKey: 'test@email.com' });

    expect(res.status).toBe(201);
    expect(Withdrawal.create).toHaveBeenCalledWith(
      expect.objectContaining({ fee: 0, netAmount: 100 }),
    );
  });
});

describe('GET /api/wallet/withdrawals', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns list of withdrawal requests for the user', async () => {
    Withdrawal.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        { id: 'wd-1', status: 'completed', amount: 100 },
        { id: 'wd-2', status: 'pending', amount: 50 },
      ]),
    });

    const res = await request(buildWalletApp()).get('/api/wallet/withdrawals');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });
});
