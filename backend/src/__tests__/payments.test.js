/**
 * Unit tests for:
 *  - paymentService (fee calculation, Stripe helper wrappers)
 *  - payments routes (escrow, subscription, release-escrow, webhook)
 *
 * Stripe API calls and DB models are mocked so no real network or DB is needed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock env before all imports that use it ─────────────────────────────────
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
  },
}));

// ─── Mock Stripe ──────────────────────────────────────────────────────────────
const mockStripe = vi.hoisted(() => ({
  customers: {
    create: vi.fn(),
  },
  paymentIntents: {
    create: vi.fn(),
    capture: vi.fn(),
    cancel: vi.fn(),
  },
  checkout: {
    sessions: {
      create: vi.fn(),
    },
  },
  subscriptions: {
    cancel: vi.fn(),
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
}));

vi.mock('stripe', () => ({
  // Use a regular function (not arrow) so `new Stripe(...)` works
  default: function MockStripe() { return mockStripe; },
}));

// ─── Mock Mongoose models ─────────────────────────────────────────────────────
vi.mock('../models/Job.js', () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findOne: vi.fn(),
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

// ─── Mock JWT middleware ──────────────────────────────────────────────────────
vi.mock('../middleware/auth.js', () => ({
  authenticate: (req, _res, next) => {
    req.user = { id: 'employer-id-123', role: 'employer' };
    next();
  },
  authorize: () => (_req, _res, next) => next(),
}));

// ─── Import after mocks ───────────────────────────────────────────────────────
import {
  calculateFee,
  FEE_FREELANCER_FREE,
  FEE_EMPLOYER,
  HERO_PRIME_PRICE_CENTS,
  getOrCreateCustomer,
  createEscrowPaymentIntent,
  releaseEscrow,
  cancelEscrow,
  createSubscriptionCheckoutSession,
  cancelSubscription,
  constructWebhookEvent,
} from '../services/paymentService.js';

import Job from '../models/Job.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

// ─── 1. Fee calculation ───────────────────────────────────────────────────────

describe('calculateFee', () => {
  it('applies 2.5% fee for free freelancer', () => {
    const { feeAmountCents, netAmountCents } = calculateFee(10000, 'freelancer_free');
    expect(feeAmountCents).toBe(250);       // 2.5% of 10000
    expect(netAmountCents).toBe(9750);
  });

  it('applies 1.5% fee for employer', () => {
    const { feeAmountCents, netAmountCents } = calculateFee(10000, 'employer');
    expect(feeAmountCents).toBe(150);       // 1.5% of 10000
    expect(netAmountCents).toBe(9850);
  });

  it('rounds the fee to the nearest cent', () => {
    const { feeAmountCents } = calculateFee(333, 'freelancer_free');
    expect(feeAmountCents).toBe(Math.round(333 * FEE_FREELANCER_FREE));
  });

  it('uses freelancer_free rate for unknown fee types', () => {
    const { feeAmountCents } = calculateFee(1000, 'unknown_type');
    expect(feeAmountCents).toBe(Math.round(1000 * FEE_FREELANCER_FREE));
  });

  it('exports correct constants', () => {
    expect(FEE_FREELANCER_FREE).toBe(0.025);
    expect(FEE_EMPLOYER).toBe(0.015);
    expect(HERO_PRIME_PRICE_CENTS).toBe(2990);
  });
});

// ─── 2. getOrCreateCustomer ───────────────────────────────────────────────────

describe('getOrCreateCustomer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns existing customer ID without calling Stripe', async () => {
    const user = {
      _id: 'user-1',
      email: 'test@test.com',
      name: 'Test',
      subscription: { stripeCustomerId: 'cus_existing' },
    };
    const id = await getOrCreateCustomer(user);
    expect(id).toBe('cus_existing');
    expect(mockStripe.customers.create).not.toHaveBeenCalled();
  });

  it('creates a new Stripe customer when none exists', async () => {
    mockStripe.customers.create.mockResolvedValue({ id: 'cus_new_123' });
    const user = {
      _id: 'user-2',
      email: 'new@test.com',
      name: 'New User',
      subscription: {},
    };
    const id = await getOrCreateCustomer(user);
    expect(id).toBe('cus_new_123');
    expect(mockStripe.customers.create).toHaveBeenCalledWith({
      email: 'new@test.com',
      name: 'New User',
      metadata: { userId: 'user-2' },
    });
  });
});

// ─── 3. createEscrowPaymentIntent ────────────────────────────────────────────

describe('createEscrowPaymentIntent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a manual capture PaymentIntent with correct amount', async () => {
    mockStripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret',
      amount: 10150,
      metadata: { feeAmountCents: '150', jobAmountCents: '10000' },
    });

    const result = await createEscrowPaymentIntent({
      amountCents: 10000,
      employerId: 'emp-1',
      jobId: 'job-1',
      description: 'Escrow test',
    });

    // 10000 + 1.5% employer fee (150) = 10150
    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 10150,
        currency: 'brl',
        capture_method: 'manual',
      }),
    );
    expect(result.id).toBe('pi_test_123');
  });
});

// ─── 4. releaseEscrow ────────────────────────────────────────────────────────

describe('releaseEscrow', () => {
  beforeEach(() => vi.clearAllMocks());

  it('captures the PaymentIntent and deducts 2.5% for free freelancer', async () => {
    mockStripe.paymentIntents.capture.mockResolvedValue({ id: 'pi_captured' });

    const result = await releaseEscrow({
      paymentIntentId: 'pi_test',
      jobAmountCents: 10000,
      freelancerIsPrime: false,
    });

    expect(result.freelancerNetCents).toBe(9750);
    expect(result.platformFeeCents).toBe(250);
    expect(mockStripe.paymentIntents.capture).toHaveBeenCalledWith('pi_test');
  });

  it('charges no fee for Hero Prime freelancers', async () => {
    mockStripe.paymentIntents.capture.mockResolvedValue({ id: 'pi_captured' });

    const result = await releaseEscrow({
      paymentIntentId: 'pi_test',
      jobAmountCents: 10000,
      freelancerIsPrime: true,
    });

    expect(result.freelancerNetCents).toBe(10000);
    expect(result.platformFeeCents).toBe(0);
  });
});

// ─── 5. cancelEscrow ─────────────────────────────────────────────────────────

describe('cancelEscrow', () => {
  it('calls stripe.paymentIntents.cancel with the given ID', async () => {
    mockStripe.paymentIntents.cancel.mockResolvedValue({ id: 'pi_canceled', status: 'canceled' });
    const result = await cancelEscrow('pi_test_cancel');
    expect(mockStripe.paymentIntents.cancel).toHaveBeenCalledWith('pi_test_cancel');
    expect(result.status).toBe('canceled');
  });
});

// ─── 6. createSubscriptionCheckoutSession ────────────────────────────────────

describe('createSubscriptionCheckoutSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a subscription checkout session with Hero Prime price', async () => {
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/session/cs_test_123',
    });

    const session = await createSubscriptionCheckoutSession({
      stripeCustomerId: 'cus_123',
      userId: 'user-123',
      successUrl: 'http://localhost:3000/success',
      cancelUrl: 'http://localhost:3000/cancel',
    });

    expect(session.id).toBe('cs_test_123');
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        customer: 'cus_123',
        line_items: expect.arrayContaining([
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: HERO_PRIME_PRICE_CENTS,
              currency: 'brl',
            }),
          }),
        ]),
      }),
    );
  });
});

// ─── 7. cancelSubscription ───────────────────────────────────────────────────

describe('cancelSubscription', () => {
  it('calls stripe.subscriptions.cancel with the subscription ID', async () => {
    mockStripe.subscriptions.cancel.mockResolvedValue({ id: 'sub_test', status: 'canceled' });
    const result = await cancelSubscription('sub_test');
    expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith('sub_test');
    expect(result.status).toBe('canceled');
  });
});

// ─── 8. constructWebhookEvent ─────────────────────────────────────────────────

describe('constructWebhookEvent', () => {
  it('delegates to stripe.webhooks.constructEvent', () => {
    const fakeEvent = { type: 'checkout.session.completed', data: {} };
    mockStripe.webhooks.constructEvent.mockReturnValue(fakeEvent);
    const result = constructWebhookEvent(Buffer.from('{}'), 'sig_test');
    expect(result).toEqual(fakeEvent);
    expect(mockStripe.webhooks.constructEvent).toHaveBeenCalled();
  });

  it('throws when STRIPE_WEBHOOK_SECRET is missing', async () => {
    const { env } = await import('../config/env.js');
    const original = env.STRIPE_WEBHOOK_SECRET;
    env.STRIPE_WEBHOOK_SECRET = '';
    expect(() => constructWebhookEvent(Buffer.from('{}'), 'sig')).toThrow(
      'STRIPE_WEBHOOK_SECRET is not configured',
    );
    env.STRIPE_WEBHOOK_SECRET = original;
  });
});

// ─── 9. Route integration (express app) ──────────────────────────────────────

import express from 'express';
import request from 'supertest';
import paymentsRouter from '../routes/payments.js';

function buildApp() {
  const app = express();
  app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json());
  app.use('/api/payments', paymentsRouter);
  return app;
}

// ── POST /api/payments/escrow ─────────────────────────────────────────────────

describe('POST /api/payments/escrow', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when jobId is missing', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/payments/escrow').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/jobId/i);
  });

  it('returns 404 when job does not exist', async () => {
    Job.findById.mockResolvedValue(null);
    const app = buildApp();
    const res = await request(app).post('/api/payments/escrow').send({ jobId: 'bad-id' });
    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not the employer', async () => {
    Job.findById.mockResolvedValue({
      _id: 'job-1',
      employerId: { toString: () => 'other-employer' },
      payment: 100,
      title: 'Test Job',
      escrowStatus: 'none',
    });
    const app = buildApp();
    const res = await request(app).post('/api/payments/escrow').send({ jobId: 'job-1' });
    expect(res.status).toBe(403);
  });

  it('returns 400 when escrow already exists', async () => {
    Job.findById.mockResolvedValue({
      _id: 'job-1',
      employerId: { toString: () => 'employer-id-123' },
      payment: 100,
      title: 'Test Job',
      escrowStatus: 'held',
    });
    const app = buildApp();
    const res = await request(app).post('/api/payments/escrow').send({ jobId: 'job-1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it('creates escrow and returns 201 with clientSecret', async () => {
    const mockJob = {
      _id: 'job-1',
      employerId: { toString: () => 'employer-id-123' },
      payment: 100,
      title: 'Test Job',
      escrowStatus: 'none',
      save: vi.fn().mockResolvedValue(true),
    };
    Job.findById.mockResolvedValue(mockJob);
    mockStripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_new',
      client_secret: 'pi_new_secret',
      amount: 10150,
      metadata: { feeAmountCents: '150', jobAmountCents: '10000' },
    });
    Transaction.create.mockResolvedValue({});

    const app = buildApp();
    const res = await request(app).post('/api/payments/escrow').send({ jobId: 'job-1' });

    expect(res.status).toBe(201);
    expect(res.body.data.paymentIntentId).toBe('pi_new');
    expect(res.body.data.clientSecret).toBe('pi_new_secret');
    expect(mockJob.escrowStatus).toBe('held');
    expect(mockJob.save).toHaveBeenCalled();
  });
});

// ── POST /api/payments/release-escrow/:jobId ──────────────────────────────────

describe('POST /api/payments/release-escrow/:jobId', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 when job not found', async () => {
    Job.findById.mockResolvedValue(null);
    const app = buildApp();
    const res = await request(app).post('/api/payments/release-escrow/missing-job');
    expect(res.status).toBe(404);
  });

  it('returns 400 when escrow is not held', async () => {
    Job.findById.mockResolvedValue({
      _id: 'job-2',
      employerId: { toString: () => 'employer-id-123' },
      escrowStatus: 'none',
    });
    const app = buildApp();
    const res = await request(app).post('/api/payments/release-escrow/job-2');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/held/i);
  });

  it('returns 400 when no approved freelancer', async () => {
    Job.findById.mockResolvedValue({
      _id: 'job-2',
      employerId: { toString: () => 'employer-id-123' },
      escrowStatus: 'held',
      escrowPaymentIntentId: 'pi_test',
      payment: 100,
      title: 'Test',
      applicants: [],
      save: vi.fn(),
    });
    const app = buildApp();
    const res = await request(app).post('/api/payments/release-escrow/job-2');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/approved freelancer/i);
  });

  it('releases escrow and credits freelancer wallet', async () => {
    const mockJob = {
      _id: 'job-2',
      employerId: { toString: () => 'employer-id-123' },
      escrowStatus: 'held',
      escrowPaymentIntentId: 'pi_held',
      payment: 100,
      title: 'Test Job',
      applicants: [{ userId: 'freelancer-id-1', status: 'approved' }],
      save: vi.fn().mockResolvedValue(true),
    };
    Job.findById.mockResolvedValue(mockJob);
    User.findById.mockResolvedValue({
      _id: 'freelancer-id-1',
      isPrime: false,
      subscription: { plan: 'none' },
    });
    mockStripe.paymentIntents.capture.mockResolvedValue({ id: 'pi_held' });
    User.findByIdAndUpdate.mockResolvedValue({});
    Transaction.create.mockResolvedValue({});

    const app = buildApp();
    const res = await request(app).post('/api/payments/release-escrow/job-2');

    expect(res.status).toBe(200);
    expect(res.body.data.freelancerNetBRL).toBe(97.5);   // 100 - 2.5%
    expect(res.body.data.platformFeeBRL).toBe(2.5);
    expect(res.body.data.freelancerIsPrime).toBe(false);
    expect(mockJob.escrowStatus).toBe('released');
    expect(mockJob.status).toBe('paid');
  });
});

// ── POST /api/payments/subscription ──────────────────────────────────────────

describe('POST /api/payments/subscription', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 when user not found', async () => {
    User.findById.mockResolvedValue(null);
    const app = buildApp();
    const res = await request(app).post('/api/payments/subscription').send({});
    expect(res.status).toBe(404);
  });

  it('returns 400 when already subscribed', async () => {
    User.findById.mockResolvedValue({
      _id: 'user-1',
      email: 'a@b.com',
      name: 'Test',
      isPrime: true,
      subscription: { plan: 'hero_prime', status: 'active', stripeCustomerId: 'cus_123' },
    });
    const app = buildApp();
    const res = await request(app).post('/api/payments/subscription').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already subscribed/i);
  });

  it('creates a checkout session and returns 201 with checkoutUrl', async () => {
    User.findById.mockResolvedValue({
      _id: 'user-1',
      email: 'a@b.com',
      name: 'Test',
      subscription: { plan: 'none', status: 'none', stripeCustomerId: 'cus_existing' },
    });
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_test',
      url: 'https://checkout.stripe.com/cs_test',
    });
    User.findByIdAndUpdate.mockResolvedValue({});

    const app = buildApp();
    const res = await request(app).post('/api/payments/subscription').send({});

    expect(res.status).toBe(201);
    expect(res.body.data.sessionId).toBe('cs_test');
    expect(res.body.data.checkoutUrl).toBe('https://checkout.stripe.com/cs_test');
  });
});

// ── DELETE /api/payments/subscription ────────────────────────────────────────

describe('DELETE /api/payments/subscription', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 when user not found', async () => {
    User.findById.mockResolvedValue(null);
    const app = buildApp();
    const res = await request(app).delete('/api/payments/subscription');
    expect(res.status).toBe(404);
  });

  it('returns 400 when no active subscription', async () => {
    User.findById.mockResolvedValue({
      _id: 'user-1',
      subscription: {},
    });
    const app = buildApp();
    const res = await request(app).delete('/api/payments/subscription');
    expect(res.status).toBe(400);
  });

  it('cancels the subscription and updates the user', async () => {
    User.findById.mockResolvedValue({
      _id: 'user-1',
      subscription: { stripeSubscriptionId: 'sub_active' },
    });
    mockStripe.subscriptions.cancel.mockResolvedValue({ id: 'sub_active', status: 'canceled' });
    User.findByIdAndUpdate.mockResolvedValue({});

    const app = buildApp();
    const res = await request(app).delete('/api/payments/subscription');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith('sub_active');
  });
});

// ── POST /api/payments/webhook ────────────────────────────────────────────────

describe('POST /api/payments/webhook', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when signature verification fails', async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });
    const app = buildApp();
    const res = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 'bad_sig')
      .set('content-type', 'application/json')
      .send(Buffer.from('{}'));
    expect(res.status).toBe(400);
  });

  it('handles checkout.session.completed and activates Hero Prime', async () => {
    const fakeEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'subscription',
          metadata: { userId: 'user-webhook' },
          subscription: 'sub_new',
        },
      },
    };
    mockStripe.webhooks.constructEvent.mockReturnValue(fakeEvent);
    User.findByIdAndUpdate.mockResolvedValue({});
    Transaction.create.mockResolvedValue({});

    const app = buildApp();
    const res = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 'valid_sig')
      .set('content-type', 'application/json')
      .send(Buffer.from(JSON.stringify(fakeEvent)));

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'user-webhook',
      expect.objectContaining({ isPrime: true }),
    );
  });

  it('handles customer.subscription.deleted and deactivates Hero Prime', async () => {
    const fakeEvent = {
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_deleted' } },
    };
    mockStripe.webhooks.constructEvent.mockReturnValue(fakeEvent);
    User.findOne.mockResolvedValue({ _id: 'user-sub', subscription: {} });
    User.findByIdAndUpdate.mockResolvedValue({});

    const app = buildApp();
    const res = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 'valid_sig')
      .set('content-type', 'application/json')
      .send(Buffer.from(JSON.stringify(fakeEvent)));

    expect(res.status).toBe(200);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'user-sub',
      expect.objectContaining({ isPrime: false }),
    );
  });

  it('returns 200 for unhandled event types without errors', async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: 'some.unknown.event',
      data: { object: {} },
    });

    const app = buildApp();
    const res = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 'sig')
      .set('content-type', 'application/json')
      .send(Buffer.from('{}'));

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });
});
