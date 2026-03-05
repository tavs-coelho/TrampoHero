/**
 * Unit tests for GET /api/analytics/employer/stats
 *
 * All DB models, JWT and Mongoose are mocked – no real network or DB needed.
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
  },
}));

// ─── Mock mongoose ────────────────────────────────────────────────────────────
vi.mock('mongoose', async () => {
  const actual = await vi.importActual('mongoose');
  return {
    ...actual,
    default: {
      ...actual.default,
      Types: {
        ObjectId: class MockObjectId {
          constructor(id) { this.id = id; }
          toString() { return this.id; }
        },
      },
    },
  };
});

// ─── Mock Job model ───────────────────────────────────────────────────────────
vi.mock('../models/Job.js', () => ({
  default: {
    aggregate: vi.fn(),
  },
}));

// ─── Mock Transaction model ───────────────────────────────────────────────────
vi.mock('../models/Transaction.js', () => ({
  default: {
    aggregate: vi.fn(),
  },
}));

// ─── Import after mocks ───────────────────────────────────────────────────────
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import Job from '../models/Job.js';
import Transaction from '../models/Transaction.js';
import analyticsRouter from '../routes/analytics.js';

process.env.JWT_SECRET = 'test_jwt_secret';

// ─── Test app ─────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/api/analytics', analyticsRouter);

function makeToken(payload = {}) {
  return jwt.sign(
    { id: 'employer-id-123', role: 'employer', ...payload },
    'test_jwt_secret',
    { expiresIn: '1h' }
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/analytics/employer/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns correct stats when employer has completed jobs and transactions', async () => {
    Job.aggregate.mockResolvedValue([
      { totalJobs: 10, jobsCompleted: 8, totalGained: 4000 },
    ]);
    Transaction.aggregate.mockResolvedValue([
      { _id: '2024-01-15', total: 500, count: 2 },
      { _id: '2024-01-20', total: 300, count: 1 },
    ]);

    const token = makeToken();
    const res = await request(app)
      .get('/api/analytics/employer/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      totalGained: 4000,
      jobsCompleted: 8,
      averagePerJob: 500,
      retentionRate: 80,
    });
    expect(res.body.data.last30DaysChart).toHaveLength(2);
    expect(res.body.data.last30DaysChart[0]).toMatchObject({
      date: '2024-01-15',
      total: 500,
      count: 2,
    });
  });

  it('returns zeroed stats when employer has no jobs', async () => {
    Job.aggregate.mockResolvedValue([]);
    Transaction.aggregate.mockResolvedValue([]);

    const token = makeToken();
    const res = await request(app)
      .get('/api/analytics/employer/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      totalGained: 0,
      jobsCompleted: 0,
      averagePerJob: 0,
      retentionRate: 0,
      last30DaysChart: [],
    });
  });

  it('returns 0 averagePerJob when jobsCompleted is 0 (avoid division by zero)', async () => {
    Job.aggregate.mockResolvedValue([
      { totalJobs: 5, jobsCompleted: 0, totalGained: 0 },
    ]);
    Transaction.aggregate.mockResolvedValue([]);

    const token = makeToken();
    const res = await request(app)
      .get('/api/analytics/employer/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.averagePerJob).toBe(0);
    expect(res.body.data.retentionRate).toBe(0);
  });

  it('returns empty last30DaysChart when no transactions exist', async () => {
    Job.aggregate.mockResolvedValue([
      { totalJobs: 3, jobsCompleted: 2, totalGained: 600 },
    ]);
    Transaction.aggregate.mockResolvedValue([]);

    const token = makeToken();
    const res = await request(app)
      .get('/api/analytics/employer/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.last30DaysChart).toEqual([]);
  });

  it('returns 401 when no auth token is provided', async () => {
    const res = await request(app).get('/api/analytics/employer/stats');

    expect(res.status).toBe(401);
  });

  it('returns 403 when authenticated user is not an employer', async () => {
    Job.aggregate.mockResolvedValue([]);
    Transaction.aggregate.mockResolvedValue([]);

    const token = makeToken({ role: 'freelancer' });
    const res = await request(app)
      .get('/api/analytics/employer/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('returns 500 on unexpected database error', async () => {
    Job.aggregate.mockRejectedValue(new Error('DB connection lost'));

    const token = makeToken();
    const res = await request(app)
      .get('/api/analytics/employer/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
