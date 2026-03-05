/**
 * Unit tests for the 4 new endpoints:
 *  - POST /api/jobs/upload-sas
 *  - POST /api/jobs/:id/checkin
 *  - GET  /api/jobs/:id/chat-token
 *  - POST /api/users/push-device
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

// ─── Mock Mongoose models ─────────────────────────────────────────────────────
const mockJob = {
  _id: '507f1f77bcf86cd799439011',
  employerId: { toString: () => 'employer-id' },
  status: 'applied',
  applicants: [
    { userId: { toString: () => 'freelancer-id' }, status: 'approved' },
  ],
  checkInTime: null,
  checkin: null,
  save: vi.fn().mockResolvedValue(true),
};

vi.mock('../models/Job.js', () => ({
  default: {
    findById: vi.fn(),
  },
}));

const mockUser = {
  _id: 'user-id',
  pushDevices: [],
  save: vi.fn().mockResolvedValue(true),
};

vi.mock('../models/User.js', () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

// Mock pdfService and referral used by jobs route
vi.mock('../services/pdfService.js', () => ({
  generateJobContract: vi.fn(),
}));

vi.mock('../routes/referral.js', () => ({
  REFERRAL_BONUS: 10,
}));

// Mock Azure Storage Blob
vi.mock('@azure/storage-blob', () => ({
  BlobServiceClient: vi.fn(),
  generateBlobSASQueryParameters: vi.fn(() => ({ toString: () => 'sas=mock' })),
  BlobSASPermissions: { parse: vi.fn() },
  StorageSharedKeyCredential: vi.fn(),
}));

// Mock Azure Web PubSub
vi.mock('@azure/web-pubsub', () => ({
  WebPubSubServiceClient: vi.fn(() => ({
    getClientAccessToken: vi.fn().mockResolvedValue({ url: 'wss://mock.webpubsub.azure.com/chat?token=xyz' }),
  })),
}));

// ─── Import routes after mocks ────────────────────────────────────────────────
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import Job from '../models/Job.js';
import User from '../models/User.js';
import jobsRouter from '../routes/jobs.js';
import usersRouter from '../routes/users.js';

// Set JWT_SECRET in process.env so auth middleware can verify tokens
process.env.JWT_SECRET = 'test_jwt_secret';

// ─── Test App setup ───────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/api/jobs', jobsRouter);
app.use('/api/users', usersRouter);

// Helper: create a valid JWT for a test user
function makeToken(payload = {}) {
  return jwt.sign(
    { id: 'freelancer-id', role: 'freelancer', ...payload },
    'test_jwt_secret',
    { expiresIn: '1h' }
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/jobs/upload-sas', () => {
  it('returns mock SAS response when Azure is not configured', async () => {
    const token = makeToken();
    const res = await request(app)
      .post('/api/jobs/upload-sas')
      .set('Authorization', `Bearer ${token}`)
      .send({ contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      sasUrl: expect.stringContaining('mock-storage.blob.core.windows.net'),
      blobName: expect.stringContaining('jobs/freelancer-id/'),
      containerUrl: expect.stringContaining('mock-storage.blob.core.windows.net'),
    });
  });

  it('defaults to image/jpeg when contentType is omitted', async () => {
    const token = makeToken();
    const res = await request(app)
      .post('/api/jobs/upload-sas')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.blobName).toMatch(/\.jpeg$/);
  });

  it('rejects invalid contentType', async () => {
    const token = makeToken();
    const res = await request(app)
      .post('/api/jobs/upload-sas')
      .set('Authorization', `Bearer ${token}`)
      .send({ contentType: 'application/pdf' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/jobs/upload-sas')
      .send({ contentType: 'image/jpeg' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/jobs/:id/checkin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJob.status = 'applied';
    mockJob.save.mockResolvedValue(true);
    Job.findById.mockResolvedValue(mockJob);
  });

  it('records a check-in and transitions job to ongoing', async () => {
    const token = makeToken({ id: 'freelancer-id' });
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/checkin')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: -23.5505, longitude: -46.6333, timestamp: '2024-01-01T08:00:00.000Z' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockJob.save).toHaveBeenCalled();
    expect(mockJob.status).toBe('ongoing');
    expect(mockJob.checkInTime).toBe('2024-01-01T08:00:00.000Z');
  });

  it('returns 404 when job not found', async () => {
    Job.findById.mockResolvedValue(null);
    const token = makeToken();
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/checkin')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: -23.55, longitude: -46.63, timestamp: '2024-01-01T08:00:00Z' });

    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not the approved freelancer', async () => {
    const token = makeToken({ id: 'another-user-id' });
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/checkin')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: -23.55, longitude: -46.63, timestamp: '2024-01-01T08:00:00Z' });

    expect(res.status).toBe(403);
  });

  it('returns 400 when job status does not allow check-in', async () => {
    mockJob.status = 'completed';
    const token = makeToken({ id: 'freelancer-id' });
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/checkin')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: -23.55, longitude: -46.63, timestamp: '2024-01-01T08:00:00Z' });

    expect(res.status).toBe(400);
  });

  it('validates latitude and longitude', async () => {
    const token = makeToken({ id: 'freelancer-id' });
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/checkin')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: 999, longitude: -46.63, timestamp: '2024-01-01T08:00:00Z' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('validates missing timestamp', async () => {
    const token = makeToken({ id: 'freelancer-id' });
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/checkin')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: -23.55, longitude: -46.63 });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/jobs/507f1f77bcf86cd799439011/checkin')
      .send({ latitude: -23.55, longitude: -46.63, timestamp: '2024-01-01T08:00:00Z' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/jobs/:id/chat-token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Job.findById.mockResolvedValue(mockJob);
  });

  it('returns a mock JWT URL when Azure Web PubSub is not configured', async () => {
    const token = makeToken({ id: 'freelancer-id' });
    const res = await request(app)
      .get('/api/jobs/507f1f77bcf86cd799439011/chat-token')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.url).toMatch(/^wss:\/\/mock-pubsub\.example\.com\/chat\?token=/);
  });

  it('returns 404 when job not found', async () => {
    Job.findById.mockResolvedValue(null);
    const token = makeToken({ id: 'freelancer-id' });
    const res = await request(app)
      .get('/api/jobs/507f1f77bcf86cd799439011/chat-token')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not employer or approved freelancer', async () => {
    const token = makeToken({ id: 'random-user-id' });
    const res = await request(app)
      .get('/api/jobs/507f1f77bcf86cd799439011/chat-token')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('allows the employer to get a chat token', async () => {
    const token = makeToken({ id: 'employer-id', role: 'employer' });
    const res = await request(app)
      .get('/api/jobs/507f1f77bcf86cd799439011/chat-token')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.url).toBeDefined();
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .get('/api/jobs/507f1f77bcf86cd799439011/chat-token');

    expect(res.status).toBe(401);
  });
});

describe('POST /api/users/push-device', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.pushDevices = [];
    mockUser.save.mockResolvedValue(true);
    User.findById.mockResolvedValue(mockUser);
  });

  it('registers a new device token', async () => {
    const token = makeToken({ id: 'user-id' });
    const res = await request(app)
      .post('/api/users/push-device')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceToken: 'device-abc123', platform: 'fcmv1', tags: ['role:freelancer'] });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      deviceToken: 'device-abc123',
      platform: 'fcmv1',
      tags: ['role:freelancer'],
    });
    expect(mockUser.save).toHaveBeenCalled();
    expect(mockUser.pushDevices).toHaveLength(1);
  });

  it('updates an existing device token instead of duplicating', async () => {
    mockUser.pushDevices = [
      { deviceToken: 'device-abc123', platform: 'fcmv1', tags: [], updatedAt: new Date() },
    ];
    const token = makeToken({ id: 'user-id' });
    const res = await request(app)
      .post('/api/users/push-device')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceToken: 'device-abc123', platform: 'apns', tags: ['role:employer'] });

    expect(res.status).toBe(201);
    expect(mockUser.pushDevices).toHaveLength(1);
    expect(mockUser.pushDevices[0].platform).toBe('apns');
  });

  it('rejects missing deviceToken', async () => {
    const token = makeToken({ id: 'user-id' });
    const res = await request(app)
      .post('/api/users/push-device')
      .set('Authorization', `Bearer ${token}`)
      .send({ platform: 'fcmv1' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('rejects invalid platform', async () => {
    const token = makeToken({ id: 'user-id' });
    const res = await request(app)
      .post('/api/users/push-device')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceToken: 'abc', platform: 'windows' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 404 when user not found', async () => {
    User.findById.mockResolvedValue(null);
    const token = makeToken({ id: 'user-id' });
    const res = await request(app)
      .post('/api/users/push-device')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceToken: 'device-abc123', platform: 'fcmv1' });

    expect(res.status).toBe(404);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/users/push-device')
      .send({ deviceToken: 'device-abc123', platform: 'fcmv1' });

    expect(res.status).toBe(401);
  });
});
