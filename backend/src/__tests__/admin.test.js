/**
 * Unit tests for admin routes:
 *  - GET  /api/admin/stats
 *  - GET  /api/admin/users
 *  - GET  /api/admin/jobs
 *  - DELETE /api/admin/jobs/:id
 *  - GET  /api/admin/kyc
 *  - PATCH /api/admin/kyc/:userId
 *
 * All DB models are mocked – no real network or DB needed.
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
  },
}));

// ─── Mock Mongoose models ─────────────────────────────────────────────────────
const mockUsers = [
  { _id: 'user1', name: 'João Silva', email: 'joao@test.com', role: 'freelancer', tier: 'Free', isPrime: false, rating: 4.5, kyc: { status: 'approved' }, createdAt: new Date().toISOString() },
  { _id: 'user2', name: 'Empresa XYZ', email: 'xyz@test.com', role: 'employer', tier: 'Pro', isPrime: true, rating: 4.8, kyc: { status: 'not_submitted' }, createdAt: new Date().toISOString() },
];

const mockJobs = [
  { _id: 'job1', title: 'Garçom para Evento', employer: 'Empresa XYZ', niche: 'Eventos', payment: 200, status: 'open', location: 'São Paulo', date: '2026-03-20' },
];

const mockKycPending = [
  { _id: 'user3', name: 'Pedro Costa', email: 'pedro@test.com', kyc: { status: 'pending', documentFrontUrl: 'https://example.com/front.jpg', documentBackUrl: 'https://example.com/back.jpg', selfieUrl: 'https://example.com/selfie.jpg', submittedAt: new Date().toISOString() } },
];

vi.mock('../models/User.js', () => ({
  default: {
    countDocuments: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('../models/Job.js', () => ({
  default: {
    countDocuments: vi.fn(),
    find: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

vi.mock('../models/Transaction.js', () => ({
  default: {
    find: vi.fn(),
    aggregate: vi.fn(),
  },
}));

// ─── Import routes after mocks ────────────────────────────────────────────────
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Transaction from '../models/Transaction.js';
import adminRouter from '../routes/admin.js';

// ─── Test App setup ───────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/api/admin', adminRouter);

function makeToken(payload = {}) {
  return jwt.sign(
    { id: 'admin-id', role: 'admin', ...payload },
    'test_jwt_secret',
    { expiresIn: '1h' }
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Admin routes – authentication & authorization', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin role', async () => {
    const token = makeToken({ role: 'freelancer' });
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/admin/stats', () => {
  beforeEach(() => {
    User.countDocuments
      .mockResolvedValueOnce(2)   // total
      .mockResolvedValueOnce(1)   // freelancers
      .mockResolvedValueOnce(1)   // employers
      .mockResolvedValueOnce(0);  // pending KYC
    Job.countDocuments
      .mockResolvedValueOnce(1)   // total
      .mockResolvedValueOnce(1)   // open
      .mockResolvedValueOnce(0);  // completed
    Transaction.find.mockReturnValue({ sort: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), lean: vi.fn().mockResolvedValue([]) });
    Transaction.aggregate.mockResolvedValue([{ total: 500 }]);
  });

  it('returns platform stats for admin', async () => {
    const token = makeToken();
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('users');
    expect(res.body.data).toHaveProperty('jobs');
    expect(res.body.data).toHaveProperty('kyc');
    expect(res.body.data).toHaveProperty('revenue');
    expect(res.body.data.users.total).toBe(2);
    expect(res.body.data.revenue.total).toBe(500);
  });
});

describe('GET /api/admin/users', () => {
  beforeEach(() => {
    const findChain = {
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(mockUsers),
    };
    User.find.mockReturnValue(findChain);
    User.countDocuments.mockResolvedValue(2);
  });

  it('returns list of users for admin', async () => {
    const token = makeToken();
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination).toHaveProperty('total', 2);
  });

  it('returns 403 for employer trying to list users', async () => {
    const token = makeToken({ role: 'employer' });
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/admin/jobs', () => {
  beforeEach(() => {
    const findChain = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(mockJobs),
    };
    Job.find.mockReturnValue(findChain);
    Job.countDocuments.mockResolvedValue(1);
  });

  it('returns list of jobs for admin', async () => {
    const token = makeToken();
    const res = await request(app)
      .get('/api/admin/jobs')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].title).toBe('Garçom para Evento');
  });
});

describe('DELETE /api/admin/jobs/:id', () => {
  it('removes a job and returns success', async () => {
    Job.findByIdAndDelete.mockResolvedValue(mockJobs[0]);
    const token = makeToken();
    const res = await request(app)
      .delete('/api/admin/jobs/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 when job not found', async () => {
    Job.findByIdAndDelete.mockResolvedValue(null);
    const token = makeToken();
    const res = await request(app)
      .delete('/api/admin/jobs/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid job id format', async () => {
    const token = makeToken();
    const res = await request(app)
      .delete('/api/admin/jobs/not-an-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

describe('GET /api/admin/kyc', () => {
  beforeEach(() => {
    const findChain = {
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(mockKycPending),
    };
    User.find.mockReturnValue(findChain);
  });

  it('returns pending KYC submissions for admin', async () => {
    const token = makeToken();
    const res = await request(app)
      .get('/api/admin/kyc')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].kyc.status).toBe('pending');
  });
});

describe('PATCH /api/admin/kyc/:userId', () => {
  it('approves a KYC submission', async () => {
    const updatedUser = { ...mockKycPending[0], kyc: { ...mockKycPending[0].kyc, status: 'approved', reviewedAt: new Date().toISOString() } };
    User.findOneAndUpdate.mockReturnValue({
      select: vi.fn().mockResolvedValue(updatedUser),
    });

    const token = makeToken();
    const res = await request(app)
      .patch('/api/admin/kyc/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`)
      .send({ decision: 'approved' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kyc.status).toBe('approved');
  });

  it('rejects a KYC submission with reason', async () => {
    const updatedUser = { ...mockKycPending[0], kyc: { ...mockKycPending[0].kyc, status: 'rejected', rejectionReason: 'Documento ilegível', reviewedAt: new Date().toISOString() } };
    User.findOneAndUpdate.mockReturnValue({
      select: vi.fn().mockResolvedValue(updatedUser),
    });

    const token = makeToken();
    const res = await request(app)
      .patch('/api/admin/kyc/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`)
      .send({ decision: 'rejected', rejectionReason: 'Documento ilegível' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 when decision is missing', async () => {
    const token = makeToken();
    const res = await request(app)
      .patch('/api/admin/kyc/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 400 when rejecting without a reason', async () => {
    const token = makeToken();
    const res = await request(app)
      .patch('/api/admin/kyc/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`)
      .send({ decision: 'rejected' });

    expect(res.status).toBe(400);
  });

  it('returns 404 when user not found or KYC not pending', async () => {
    User.findOneAndUpdate.mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    });

    const token = makeToken();
    const res = await request(app)
      .patch('/api/admin/kyc/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`)
      .send({ decision: 'approved' });

    expect(res.status).toBe(404);
  });
});
