/**
 * Tests for new production architecture models and routes:
 *  - GET  /api/contracts
 *  - GET  /api/contracts/:id
 *  - POST /api/contracts/:id/void
 *  - POST /api/support
 *  - GET  /api/support
 *  - GET  /api/support/:id
 *  - POST /api/support/:id/reply
 *  - PUT  /api/support/:id/status
 *  - GET  /api/admin/actions
 *  - PUT  /api/admin/users/:id/ban
 *  - PUT  /api/admin/users/:id/unban
 *  - DELETE /api/admin/jobs/:id
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

// ─── Mock models ──────────────────────────────────────────────────────────────
const mockContract = {
  _id: '507f1f77bcf86cd799439011',
  jobId: { _id: '507f1f77bcf86cd799439012', toString: () => '507f1f77bcf86cd799439012', title: 'Chef de Cozinha', date: '2024-01-15', payment: 250 },
  freelancerId: { _id: '507f1f77bcf86cd799439020', toString: () => 'freelancer-id', name: 'Ana', email: 'ana@test.com' },
  employerId: { _id: '507f1f77bcf86cd799439030', toString: () => 'employer-id', name: 'Restaurante X', email: 'x@test.com' },
  status: 'generated',
  validationHash: 'abc123',
  save: vi.fn().mockResolvedValue(true),
};

vi.mock('../models/Contract.js', () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn(),
  },
}));

const mockTicket = {
  _id: '507f1f77bcf86cd799439040',
  userId: { _id: '507f1f77bcf86cd799439050', toString: () => 'user-id' },
  subject: 'Pagamento não recebido',
  status: 'open',
  messages: [],
  save: vi.fn().mockResolvedValue(true),
};

vi.mock('../models/SupportTicket.js', () => ({
  default: {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
  },
}));

const mockUser = {
  _id: '507f1f77bcf86cd799439050',
  name: 'Test User',
  role: 'freelancer',
  isBanned: false,
  bannedAt: null,
  banReason: null,
  save: vi.fn().mockResolvedValue(true),
};

vi.mock('../models/User.js', () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

const mockJob = {
  _id: '507f1f77bcf86cd799439012',
  deleteOne: vi.fn().mockResolvedValue(true),
};

vi.mock('../models/Job.js', () => ({
  default: {
    findById: vi.fn(),
  },
}));

const mockReview = {
  _id: '507f1f77bcf86cd799439060',
  deleteOne: vi.fn().mockResolvedValue(true),
};

vi.mock('../models/Review.js', () => ({
  default: {
    findById: vi.fn(),
  },
}));

vi.mock('../models/AdminAction.js', () => ({
  default: {
    create: vi.fn().mockResolvedValue({}),
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

// ─── Import after mocks ───────────────────────────────────────────────────────
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import Contract from '../models/Contract.js';
import SupportTicket from '../models/SupportTicket.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Review from '../models/Review.js';
import AdminAction from '../models/AdminAction.js';
import contractsRouter from '../routes/contracts.js';
import supportRouter from '../routes/support.js';
import adminRouter from '../routes/admin.js';

process.env.JWT_SECRET = 'test_jwt_secret';

const app = express();
app.use(express.json());
app.use('/api/contracts', contractsRouter);
app.use('/api/support', supportRouter);
app.use('/api/admin', adminRouter);

function makeToken(payload = {}) {
  return jwt.sign({ id: 'user-id', role: 'freelancer', ...payload }, 'test_jwt_secret', { expiresIn: '1h' });
}
function makeAdminToken(payload = {}) {
  return jwt.sign({ id: 'admin-id', role: 'admin', ...payload }, 'test_jwt_secret', { expiresIn: '1h' });
}

// ─── Contracts ────────────────────────────────────────────────────────────────

describe('GET /api/contracts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns contracts for authenticated freelancer', async () => {
    const mockFind = { populate: vi.fn().mockReturnThis(), sort: vi.fn().mockResolvedValue([mockContract]) };
    Contract.find.mockReturnValue(mockFind);

    const token = makeToken({ id: 'freelancer-id', role: 'freelancer' });
    const res = await request(app).get('/api/contracts').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/contracts');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/contracts/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns contract for a party member', async () => {
    const populatedContract = {
      ...mockContract,
      freelancerId: { _id: { toString: () => 'freelancer-id' }, name: 'Ana', email: 'ana@test.com' },
      employerId: { _id: { toString: () => 'employer-id' }, name: 'Restaurante X', email: 'x@test.com' },
    };
    const chainable = {
      populate: vi.fn().mockReturnThis(),
    };
    // Last populate call resolves with the populated contract
    chainable.populate
      .mockReturnValueOnce(chainable)
      .mockReturnValueOnce(chainable)
      .mockResolvedValueOnce(populatedContract);
    Contract.findById.mockReturnValue(chainable);

    const token = makeToken({ id: 'freelancer-id', role: 'freelancer' });
    const res = await request(app)
      .get('/api/contracts/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 when contract not found', async () => {
    const chainable = {
      populate: vi.fn().mockReturnThis(),
    };
    chainable.populate
      .mockReturnValueOnce(chainable)
      .mockReturnValueOnce(chainable)
      .mockResolvedValueOnce(null);
    Contract.findById.mockReturnValue(chainable);

    const token = makeToken({ id: 'freelancer-id' });
    const res = await request(app)
      .get('/api/contracts/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not a party', async () => {
    const populatedContract = {
      ...mockContract,
      freelancerId: { _id: { toString: () => 'another-user' }, name: 'Ana', email: 'ana@test.com' },
      employerId: { _id: { toString: () => 'another-employer' }, name: 'X', email: 'x@test.com' },
    };
    const chainable = {
      populate: vi.fn().mockReturnThis(),
    };
    chainable.populate
      .mockReturnValueOnce(chainable)
      .mockReturnValueOnce(chainable)
      .mockResolvedValueOnce(populatedContract);
    Contract.findById.mockReturnValue(chainable);

    const token = makeToken({ id: 'random-user-id', role: 'freelancer' });
    const res = await request(app)
      .get('/api/contracts/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

describe('POST /api/contracts/:id/void', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContract.status = 'generated';
    mockContract.save.mockResolvedValue(true);
    Contract.findById.mockReturnValue({
      populate: vi.fn().mockResolvedValue(mockContract),
    });
    Contract.findById.mockResolvedValue(mockContract);
  });

  it('voids a contract as admin', async () => {
    const token = makeAdminToken();
    const res = await request(app)
      .post('/api/contracts/507f1f77bcf86cd799439011/void')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Fraud detected' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockContract.status).toBe('voided');
    expect(AdminAction.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'contract_void' }));
  });

  it('returns 403 for non-admin', async () => {
    const token = makeToken({ role: 'employer' });
    const res = await request(app)
      .post('/api/contracts/507f1f77bcf86cd799439011/void')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

// ─── Support Tickets ──────────────────────────────────────────────────────────

describe('POST /api/support', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a support ticket', async () => {
    SupportTicket.create.mockResolvedValue({ ...mockTicket, _id: 'new-ticket-id' });
    const token = makeToken();
    const res = await request(app)
      .post('/api/support')
      .set('Authorization', `Bearer ${token}`)
      .send({ subject: 'Problema com pagamento', description: 'Não recebi meu pagamento', category: 'payment' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(SupportTicket.create).toHaveBeenCalled();
  });

  it('returns 400 when subject is missing', async () => {
    const token = makeToken();
    const res = await request(app)
      .post('/api/support')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Desc', category: 'payment' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 400 when category is invalid', async () => {
    const token = makeToken();
    const res = await request(app)
      .post('/api/support')
      .set('Authorization', `Bearer ${token}`)
      .send({ subject: 'Test', description: 'Desc', category: 'invalid_cat' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/support')
      .send({ subject: 'Test', description: 'Desc', category: 'payment' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/support', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns tickets for authenticated user', async () => {
    const mockFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockTicket]),
    };
    SupportTicket.find.mockReturnValue(mockFind);

    const token = makeToken();
    const res = await request(app).get('/api/support').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/support');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/support/:id/reply', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTicket.status = 'open';
    mockTicket.messages = [];
    mockTicket.userId = { _id: 'user-id', toString: () => 'user-id' };
    mockTicket.save.mockResolvedValue(true);
    SupportTicket.findById.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
    });
    SupportTicket.findById.mockResolvedValue(mockTicket);
  });

  it('adds a reply to a ticket', async () => {
    const token = makeToken();
    const res = await request(app)
      .post('/api/support/507f1f77bcf86cd799439040/reply')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Ainda aguardando resolução' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockTicket.messages).toHaveLength(1);
  });

  it('returns 400 when message is missing', async () => {
    const token = makeToken();
    const res = await request(app)
      .post('/api/support/507f1f77bcf86cd799439040/reply')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 400 when ticket is resolved', async () => {
    mockTicket.status = 'resolved';
    const token = makeToken();
    const res = await request(app)
      .post('/api/support/507f1f77bcf86cd799439040/reply')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Ainda aguardando resolução' });

    expect(res.status).toBe(400);
  });

  it('returns 403 when user is not the ticket owner', async () => {
    mockTicket.userId = { _id: 'another-user', toString: () => 'another-user' };
    const token = makeToken({ id: 'different-user', role: 'freelancer' });
    const res = await request(app)
      .post('/api/support/507f1f77bcf86cd799439040/reply')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Mensagem indevida' });

    expect(res.status).toBe(403);
  });
});

// ─── Admin routes ─────────────────────────────────────────────────────────────

describe('GET /api/admin/actions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns audit log for admin', async () => {
    const mockFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };
    AdminAction.find.mockReturnValue(mockFind);
    AdminAction.countDocuments.mockResolvedValue(0);

    const token = makeAdminToken();
    const res = await request(app).get('/api/admin/actions').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 403 for non-admin', async () => {
    const token = makeToken({ role: 'employer' });
    const res = await request(app).get('/api/admin/actions').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/admin/actions');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/admin/users/:id/ban', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.isBanned = false;
    mockUser.role = 'freelancer';
    mockUser.save.mockResolvedValue(true);
    User.findById.mockResolvedValue(mockUser);
  });

  it('bans a user', async () => {
    const token = makeAdminToken();
    const res = await request(app)
      .put('/api/admin/users/507f1f77bcf86cd799439050/ban')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Fraude' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockUser.isBanned).toBe(true);
    expect(AdminAction.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'user_ban' }));
  });

  it('returns 400 when trying to ban an admin', async () => {
    mockUser.role = 'admin';
    const token = makeAdminToken();
    const res = await request(app)
      .put('/api/admin/users/507f1f77bcf86cd799439050/ban')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('returns 404 when user not found', async () => {
    User.findById.mockResolvedValue(null);
    const token = makeAdminToken();
    const res = await request(app)
      .put('/api/admin/users/507f1f77bcf86cd799439050/ban')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 403 for non-admin', async () => {
    const token = makeToken({ role: 'employer' });
    const res = await request(app)
      .put('/api/admin/users/507f1f77bcf86cd799439050/ban')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/admin/users/:id/unban', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.isBanned = true;
    mockUser.save.mockResolvedValue(true);
    User.findById.mockResolvedValue(mockUser);
  });

  it('unbans a user', async () => {
    const token = makeAdminToken();
    const res = await request(app)
      .put('/api/admin/users/507f1f77bcf86cd799439050/unban')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockUser.isBanned).toBe(false);
    expect(AdminAction.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'user_unban' }));
  });
});

describe('DELETE /api/admin/jobs/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJob.deleteOne.mockResolvedValue(true);
    Job.findById.mockResolvedValue(mockJob);
  });

  it('removes a job as admin', async () => {
    const token = makeAdminToken();
    const res = await request(app)
      .delete('/api/admin/jobs/507f1f77bcf86cd799439012')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Vaga fraudulenta' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockJob.deleteOne).toHaveBeenCalled();
    expect(AdminAction.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'job_remove' }));
  });

  it('returns 404 when job not found', async () => {
    Job.findById.mockResolvedValue(null);
    const token = makeAdminToken();
    const res = await request(app)
      .delete('/api/admin/jobs/507f1f77bcf86cd799439012')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 403 for non-admin', async () => {
    const token = makeToken({ role: 'employer' });
    const res = await request(app)
      .delete('/api/admin/jobs/507f1f77bcf86cd799439012')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
