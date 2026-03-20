/**
 * Unit tests for the 4 new job-flow endpoints:
 *  - GET  /api/jobs/:id/applicants
 *  - POST /api/jobs/:id/select-candidate
 *  - POST /api/jobs/:id/checkout
 *  - POST /api/jobs/:id/submit-proof
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
  },
}));

// ─── Mock pdfService and referral (required by jobs route) ────────────────────
vi.mock('../services/pdfService.js', () => ({ generateJobContract: vi.fn() }));
vi.mock('../routes/referral.js', () => ({ REFERRAL_BONUS: 10 }));

// ─── Mock Azure SDKs (required by jobs route imports) ────────────────────────
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

// ─── Mock Job model ───────────────────────────────────────────────────────────
const mockJob = {
  _id: '507f1f77bcf86cd799439011',
  employerId: { toString: () => 'employer-id' },
  status: 'open',
  applicants: [
    { userId: { toString: () => 'freelancer-id' }, status: 'pending', appliedAt: new Date() },
    { userId: { toString: () => 'other-freelancer-id' }, status: 'pending', appliedAt: new Date() },
  ],
  checkInTime: '2024-01-01T08:00:00.000Z',
  checkOutTime: null,
  proofPhoto: null,
  checkin: null,
  save: vi.fn().mockResolvedValue(true),
};

vi.mock('../models/Job.js', () => ({
  default: {
    findById: vi.fn(),
  },
}));

// ─── Mock User model ──────────────────────────────────────────────────────────
vi.mock('../models/User.js', () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    find: vi.fn(),
  },
}));

// ─── Import routes after mocks ────────────────────────────────────────────────
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import Job from '../models/Job.js';
import User from '../models/User.js';
import jobsRouter from '../routes/jobs.js';

process.env.JWT_SECRET = 'test_jwt_secret';

const app = express();
app.use(express.json());
app.use('/api/jobs', jobsRouter);

function makeToken(payload = {}) {
  return jwt.sign(
    { id: 'freelancer-id', role: 'freelancer', ...payload },
    'test_jwt_secret',
    { expiresIn: '1h' }
  );
}

// ─── GET /api/jobs/:id/applicants ─────────────────────────────────────────────

describe('GET /api/jobs/:id/applicants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJob.status = 'open';
    mockJob.applicants = [
      { userId: { toString: () => 'freelancer-id' }, status: 'pending', appliedAt: new Date() },
      { userId: { toString: () => 'other-freelancer-id' }, status: 'pending', appliedAt: new Date() },
    ];
    Job.findById.mockResolvedValue(mockJob);
    User.find.mockResolvedValue([
      { _id: { toString: () => 'freelancer-id' }, name: 'João Paulo', rating: 4.8, niche: 'Restaurante' },
      { _id: { toString: () => 'other-freelancer-id' }, name: 'Maria A.', rating: 5.0, niche: 'Bar' },
    ]);
  });

  it('returns applicants with user info for the employer', async () => {
    const token = makeToken({ id: 'employer-id', role: 'employer' });
    const res = await request(app)
      .get('/api/jobs/507f1f77bcf86cd799439011/applicants')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toMatchObject({ name: 'João Paulo', rating: 4.8 });
  });

  it('returns 403 when employer is not the job owner', async () => {
    const token = makeToken({ id: 'different-employer', role: 'employer' });
    const res = await request(app)
      .get('/api/jobs/507f1f77bcf86cd799439011/applicants')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('returns 403 when a freelancer tries to access applicants', async () => {
    const token = makeToken({ id: 'freelancer-id', role: 'freelancer' });
    const res = await request(app)
      .get('/api/jobs/507f1f77bcf86cd799439011/applicants')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 when job not found', async () => {
    Job.findById.mockResolvedValue(null);
    const token = makeToken({ id: 'employer-id', role: 'employer' });
    const res = await request(app)
      .get('/api/jobs/507f1f77bcf86cd799439011/applicants')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .get('/api/jobs/507f1f77bcf86cd799439011/applicants');

    expect(res.status).toBe(401);
  });
});

// ─── POST /api/jobs/:id/select-candidate ─────────────────────────────────────

// MongoId-formatted IDs required by body('candidateId').optional().isMongoId()
const CANDIDATE_ID = '507f191e810c19729de860ea';
const OTHER_CANDIDATE_ID = '507f191e810c19729de860eb';
const UNKNOWN_CANDIDATE_ID = '507f191e810c19729de860ec';

describe('POST /api/jobs/:id/select-candidate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJob.status = 'open';
    mockJob.save.mockResolvedValue(true);
    mockJob.applicants = [
      { userId: { toString: () => CANDIDATE_ID }, status: 'pending', appliedAt: new Date() },
      { userId: { toString: () => OTHER_CANDIDATE_ID }, status: 'pending', appliedAt: new Date() },
    ];
    Job.findById.mockResolvedValue(mockJob);
  });

  it('approves selected candidate and rejects others', async () => {
    const token = makeToken({ id: 'employer-id', role: 'employer' });
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/select-candidate')
      .set('Authorization', `Bearer ${token}`)
      .send({ candidateId: CANDIDATE_ID });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockJob.save).toHaveBeenCalled();
    const approved = mockJob.applicants.find(a => a.userId.toString() === CANDIDATE_ID);
    const rejected = mockJob.applicants.find(a => a.userId.toString() === OTHER_CANDIDATE_ID);
    expect(approved.status).toBe('approved');
    expect(rejected.status).toBe('rejected');
    expect(mockJob.status).toBe('applied');
  });

  it('returns 400 when candidateId is missing', async () => {
    const token = makeToken({ id: 'employer-id', role: 'employer' });
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/select-candidate')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 404 when candidate is not in applicants list', async () => {
    const token = makeToken({ id: 'employer-id', role: 'employer' });
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/select-candidate')
      .set('Authorization', `Bearer ${token}`)
      .send({ candidateId: UNKNOWN_CANDIDATE_ID });

    expect(res.status).toBe(404);
  });

  it('returns 403 when employer does not own the job', async () => {
    const token = makeToken({ id: 'different-employer', role: 'employer' });
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/select-candidate')
      .set('Authorization', `Bearer ${token}`)
      .send({ candidateId: CANDIDATE_ID });

    expect(res.status).toBe(403);
  });

  it('returns 400 when job is already completed', async () => {
    mockJob.status = 'completed';
    const token = makeToken({ id: 'employer-id', role: 'employer' });
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/select-candidate')
      .set('Authorization', `Bearer ${token}`)
      .send({ candidateId: CANDIDATE_ID });

    expect(res.status).toBe(400);
  });

  it('returns 404 when job not found', async () => {
    Job.findById.mockResolvedValue(null);
    const token = makeToken({ id: 'employer-id', role: 'employer' });
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/select-candidate')
      .set('Authorization', `Bearer ${token}`)
      .send({ candidateId: CANDIDATE_ID });

    expect(res.status).toBe(404);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/select-candidate')
      .send({ candidateId: CANDIDATE_ID });

    expect(res.status).toBe(401);
  });
});

// ─── POST /api/jobs/:id/checkout ──────────────────────────────────────────────

describe('POST /api/jobs/:id/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJob.status = 'ongoing';
    mockJob.checkOutTime = null;
    mockJob.save.mockResolvedValue(true);
    mockJob.applicants = [
      { userId: { toString: () => 'freelancer-id' }, status: 'approved', appliedAt: new Date() },
    ];
    Job.findById.mockResolvedValue(mockJob);
  });

  it('records checkout time and transitions job to waiting_approval', async () => {
    const token = makeToken({ id: 'freelancer-id' });
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/checkout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockJob.save).toHaveBeenCalled();
    expect(mockJob.status).toBe('waiting_approval');
    expect(mockJob.checkOutTime).toBeTruthy();
  });

  it('returns 403 when user is not the approved freelancer', async () => {
    const token = makeToken({ id: 'another-user' });
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/checkout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('returns 400 when job is not ongoing', async () => {
    mockJob.status = 'applied';
    const token = makeToken({ id: 'freelancer-id' });
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/checkout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('returns 404 when job not found', async () => {
    Job.findById.mockResolvedValue(null);
    const token = makeToken({ id: 'freelancer-id' });
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/checkout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/checkout');

    expect(res.status).toBe(401);
  });
});

// ─── POST /api/jobs/:id/submit-proof ─────────────────────────────────────────

describe('POST /api/jobs/:id/submit-proof', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJob.status = 'ongoing';
    mockJob.proofPhoto = null;
    mockJob.save.mockResolvedValue(true);
    mockJob.applicants = [
      { userId: { toString: () => 'freelancer-id' }, status: 'approved', appliedAt: new Date() },
    ];
    Job.findById.mockResolvedValue(mockJob);
  });

  it('records proof photo URL on the job', async () => {
    const token = makeToken({ id: 'freelancer-id' });
    const photoUrl = 'https://storage.example.com/uploads/proof.jpg';
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/submit-proof')
      .set('Authorization', `Bearer ${token}`)
      .send({ photoUrl });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockJob.save).toHaveBeenCalled();
    expect(mockJob.proofPhoto).toBe(photoUrl);
  });

  it('also accepts proof when job is in waiting_approval status', async () => {
    mockJob.status = 'waiting_approval';
    const token = makeToken({ id: 'freelancer-id' });
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/submit-proof')
      .set('Authorization', `Bearer ${token}`)
      .send({ photoUrl: 'https://storage.example.com/proof.jpg' });

    expect(res.status).toBe(200);
  });

  it('returns 400 when photoUrl is missing', async () => {
    const token = makeToken({ id: 'freelancer-id' });
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/submit-proof')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 403 when user is not the approved freelancer', async () => {
    const token = makeToken({ id: 'another-user' });
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/submit-proof')
      .set('Authorization', `Bearer ${token}`)
      .send({ photoUrl: 'https://storage.example.com/proof.jpg' });

    expect(res.status).toBe(403);
  });

  it('returns 400 when job is in an invalid status', async () => {
    mockJob.status = 'open';
    const token = makeToken({ id: 'freelancer-id' });
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/submit-proof')
      .set('Authorization', `Bearer ${token}`)
      .send({ photoUrl: 'https://storage.example.com/proof.jpg' });

    expect(res.status).toBe(400);
  });

  it('returns 404 when job not found', async () => {
    Job.findById.mockResolvedValue(null);
    const token = makeToken({ id: 'freelancer-id' });
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/submit-proof')
      .set('Authorization', `Bearer ${token}`)
      .send({ photoUrl: 'https://storage.example.com/proof.jpg' });

    expect(res.status).toBe(404);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/submit-proof')
      .send({ photoUrl: 'https://storage.example.com/proof.jpg' });

    expect(res.status).toBe(401);
  });
});
