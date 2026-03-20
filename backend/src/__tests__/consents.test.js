import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import consentsRouter from '../routes/consents.js';
import Consent from '../models/Consent.js';

vi.mock('../middleware/auth.js', () => ({
  authenticate: (req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = { id: 'user-1', role: 'user' };
    next();
  },
}));

vi.mock('../models/Consent.js', () => ({
  default: {
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOne: vi.fn(),
  },
}));

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/consents', consentsRouter);
  return app;
}

describe('GET /api/consents', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires authentication', async () => {
    const res = await request(buildApp()).get('/api/consents');
    expect(res.status).toBe(401);
  });

  it('returns consent records for the caller', async () => {
    Consent.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ id: 'consent-1' }]),
    });

    const res = await request(buildApp())
      .get('/api/consents')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(Consent.find).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(res.body.data).toHaveLength(1);
  });
});

describe('POST /api/consents', () => {
  beforeEach(() => vi.clearAllMocks());

  it('records revocation timestamps when consent is denied', async () => {
    Consent.findOneAndUpdate.mockResolvedValue({ id: 'consent-1', revokedAt: '2024-01-01' });

    const res = await request(buildApp())
      .post('/api/consents')
      .set('Authorization', 'Bearer token')
      .send({ purpose: 'marketing', granted: false, policyVersion: 'v1' });

    expect(res.status).toBe(201);
    expect(Consent.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'user-1', purpose: 'marketing', policyVersion: 'v1' },
      {
        $set: expect.objectContaining({
          granted: false,
          revokedAt: expect.any(Date),
        }),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  });

  it('clears revokedAt when consent is granted', async () => {
    Consent.findOneAndUpdate.mockResolvedValue({ id: 'consent-2', revokedAt: null });

    const res = await request(buildApp())
      .post('/api/consents')
      .set('Authorization', 'Bearer token')
      .send({ purpose: 'terms', granted: true });

    expect(res.status).toBe(201);
    expect(Consent.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'user-1', purpose: 'terms', policyVersion: null },
      {
        $set: expect.objectContaining({
          granted: true,
          revokedAt: null,
        }),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  });
});
