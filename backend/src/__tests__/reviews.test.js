/**
 * Unit tests for the review system:
 *  - POST /api/reviews – Create a review after job completion
 *  - GET  /api/reviews – Retrieve reviews for a user with average rating
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

// ─── Mock Review model ────────────────────────────────────────────────────────
const mockReview = {
  _id: 'review-1',
  rating: 5,
  comment: 'Ótimo serviço!',
  authorId: 'employer-id',
  targetId: 'freelancer-id',
  jobId: 'job-1',
};

vi.mock('../models/Review.js', () => ({
  default: {
    create: vi.fn(),
    find: vi.fn(),
    aggregate: vi.fn(),
  },
}));

// ─── Mock User model (dynamically imported by reviews route) ─────────────────
vi.mock('../models/User.js', () => ({
  default: {
    findByIdAndUpdate: vi.fn(),
  },
}));

// ─── Import after mocks ───────────────────────────────────────────────────────
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import Review from '../models/Review.js';
import reviewsRouter from '../routes/reviews.js';

process.env.JWT_SECRET = 'test_jwt_secret';

const app = express();
app.use(express.json());
app.use('/api/reviews', reviewsRouter);

function makeToken(payload = {}) {
  return jwt.sign(
    { id: 'employer-id', role: 'employer', ...payload },
    'test_jwt_secret',
    { expiresIn: '1h' }
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/reviews
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /api/reviews', () => {
  const validPayload = {
    rating: 5,
    comment: 'Excelente profissional!',
    targetId: 'freelancer-id',
    jobId: 'job-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Review.create.mockResolvedValue(mockReview);
    Review.aggregate.mockResolvedValue([{ _id: 'freelancer-id', avgRating: 4.8 }]);
  });

  // ── Happy path ─────────────────────────────────────────────────────────────

  it('creates a review and returns 201', async () => {
    const token = makeToken();
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(Review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        rating: 5,
        comment: 'Excelente profissional!',
        authorId: 'employer-id',
        targetId: 'freelancer-id',
        jobId: 'job-1',
      })
    );
  });

  it('updates target user average rating after review creation', async () => {
    const { default: User } = await import('../models/User.js');
    const token = makeToken();
    await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload);

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'freelancer-id',
      { rating: 4.8 }
    );
  });

  it('stores empty string for comment when omitted', async () => {
    const token = makeToken();
    const { comment: _omit, ...payloadWithoutComment } = validPayload;
    await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(payloadWithoutComment);

    expect(Review.create).toHaveBeenCalledWith(
      expect.objectContaining({ comment: '' })
    );
  });

  // ── Validation ──────────────────────────────────────────────────────────────

  it('returns 400 when rating is missing', async () => {
    const token = makeToken();
    const { rating: _omit, ...payload } = validPayload;
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when targetId is missing', async () => {
    const token = makeToken();
    const { targetId: _omit, ...payload } = validPayload;
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('returns 400 when jobId is missing', async () => {
    const token = makeToken();
    const { jobId: _omit, ...payload } = validPayload;
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(400);
  });

  // ── Fraud / abuse prevention ────────────────────────────────────────────────

  it('returns 400 when reviewer tries to review themselves (self-review)', async () => {
    const token = makeToken({ id: 'employer-id' });
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validPayload, targetId: 'employer-id' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot review yourself/i);
  });

  it('returns 400 on duplicate review for the same job (unique constraint)', async () => {
    Review.create.mockRejectedValue({ code: 11000 });
    const token = makeToken();
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already reviewed/i);
  });

  // ── Authentication ─────────────────────────────────────────────────────────

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .send(validPayload);

    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/reviews
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /api/reviews', () => {
  const TARGET_ID = '507f191e810c19729de860ea';

  beforeEach(() => {
    vi.clearAllMocks();
    Review.find.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockResolvedValue([
        { ...mockReview, targetId: TARGET_ID, rating: 5 },
        { ...mockReview, targetId: TARGET_ID, rating: 4, comment: 'Bom trabalho' },
      ]),
    });
    Review.aggregate.mockResolvedValue([
      { _id: TARGET_ID, average: 4.5, count: 2 },
    ]);
  });

  it('returns reviews and computed average for a target user', async () => {
    const res = await request(app)
      .get(`/api/reviews?targetId=${TARGET_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
    expect(res.body.average).toBe(4.5);
    expect(res.body.data).toHaveLength(2);
  });

  it('returns average 0 and empty data when user has no reviews', async () => {
    Review.find.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockResolvedValue([]),
    });
    Review.aggregate.mockResolvedValue([]);

    const res = await request(app)
      .get(`/api/reviews?targetId=${TARGET_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.average).toBe(0);
    expect(res.body.count).toBe(0);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns 400 when targetId query param is missing', async () => {
    const res = await request(app).get('/api/reviews');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/targetId/i);
  });

  it('returns reviews accessible without authentication (public endpoint)', async () => {
    const res = await request(app)
      .get(`/api/reviews?targetId=${TARGET_ID}`);

    // Public read – no auth required
    expect(res.status).toBe(200);
  });
});
