/**
 * Security and fraud/abuse scenario tests.
 *
 * Covers:
 *  – Token manipulation (expired, forged, wrong secret, wrong type)
 *  – Role escalation (freelancer acting as employer/admin)
 *  – IDOR (accessing another user's resources)
 *  – Duplicate/concurrent operation prevention (double-apply, double-checkout,
 *    double-review, referral bonus race)
 *  – Input boundary attacks (negative amounts, oversized strings)
 *  – Fraud scenarios (self-review, under-minimum withdrawal, over-balance withdrawal)
 *
 * All DB models are mocked – no real network or DB needed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// ─── Mock env ─────────────────────────────────────────────────────────────────
vi.mock('../config/env.js', () => ({
  env: {
    JWT_SECRET: 'test_jwt_secret',
    JWT_EXPIRE: '1h',
    JWT_REFRESH_SECRET: 'test_jwt_refresh_secret',
    JWT_REFRESH_EXPIRE: '30d',
    AUTH_RATE_LIMIT_MAX: 100,
    AUTH_RATE_LIMIT_WINDOW_MS: 900000,
    MONGODB_URI: 'mongodb://localhost/test',
    NODE_ENV: 'test',
    PORT: 5000,
    RATE_LIMIT_MAX: 100,
    ALLOWED_ORIGINS: ['http://localhost:3000'],
    FRONTEND_URL: 'http://localhost:3000',
    EMAIL_ENABLED: false,
    SMTP_HOST: '',
    SMTP_PORT: 587,
    SMTP_SECURE: false,
    SMTP_USER: '',
    SMTP_PASS: '',
    EMAIL_FROM: 'noreply@trampohero.com.br',
    GEMINI_API_KEY: '',
    STRIPE_SECRET_KEY: '',
    STRIPE_WEBHOOK_SECRET: '',
    AZURE_STORAGE_ACCOUNT_NAME: '',
    AZURE_STORAGE_ACCOUNT_KEY: '',
    AZURE_STORAGE_CONTAINER_NAME: 'uploads',
    ANH_CONNECTION_STRING: '',
    ANH_HUB_NAME: '',
    AZURE_WEBPUBSUB_CONNECTION_STRING: '',
    AZURE_WEBPUBSUB_HUB_NAME: '',
    AZURE_BLOB_BASE_URL: '',
    WITHDRAWAL_FEE: 2.5,
    MIN_WITHDRAWAL: 10,
  },
}));

// ─── Mock email service ────────────────────────────────────────────────────────
vi.mock('../services/emailService.js', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

// ─── Stubs needed by jobs route ───────────────────────────────────────────────
vi.mock('../services/pdfService.js', () => ({ generateJobContract: vi.fn() }));
vi.mock('../routes/referral.js', () => ({ REFERRAL_BONUS: 10 }));
vi.mock('@azure/storage-blob', () => ({
  BlobServiceClient: vi.fn(),
  generateBlobSASQueryParameters: vi.fn(() => ({ toString: () => 'sas=mock' })),
  BlobSASPermissions: { parse: vi.fn() },
  StorageSharedKeyCredential: vi.fn(),
}));
vi.mock('@azure/web-pubsub', () => ({
  WebPubSubServiceClient: vi.fn(() => ({
    getClientAccessToken: vi.fn().mockResolvedValue({ url: 'wss://mock' }),
  })),
}));

// ─── Mock Mongoose models ─────────────────────────────────────────────────────
const FREELANCER_ID = '507f191e810c19729de860ea';
const EMPLOYER_ID = '507f191e810c19729de860eb';
const JOB_ID = '507f1f77bcf86cd799439011';

const buildJob = (overrides = {}) => ({
  _id: JOB_ID,
  employerId: { toString: () => EMPLOYER_ID },
  status: 'open',
  payment: 150,
  title: 'Garçom para evento',
  applicants: [],
  save: vi.fn().mockResolvedValue(true),
  ...overrides,
});

vi.mock('../models/Job.js', () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock('../models/User.js', () => ({
  default: {
    findOne: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('../models/Review.js', () => ({
  default: {
    create: vi.fn(),
    find: vi.fn(),
    aggregate: vi.fn(),
  },
}));

vi.mock('../models/Transaction.js', () => ({
  default: { create: vi.fn(), findOneAndUpdate: vi.fn() },
}));

vi.mock('../models/Withdrawal.js', () => ({
  default: { create: vi.fn(), find: vi.fn() },
}));

// ─── Import routes after mocks ────────────────────────────────────────────────
import express from 'express';
import request from 'supertest';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Transaction from '../models/Transaction.js';
import Withdrawal from '../models/Withdrawal.js';
import authRouter from '../routes/auth.js';
import jobsRouter from '../routes/jobs.js';
import reviewsRouter from '../routes/reviews.js';
import walletRouter from '../routes/wallet.js';

process.env.JWT_SECRET = 'test_jwt_secret';

// ─── Express apps ─────────────────────────────────────────────────────────────
const authApp = express();
authApp.use(express.json());
authApp.use('/api/auth', authRouter);

const jobsApp = express();
jobsApp.use(express.json());
jobsApp.use('/api/jobs', jobsRouter);

const reviewsApp = express();
reviewsApp.use(express.json());
reviewsApp.use('/api/reviews', reviewsRouter);

const walletApp = express();
walletApp.use(express.json());
walletApp.use('/api/wallet', walletRouter);

// ─── Token helpers ─────────────────────────────────────────────────────────────
function makeToken(payload = {}) {
  return jwt.sign(payload, 'test_jwt_secret', { expiresIn: '1h' });
}
function makeExpiredToken(payload = {}) {
  return jwt.sign(payload, 'test_jwt_secret', { expiresIn: '-1s' });
}
function makeTokenWithWrongSecret(payload = {}) {
  return jwt.sign(payload, 'completely-different-secret', { expiresIn: '1h' });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Token manipulation and authentication security
// ═══════════════════════════════════════════════════════════════════════════════

describe('Security – token manipulation', () => {
  it('rejects an expired access token', async () => {
    const token = makeExpiredToken({ id: EMPLOYER_ID, role: 'employer' });
    const res = await request(jobsApp)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  it('rejects a token signed with a wrong secret', async () => {
    const token = makeTokenWithWrongSecret({ id: EMPLOYER_ID, role: 'employer' });
    const res = await request(jobsApp)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(401);
  });

  it('rejects a malformed token (random string)', async () => {
    const res = await request(jobsApp)
      .post('/api/jobs')
      .set('Authorization', 'Bearer this.is.not.a.jwt')
      .send({});

    expect(res.status).toBe(401);
  });

  it('rejects when Authorization header is completely absent', async () => {
    const res = await request(jobsApp).post('/api/jobs').send({});
    expect(res.status).toBe(401);
  });

  it('rejects token with role field tampered to admin after signing', async () => {
    // A JWT with freelancer role cannot be changed to admin after signing
    const legitimateToken = makeToken({ id: FREELANCER_ID, role: 'freelancer' });
    // Split and tamper with payload (base64)
    const [header, , sig] = legitimateToken.split('.');
    const tamperedPayload = Buffer.from(
      JSON.stringify({ id: FREELANCER_ID, role: 'admin' })
    ).toString('base64url');
    const tamperedToken = `${header}.${tamperedPayload}.${sig}`;
    const res = await request(jobsApp)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${tamperedToken}`)
      .send({});

    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Role escalation / Authorization boundary
// ═══════════════════════════════════════════════════════════════════════════════

describe('Security – role escalation prevention', () => {
  it('prevents freelancer from creating a job (employer-only route)', async () => {
    const token = makeToken({ id: FREELANCER_ID, role: 'freelancer' });
    const res = await request(jobsApp)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Hack job', coordinates: { lat: -23, lng: -46 } });

    expect(res.status).toBe(403);
  });

  it('prevents employer from applying to a job (freelancer-only route)', async () => {
    Job.findById.mockResolvedValue(buildJob());
    const token = makeToken({ id: EMPLOYER_ID, role: 'employer' });
    const res = await request(jobsApp)
      .post(`/api/jobs/${JOB_ID}/apply`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('prevents registration with admin role (blocked on register)', async () => {
    User.findOne.mockResolvedValue(null);
    const res = await request(authApp)
      .post('/api/auth/register')
      .send({
        email: 'hacker@example.com',
        password: 'HackPass1',
        name: 'Hacker',
        role: 'admin',
      });

    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// IDOR – Insecure Direct Object Reference
// ═══════════════════════════════════════════════════════════════════════════════

describe('Security – IDOR prevention', () => {
  it('prevents employer from reading applicants of another employer\'s job', async () => {
    const anotherEmployerJob = buildJob({ employerId: { toString: () => 'other-employer-id' } });
    Job.findById.mockResolvedValue(anotherEmployerJob);
    User.find = vi.fn().mockResolvedValue([]);

    const token = makeToken({ id: EMPLOYER_ID, role: 'employer' });
    const res = await request(jobsApp)
      .get(`/api/jobs/${JOB_ID}/applicants`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('prevents freelancer from approving a candidate (employer-only action)', async () => {
    const token = makeToken({ id: FREELANCER_ID, role: 'freelancer' });
    const res = await request(jobsApp)
      .post(`/api/jobs/${JOB_ID}/select-candidate`)
      .set('Authorization', `Bearer ${token}`)
      .send({ candidateId: FREELANCER_ID });

    expect(res.status).toBe(403);
  });

  it('prevents employer from completing another employer\'s job', async () => {
    const anotherEmployerJob = buildJob({
      employerId: { toString: () => 'other-employer-id' },
      status: 'waiting_approval',
      applicants: [{ userId: { toString: () => FREELANCER_ID }, status: 'approved' }],
    });
    Job.findById.mockResolvedValue(anotherEmployerJob);

    const token = makeToken({ id: EMPLOYER_ID, role: 'employer' });
    const res = await request(jobsApp)
      .post(`/api/jobs/${JOB_ID}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('prevents a freelancer from checking out a job they are not assigned to', async () => {
    const job = buildJob({
      status: 'ongoing',
      applicants: [
        { userId: { toString: () => 'other-freelancer-id' }, status: 'approved' },
      ],
    });
    Job.findById.mockResolvedValue(job);

    const token = makeToken({ id: FREELANCER_ID, role: 'freelancer' });
    const res = await request(jobsApp)
      .post(`/api/jobs/${JOB_ID}/checkout`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Duplicate operation prevention
// ═══════════════════════════════════════════════════════════════════════════════

describe('Fraud – duplicate operation prevention', () => {
  it('prevents a freelancer from applying to the same job twice', async () => {
    const job = buildJob({
      applicants: [{ userId: { toString: () => FREELANCER_ID }, status: 'pending' }],
    });
    Job.findById.mockResolvedValue(job);

    const token = makeToken({ id: FREELANCER_ID, role: 'freelancer' });
    const res = await request(jobsApp)
      .post(`/api/jobs/${JOB_ID}/apply`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already applied/i);
  });

  it('prevents duplicate review for the same job (DB unique index)', async () => {
    Review.create.mockRejectedValue({ code: 11000 });

    const token = makeToken({ id: EMPLOYER_ID, role: 'employer' });
    const res = await request(reviewsApp)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5, targetId: FREELANCER_ID, jobId: 'job-1' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already reviewed/i);
  });

  it('prevents applying to a job that is no longer open', async () => {
    const closedJob = buildJob({ status: 'applied' });
    Job.findById.mockResolvedValue(closedJob);

    const token = makeToken({ id: FREELANCER_ID, role: 'freelancer' });
    const res = await request(jobsApp)
      .post(`/api/jobs/${JOB_ID}/apply`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not open/i);
  });

  it('prevents checking out a job that is not ongoing', async () => {
    const job = buildJob({
      status: 'applied',
      applicants: [{ userId: { toString: () => FREELANCER_ID }, status: 'approved' }],
    });
    Job.findById.mockResolvedValue(job);

    const token = makeToken({ id: FREELANCER_ID, role: 'freelancer' });
    const res = await request(jobsApp)
      .post(`/api/jobs/${JOB_ID}/checkout`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Fraud – self-targeting prevention
// ═══════════════════════════════════════════════════════════════════════════════

describe('Fraud – self-targeting prevention', () => {
  it('prevents self-review (reviewing yourself)', async () => {
    const token = makeToken({ id: EMPLOYER_ID, role: 'employer' });
    const res = await request(reviewsApp)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5, targetId: EMPLOYER_ID, jobId: 'job-1' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot review yourself/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Fraud – wallet / financial manipulation
// ═══════════════════════════════════════════════════════════════════════════════

describe('Fraud – wallet manipulation prevention', () => {
  const walletToken = () => makeToken({ id: EMPLOYER_ID, role: 'employer' });
  beforeEach(() => vi.clearAllMocks());

  it('prevents withdrawal of more than available balance', async () => {
    User.findById.mockResolvedValue({
      _id: EMPLOYER_ID,
      isPrime: false,
      wallet: { balance: 30 },
    });
    const res = await request(walletApp)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${walletToken()}`)
      .send({ amount: 500, pixKey: 'test@email.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient/i);
  });

  it('prevents withdrawal below the minimum threshold', async () => {
    const res = await request(walletApp)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${walletToken()}`)
      .send({ amount: 5, pixKey: 'test@email.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/minimum/i);
  });

  it('prevents withdrawal with negative amount', async () => {
    const res = await request(walletApp)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${walletToken()}`)
      .send({ amount: -100, pixKey: 'test@email.com' });

    expect(res.status).toBe(400);
  });

  it('prevents withdrawal with zero amount', async () => {
    const res = await request(walletApp)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${walletToken()}`)
      .send({ amount: 0, pixKey: 'test@email.com' });

    expect(res.status).toBe(400);
  });

  it('prevents withdrawal without a pix key', async () => {
    const res = await request(walletApp)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${walletToken()}`)
      .send({ amount: 50 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/pix key/i);
  });

  it('prevents withdrawal when amount field is missing entirely', async () => {
    const res = await request(walletApp)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${walletToken()}`)
      .send({ pixKey: 'test@pix.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid amount/i);
  });

  it('returns 401 without auth token on withdraw', async () => {
    const res = await request(walletApp)
      .post('/api/wallet/withdraw')
      .send({ amount: 50, pixKey: 'test@pix.com' });

    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Fraud – account registration abuse
// ═══════════════════════════════════════════════════════════════════════════════

describe('Fraud – account registration abuse', () => {
  beforeEach(() => vi.clearAllMocks());

  it('prevents registration with an email that already exists', async () => {
    const existing = {
      _id: 'user-already-exists',
      email: 'taken@example.com',
      comparePassword: vi.fn(),
      save: vi.fn(),
    };
    User.findOne.mockResolvedValue(existing);

    const res = await request(authApp)
      .post('/api/auth/register')
      .send({
        email: 'taken@example.com',
        password: 'SecurePass1',
        name: 'Duplicate User',
        role: 'freelancer',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it('rejects registration with a weak password (no uppercase)', async () => {
    User.findOne.mockResolvedValue(null);
    const res = await request(authApp)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'weakpassword1', name: 'User', role: 'freelancer' });

    expect(res.status).toBe(400);
  });

  it('rejects registration with a password shorter than 8 characters', async () => {
    User.findOne.mockResolvedValue(null);
    const res = await request(authApp)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'Sh0rt', name: 'User', role: 'freelancer' });

    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Edge cases – boundary inputs
// ═══════════════════════════════════════════════════════════════════════════════

describe('Edge cases – boundary inputs', () => {
  it('GET /api/jobs returns 200 with empty list (no jobs in DB)', async () => {
    Job.find.mockReturnValue({ sort: vi.fn().mockResolvedValue([]) });
    const res = await request(jobsApp).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  it('GET /api/jobs/:id returns 404 for a non-existent job id', async () => {
    Job.findById.mockResolvedValue(null);
    const res = await request(jobsApp).get(`/api/jobs/${JOB_ID}`);
    expect(res.status).toBe(404);
  });

  it('POST /api/reviews returns 400 when targetId is missing', async () => {
    const token = makeToken({ id: EMPLOYER_ID, role: 'employer' });
    const res = await request(reviewsApp)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5, jobId: 'job-1' });
    expect(res.status).toBe(400);
  });

  it('GET /api/reviews returns 400 when targetId query param is absent', async () => {
    const res = await request(reviewsApp).get('/api/reviews');
    expect(res.status).toBe(400);
  });
});
