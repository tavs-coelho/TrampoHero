/**
 * Unit tests for the auth routes:
 *  - POST /api/auth/register
 *  - POST /api/auth/login
 *  - POST /api/auth/refresh
 *  - POST /api/auth/verify-email
 *  - POST /api/auth/resend-verification
 *  - POST /api/auth/forgot-password
 *  - POST /api/auth/reset-password
 *
 * All DB models and email service are mocked – no real network or DB needed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

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
  },
}));

// ─── Mock email service ────────────────────────────────────────────────────────
vi.mock('../services/emailService.js', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock User model ─────────────────────────────────────────────────────────
const mockSave = vi.fn().mockResolvedValue(true);

const buildUser = (overrides = {}) => ({
  _id: 'user-id-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'freelancer',
  isEmailVerified: false,
  emailVerificationToken: undefined,
  emailVerificationExpiry: undefined,
  resetPasswordToken: undefined,
  resetPasswordExpiry: undefined,
  password: '$2a$10$hashedpassword',
  comparePassword: vi.fn().mockResolvedValue(true),
  save: mockSave,
  ...overrides,
});

let mockUserDoc = buildUser();

vi.mock('../models/User.js', () => ({
  default: {
    findOne: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  },
}));

// Helper to make findOne return a document that supports .select() chaining
function mockFindOne(doc) {
  const query = { select: vi.fn().mockResolvedValue(doc) };
  // also allow awaiting the query directly (without .select)
  query.then = (res, rej) => Promise.resolve(doc).then(res, rej);
  User.findOne.mockReturnValue(query);
}

function mockFindOneDirect(doc) {
  User.findOne.mockResolvedValue(doc);
}

// ─── Import after mocks ───────────────────────────────────────────────────────
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import authRouter from '../routes/auth.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

function makeAccessToken(payload = {}) {
  return jwt.sign({ id: 'user-id-123', role: 'freelancer', ...payload }, 'test_jwt_secret', { expiresIn: '1h' });
}

function makeRefreshToken(payload = {}) {
  return jwt.sign({ id: 'user-id-123', role: 'freelancer', type: 'refresh', ...payload }, 'test_jwt_refresh_secret', { expiresIn: '30d' });
}

// ─── Register ─────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserDoc = buildUser();
    mockFindOneDirect(null); // no existing user
    User.create.mockResolvedValue(mockUserDoc);
  });

  it('registers a new user and returns token + refreshToken', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'new@example.com',
      password: 'SecurePass1',
      name: 'New User',
      role: 'freelancer',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe(mockUserDoc.email);
    expect(res.body.user.isEmailVerified).toBe(false);
  });

  it('sends a verification email on registration', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'new@example.com',
      password: 'SecurePass1',
      name: 'New User',
      role: 'freelancer',
    });

    expect(sendVerificationEmail).toHaveBeenCalledWith(mockUserDoc.email, expect.any(String));
  });

  it('returns 400 when user already exists', async () => {
    mockFindOneDirect(mockUserDoc);
    const res = await request(app).post('/api/auth/register').send({
      email: 'existing@example.com',
      password: 'SecurePass1',
      name: 'Dup User',
      role: 'employer',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it('rejects password shorter than 8 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'x@example.com',
      password: 'Short1',
      name: 'X',
      role: 'freelancer',
    });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('rejects password without uppercase letter', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'x@example.com',
      password: 'nouppercase1',
      name: 'X',
      role: 'freelancer',
    });
    expect(res.status).toBe(400);
  });

  it('rejects password without a number', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'x@example.com',
      password: 'NoNumberPass',
      name: 'X',
      role: 'freelancer',
    });
    expect(res.status).toBe(400);
  });

  it('rejects invalid role', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'x@example.com',
      password: 'SecurePass1',
      name: 'X',
      role: 'admin',
    });
    expect(res.status).toBe(400);
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserDoc = buildUser();
    mockFindOne(mockUserDoc); // supports .select('+password')
  });

  it('logs in and returns token + refreshToken', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'SecurePass1',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.isEmailVerified).toBe(false);
  });

  it('returns 401 for unknown email', async () => {
    mockFindOne(null);
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'SecurePass1',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 401 for wrong password', async () => {
    const wrongPwUser = buildUser({ comparePassword: vi.fn().mockResolvedValue(false) });
    mockFindOne(wrongPwUser);
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'WrongPass1',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'not-an-email',
      password: 'SecurePass1',
    });
    expect(res.status).toBe(400);
  });
});

// ─── Refresh token ────────────────────────────────────────────────────────────
describe('POST /api/auth/refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserDoc = buildUser();
    User.findById.mockResolvedValue(mockUserDoc);
  });

  it('issues a new access token given a valid refresh token', async () => {
    const refreshToken = makeRefreshToken();
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('returns 400 when refreshToken is missing', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 for an invalid refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'bad.token.here' });
    expect(res.status).toBe(401);
  });

  it('returns 401 when access token is passed instead of refresh token', async () => {
    // Access tokens are signed with JWT_SECRET; refresh endpoint uses JWT_REFRESH_SECRET,
    // so verification will fail with "Invalid or expired refresh token"
    const accessToken = makeAccessToken();
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: accessToken });
    expect(res.status).toBe(401);
  });

  it('returns 401 when user no longer exists', async () => {
    User.findById.mockResolvedValue(null);
    const refreshToken = makeRefreshToken();
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(401);
  });
});

// ─── Verify email ─────────────────────────────────────────────────────────────
describe('POST /api/auth/verify-email', () => {
  const rawToken = 'abc123rawtoken';
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserDoc = buildUser({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: new Date(Date.now() + 3600 * 1000),
    });
    mockFindOne(mockUserDoc); // supports .select() chaining used in the route
  });

  it('verifies a valid token', async () => {
    const res = await request(app).post('/api/auth/verify-email').send({ token: rawToken });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockUserDoc.isEmailVerified).toBe(true);
    expect(mockSave).toHaveBeenCalled();
  });

  it('returns 400 for invalid / expired token', async () => {
    mockFindOne(null);
    const res = await request(app).post('/api/auth/verify-email').send({ token: 'badtoken' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when token field is missing', async () => {
    const res = await request(app).post('/api/auth/verify-email').send({});
    expect(res.status).toBe(400);
  });
});

// ─── Resend verification ──────────────────────────────────────────────────────
describe('POST /api/auth/resend-verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserDoc = buildUser();
    User.findById.mockResolvedValue(mockUserDoc);
  });

  it('resends the verification email', async () => {
    const token = makeAccessToken();
    const res = await request(app)
      .post('/api/auth/resend-verification')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(sendVerificationEmail).toHaveBeenCalled();
  });

  it('returns 400 when email is already verified', async () => {
    mockUserDoc.isEmailVerified = true;
    const token = makeAccessToken();
    const res = await request(app)
      .post('/api/auth/resend-verification')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already verified/i);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/auth/resend-verification');
    expect(res.status).toBe(401);
  });
});

// ─── Forgot password ──────────────────────────────────────────────────────────
describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserDoc = buildUser();
    mockFindOneDirect(mockUserDoc);
  });

  it('returns 200 for a known email and sends reset email', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'test@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    await new Promise((r) => setTimeout(r, 50));
    expect(sendPasswordResetEmail).toHaveBeenCalled();
  });

  it('returns 200 for an unknown email (anti-enumeration)', async () => {
    mockFindOneDirect(null);
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    await new Promise((r) => setTimeout(r, 50));
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'not-email' });
    expect(res.status).toBe(400);
  });
});

// ─── Reset password ───────────────────────────────────────────────────────────
describe('POST /api/auth/reset-password', () => {
  const rawToken = 'resettoken123';
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserDoc = buildUser({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: new Date(Date.now() + 3600 * 1000),
    });
    mockFindOne(mockUserDoc); // supports .select() chaining used in the route
  });

  it('resets password for a valid token', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({
      token: rawToken,
      password: 'NewSecurePass1',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockSave).toHaveBeenCalled();
  });

  it('returns 400 for invalid / expired token', async () => {
    mockFindOne(null);
    const res = await request(app).post('/api/auth/reset-password').send({
      token: 'badtoken',
      password: 'NewSecurePass1',
    });
    expect(res.status).toBe(400);
  });

  it('rejects weak new password', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({
      token: rawToken,
      password: 'weak',
    });
    expect(res.status).toBe(400);
  });
});
