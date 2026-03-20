/**
 * Unit tests for the job approval (completion) flow:
 *  - POST /api/jobs/:id/complete – Employer approves work, generates contract
 *
 * All DB models, JWT and Azure SDKs are mocked – no real network or DB needed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock env ─────────────────────────────────────────────────────────────────
vi.mock('../config/env.js', () => ({
  env: {
    JWT_SECRET: 'test_jwt_secret',
    JWT_EXPIRE: '30d',
    MONGODB_URI: 'mongodb://localhost/test',
    NODE_ENV: 'test',
    PORT: 5000,
    RATE_LIMIT_MAX: 100,
    ALLOWED_ORIGINS: ['http://localhost:3000'],
    FRONTEND_URL: 'http://localhost:3000',
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
  },
}));

// ─── Mock pdfService ──────────────────────────────────────────────────────────
vi.mock('../services/pdfService.js', () => ({
  generateJobContract: vi.fn().mockResolvedValue({
    downloadUrl: 'https://storage.example.com/contracts/contract-abc.pdf',
    validationHash: 'sha256-hash-abc',
  }),
}));

// ─── Mock referral bonus constant ─────────────────────────────────────────────
vi.mock('../routes/referral.js', () => ({ REFERRAL_BONUS: 10 }));

// ─── Mock Azure SDKs ──────────────────────────────────────────────────────────
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
  status: 'waiting_approval',
  payment: 150,
  title: 'Garçom para evento',
  applicants: [
    { userId: { toString: () => FREELANCER_ID }, status: 'approved' },
  ],
  save: vi.fn().mockResolvedValue(true),
  ...overrides,
});

vi.mock('../models/Job.js', () => ({
  default: {
    findById: vi.fn(),
  },
}));

const mockFreelancer = {
  _id: FREELANCER_ID,
  name: 'João Freelancer',
  email: 'joao@example.com',
  referredBy: null,
  referralBonusPaid: false,
};

const mockEmployer = {
  _id: EMPLOYER_ID,
  name: 'Empresa Contratante',
  email: 'empresa@example.com',
};

vi.mock('../models/User.js', () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('../models/Transaction.js', () => ({
  default: { create: vi.fn() },
}));

// ─── Import after mocks ───────────────────────────────────────────────────────
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { generateJobContract } from '../services/pdfService.js';
import jobsRouter from '../routes/jobs.js';

process.env.JWT_SECRET = 'test_jwt_secret';

const app = express();
app.use(express.json());
app.use('/api/jobs', jobsRouter);

function makeToken(payload = {}) {
  return jwt.sign(
    { id: EMPLOYER_ID, role: 'employer', ...payload },
    'test_jwt_secret',
    { expiresIn: '1h' }
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/jobs/:id/complete  –  Approval / Completion
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /api/jobs/:id/complete', () => {
  let mockJob;

  beforeEach(() => {
    vi.clearAllMocks();
    mockJob = buildJob();
    Job.findById.mockResolvedValue(mockJob);
    User.findById.mockImplementation((id) => {
      if (id === FREELANCER_ID || id?.toString() === FREELANCER_ID) return Promise.resolve(mockFreelancer);
      return Promise.resolve(mockEmployer);
    });
    User.findOneAndUpdate.mockResolvedValue(null); // no referral by default
    Transaction.create.mockResolvedValue({});
  });

  // ── Happy-path ──────────────────────────────────────────────────────────────

  it('completes a job in waiting_approval status and returns contract details', async () => {
    const token = makeToken();
    const res = await request(app)
      .post(`/api/jobs/${JOB_ID}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.job.status).toBe('completed');
    expect(res.body.data.contract.downloadUrl).toMatch(/\.pdf$/);
    expect(res.body.data.contract.validationHash).toBeDefined();
    expect(mockJob.save).toHaveBeenCalled();
    expect(generateJobContract).toHaveBeenCalledWith(mockFreelancer, mockEmployer, mockJob);
  });

  it('completes a job that is still in ongoing status', async () => {
    mockJob.status = 'ongoing';
    const token = makeToken();
    const res = await request(app)
      .post(`/api/jobs/${JOB_ID}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(mockJob.status).toBe('completed');
  });

  // ── Authorization ───────────────────────────────────────────────────────────

  it('returns 403 when a non-owner employer tries to complete the job', async () => {
    const token = makeToken({ id: 'other-employer' });
    const res = await request(app)
      .post(`/api/jobs/${JOB_ID}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/not authorized/i);
  });

  it('returns 403 when a freelancer tries to complete the job', async () => {
    const token = makeToken({ id: FREELANCER_ID, role: 'freelancer' });
    const res = await request(app)
      .post(`/api/jobs/${JOB_ID}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).post(`/api/jobs/${JOB_ID}/complete`);
    expect(res.status).toBe(401);
  });

  // ── Job state validation ────────────────────────────────────────────────────

  it('returns 404 when job not found', async () => {
    Job.findById.mockResolvedValue(null);
    const token = makeToken();
    const res = await request(app)
      .post(`/api/jobs/${JOB_ID}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 400 when job status is open (not yet started)', async () => {
    mockJob.status = 'open';
    const token = makeToken();
    const res = await request(app)
      .post(`/api/jobs/${JOB_ID}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot be completed/i);
  });

  it('returns 400 when job is already completed', async () => {
    mockJob.status = 'completed';
    const token = makeToken();
    const res = await request(app)
      .post(`/api/jobs/${JOB_ID}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('returns 400 when job status is cancelled', async () => {
    mockJob.status = 'cancelled';
    const token = makeToken();
    const res = await request(app)
      .post(`/api/jobs/${JOB_ID}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('returns 400 when no approved freelancer is assigned', async () => {
    mockJob.applicants = [
      { userId: { toString: () => FREELANCER_ID }, status: 'pending' },
    ];
    const token = makeToken();
    const res = await request(app)
      .post(`/api/jobs/${JOB_ID}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no approved freelancer/i);
  });

  it('returns 400 when there are no applicants at all', async () => {
    mockJob.applicants = [];
    const token = makeToken();
    const res = await request(app)
      .post(`/api/jobs/${JOB_ID}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  // ── User lookup ─────────────────────────────────────────────────────────────

  it('returns 404 when freelancer user document is not found', async () => {
    User.findById.mockImplementation((id) => {
      if (id === FREELANCER_ID || id?.toString() === FREELANCER_ID) return Promise.resolve(null);
      return Promise.resolve(mockEmployer);
    });
    const token = makeToken();
    const res = await request(app)
      .post(`/api/jobs/${JOB_ID}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/user data not found/i);
  });

  it('returns 404 when employer user document is not found', async () => {
    User.findById.mockResolvedValue(null);
    const token = makeToken();
    const res = await request(app)
      .post(`/api/jobs/${JOB_ID}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  // ── Referral bonus (concurrency safety) ────────────────────────────────────

  it('does not pay referral bonus when freelancer was not referred', async () => {
    mockFreelancer.referredBy = null;
    const token = makeToken();
    await request(app)
      .post(`/api/jobs/${JOB_ID}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(User.findOneAndUpdate).not.toHaveBeenCalled();
    expect(Transaction.create).not.toHaveBeenCalled();
  });

  it('credits R$ 10 referral bonus to referrer on first completed job', async () => {
    const REFERRER_ID = 'referrer-user-id';
    mockFreelancer.referredBy = REFERRER_ID;
    mockFreelancer.referralBonusPaid = false;

    // Atomic update returns the doc (meaning the bonus was claimed)
    User.findOneAndUpdate.mockResolvedValue({ _id: FREELANCER_ID });
    User.findByIdAndUpdate.mockResolvedValue({ _id: REFERRER_ID });
    Transaction.create.mockResolvedValue({});

    const token = makeToken();
    const res = await request(app)
      .post(`/api/jobs/${JOB_ID}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: mockFreelancer._id, referralBonusPaid: false },
      { referralBonusPaid: true }
    );
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      REFERRER_ID,
      { $inc: { 'wallet.balance': 10 } }
    );
    expect(Transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: REFERRER_ID, type: 'referral_bonus', amount: 10 })
    );
  });

  it('does not double-pay referral bonus when findOneAndUpdate returns null (race condition)', async () => {
    const REFERRER_ID = 'referrer-user-id';
    mockFreelancer.referredBy = REFERRER_ID;
    mockFreelancer.referralBonusPaid = false;

    // Simulate another request already claimed the bonus (atomic update returns null)
    User.findOneAndUpdate.mockResolvedValue(null);

    const token = makeToken();
    const res = await request(app)
      .post(`/api/jobs/${JOB_ID}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // Wallet update and transaction must NOT be called
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(Transaction.create).not.toHaveBeenCalled();
  });
});
