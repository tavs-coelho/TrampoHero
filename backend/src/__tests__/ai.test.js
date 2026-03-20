import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../config/env.js', () => ({
  env: {
    JWT_SECRET: 'test_jwt_secret',
    GEMINI_API_KEY: 'test_gemini_key',
    NODE_ENV: 'test',
  },
}));

import aiRouter from '../routes/ai.js';

const app = express();
app.use(express.json());
app.use('/api/ai', aiRouter);

function makeToken(payload = {}) {
  return jwt.sign(
    { id: 'user-id-123', role: 'freelancer', ...payload },
    'test_jwt_secret',
    { expiresIn: '1h' }
  );
}

describe('POST /api/ai/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns 401 without authentication', async () => {
    const res = await request(app).post('/api/ai/generate').send({ prompt: 'hello' });
    expect(res.status).toBe(401);
  });

  it('returns 200 for authenticated request', async () => {
    const token = makeToken();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        candidates: [{ content: { parts: [{ text: 'ok' }] } }],
      }),
    }));

    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ prompt: 'hello' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.text).toBe('ok');
  });
});
