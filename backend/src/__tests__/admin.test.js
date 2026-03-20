/**
 * Unit tests for admin routes:
 *  - GET  /api/admin/stats
 *  - GET  /api/admin/users
 *  - GET  /api/admin/users/:id
 *  - PATCH /api/admin/users/:id
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
    findById: vi.fn(),
  },
}));

vi.mock('../models/AdminAction.js', () => ({
  default: {
    create: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../models/Review.js', () => ({
  default: {
    findById: vi.fn(),
  },
}));

vi.mock('../models/Transaction.js', () => ({
  default: {
    find: vi.fn(),
    aggregate: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../models/JobApplication.js', () => ({
  default: {
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../models/Contract.js', () => ({
  default: {
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../models/SupportTicket.js', () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

// ─── Import routes after mocks ────────────────────────────────────────────────
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Transaction from '../models/Transaction.js';
import SupportTicket from '../models/SupportTicket.js';
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

  it('returns 403 for freelancer role', async () => {
    const token = makeToken({ role: 'freelancer' });
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns 403 for employer role', async () => {
    const token = makeToken({ role: 'employer' });
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns 403 for employer on destructive DELETE /admin/jobs/:id', async () => {
    const token = makeToken({ role: 'employer' });
    const res = await request(app)
      .delete('/api/admin/jobs/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns 403 for employer on PATCH /admin/kyc/:userId', async () => {
    const token = makeToken({ role: 'employer' });
    const res = await request(app)
      .patch('/api/admin/kyc/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`)
      .send({ decision: 'approved' });
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
    SupportTicket.countDocuments.mockResolvedValueOnce(2); // open tickets
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
});

describe('GET /api/admin/users/:id', () => {
  it('returns user details for a valid id', async () => {
    User.findById.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(mockUsers[0]),
    });

    const token = makeToken();
    const res = await request(app)
      .get('/api/admin/users/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('name', 'João Silva');
  });

  it('returns 400 for an invalid user id format', async () => {
    const token = makeToken();
    const res = await request(app)
      .get('/api/admin/users/not-a-valid-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 404 when user does not exist', async () => {
    User.findById.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null),
    });

    const token = makeToken();
    const res = await request(app)
      .get('/api/admin/users/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('PATCH /api/admin/users/:id', () => {
  it('updates an allowed field and returns the updated user', async () => {
    const updatedUser = { ...mockUsers[0], tier: 'Pro' };
    User.findByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockResolvedValue(updatedUser),
    });

    const token = makeToken();
    const res = await request(app)
      .patch('/api/admin/users/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`)
      .send({ tier: 'Pro' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tier).toBe('Pro');
  });

  it('returns 400 for an invalid user id format', async () => {
    const token = makeToken();
    const res = await request(app)
      .patch('/api/admin/users/not-a-valid-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ tier: 'Pro' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for an invalid tier value', async () => {
    const token = makeToken();
    const res = await request(app)
      .patch('/api/admin/users/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`)
      .send({ tier: 'InvalidTier' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 404 when user does not exist', async () => {
    User.findByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    });

    const token = makeToken();
    const res = await request(app)
      .patch('/api/admin/users/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`)
      .send({ isPrime: true });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
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
    Job.findById.mockResolvedValue({ ...mockJobs[0], deleteOne: vi.fn().mockResolvedValue() });
    const token = makeToken();
    const res = await request(app)
      .delete('/api/admin/jobs/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 when job not found', async () => {
    Job.findById.mockResolvedValue(null);
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

// ─── New endpoint tests ───────────────────────────────────────────────────────

import JobApplication from '../models/JobApplication.js';
import Contract from '../models/Contract.js';
import AdminAction from '../models/AdminAction.js';

const mockApplications = [
  {
    _id: 'app1',
    jobId: { _id: 'job1', title: 'Garçom para Evento', niche: 'Eventos', payment: 200, status: 'open' },
    freelancerId: { _id: 'user1', name: 'João Silva', email: 'joao@test.com', rating: 4.5 },
    status: 'pending',
    coverMessage: 'Tenho experiência em eventos.',
    proposedRate: 180,
    createdAt: new Date().toISOString(),
  },
];

const mockContracts = [
  {
    _id: 'contract1',
    jobId: { _id: 'job1', title: 'Garçom para Evento', niche: 'Eventos' },
    freelancerId: { _id: 'user1', name: 'João Silva', email: 'joao@test.com' },
    employerId: { _id: 'user2', name: 'Empresa XYZ', email: 'xyz@test.com' },
    status: 'signed_both',
    value: 200,
    paymentType: 'job',
    jobDate: '2026-03-20',
    pdfUrl: 'https://example.com/contract.pdf',
    createdAt: new Date().toISOString(),
  },
];

const mockTransactions = [
  {
    _id: 'tx1',
    userId: { _id: 'user1', name: 'João Silva', email: 'joao@test.com', role: 'freelancer' },
    type: 'fee_charge',
    amount: -20,
    description: 'Platform fee',
    createdAt: new Date().toISOString(),
  },
];

const mockTicket = {
  _id: '507f1f77bcf86cd799439022',
  userId: { _id: 'user1', name: 'João Silva', email: 'joao@test.com', role: 'freelancer' },
  subject: 'Problema com pagamento',
  description: 'Não recebi meu pagamento.',
  category: 'payment',
  priority: 'high',
  status: 'open',
  assignedAdminId: null,
  messages: [],
  createdAt: new Date().toISOString(),
};

const mockAuditActions = [
  {
    _id: 'action1',
    adminId: { _id: 'admin-id', name: 'Admin', email: 'admin@test.com' },
    action: 'kyc_approve',
    targetType: 'User',
    targetId: 'user3',
    details: { decision: 'approved' },
    ipAddress: '127.0.0.1',
    createdAt: new Date().toISOString(),
  },
];

describe('PUT /api/admin/users/:id/ban and /unban', () => {
  it('bans a non-admin user successfully', async () => {
    const targetUser = { ...mockUsers[0], role: 'freelancer', isBanned: false, save: vi.fn().mockResolvedValue() };
    User.findById.mockResolvedValue(targetUser);

    const token = makeToken();
    const res = await request(app)
      .put('/api/admin/users/507f1f77bcf86cd799439011/ban')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Violação de termos' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(targetUser.isBanned).toBe(true);
    expect(targetUser.save).toHaveBeenCalled();
  });

  it('returns 400 when trying to ban an admin user', async () => {
    const adminUser = { ...mockUsers[0], role: 'admin', isBanned: false };
    User.findById.mockResolvedValue(adminUser);

    const token = makeToken();
    const res = await request(app)
      .put('/api/admin/users/507f1f77bcf86cd799439011/ban')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 404 when user not found for ban', async () => {
    User.findById.mockResolvedValue(null);

    const token = makeToken();
    const res = await request(app)
      .put('/api/admin/users/507f1f77bcf86cd799439011/ban')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('unbans a user successfully', async () => {
    const targetUser = { ...mockUsers[0], isBanned: true, banReason: 'test', bannedAt: new Date(), save: vi.fn().mockResolvedValue() };
    User.findById.mockResolvedValue(targetUser);

    const token = makeToken();
    const res = await request(app)
      .put('/api/admin/users/507f1f77bcf86cd799439011/unban')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(targetUser.isBanned).toBe(false);
  });
});

describe('GET /api/admin/applications', () => {
  beforeEach(() => {
    const findChain = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(mockApplications),
    };
    JobApplication.find.mockReturnValue(findChain);
    JobApplication.countDocuments.mockResolvedValue(1);
  });

  it('returns list of applications for admin', async () => {
    const token = makeToken();
    const res = await request(app)
      .get('/api/admin/applications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].status).toBe('pending');
    expect(res.body.pagination).toHaveProperty('total', 1);
  });

  it('returns 400 for invalid status filter', async () => {
    const token = makeToken();
    const res = await request(app)
      .get('/api/admin/applications?status=invalid_status')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

describe('GET /api/admin/contracts', () => {
  beforeEach(() => {
    const findChain = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(mockContracts),
    };
    Contract.find.mockReturnValue(findChain);
    Contract.countDocuments.mockResolvedValue(1);
  });

  it('returns list of contracts for admin', async () => {
    const token = makeToken();
    const res = await request(app)
      .get('/api/admin/contracts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].status).toBe('signed_both');
    expect(res.body.pagination).toHaveProperty('total', 1);
  });

  it('returns 400 for invalid status filter', async () => {
    const token = makeToken();
    const res = await request(app)
      .get('/api/admin/contracts?status=bad_status')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

describe('GET /api/admin/transactions', () => {
  beforeEach(() => {
    const findChain = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(mockTransactions),
    };
    Transaction.find.mockReturnValue(findChain);
    Transaction.countDocuments.mockResolvedValue(1);
  });

  it('returns list of transactions for admin', async () => {
    const token = makeToken();
    const res = await request(app)
      .get('/api/admin/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].type).toBe('fee_charge');
  });
});

describe('GET /api/admin/tickets', () => {
  beforeEach(() => {
    const findChain = {
      select: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([mockTicket]),
    };
    SupportTicket.find.mockReturnValue(findChain);
    SupportTicket.countDocuments.mockResolvedValue(1);
  });

  it('returns list of tickets for admin', async () => {
    const token = makeToken();
    const res = await request(app)
      .get('/api/admin/tickets')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].subject).toBe('Problema com pagamento');
  });

  it('returns 400 for invalid status filter', async () => {
    const token = makeToken();
    const res = await request(app)
      .get('/api/admin/tickets?status=bad_status')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('accepts manual_review as status filter', async () => {
    const token = makeToken();
    const res = await request(app)
      .get('/api/admin/tickets?status=manual_review')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/admin/tickets/:id', () => {
  it('returns a single ticket with full thread', async () => {
    SupportTicket.findById.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(mockTicket),
    });

    const token = makeToken();
    const res = await request(app)
      .get(`/api/admin/tickets/${mockTicket._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.subject).toBe('Problema com pagamento');
  });

  it('returns 404 when ticket not found', async () => {
    SupportTicket.findById.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null),
    });

    const token = makeToken();
    const res = await request(app)
      .get(`/api/admin/tickets/${mockTicket._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid ticket id', async () => {
    const token = makeToken();
    const res = await request(app)
      .get('/api/admin/tickets/not-an-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/admin/tickets/:id', () => {
  it('updates ticket status and logs correct action types', async () => {
    const updatedTicket = { ...mockTicket, status: 'resolved', resolvedAt: new Date() };
    // The route does: SupportTicket.findByIdAndUpdate(...).populate(...).populate(...)
    // so we need a chainable mock
    SupportTicket.findByIdAndUpdate.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue(updatedTicket),
      }),
    });

    const token = makeToken();
    const res = await request(app)
      .patch(`/api/admin/tickets/${mockTicket._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'resolved' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 when ticket not found', async () => {
    SupportTicket.findByIdAndUpdate.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      }),
    });

    const token = makeToken();
    const res = await request(app)
      .patch(`/api/admin/tickets/${mockTicket._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'closed' });

    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid status value', async () => {
    const token = makeToken();
    const res = await request(app)
      .patch(`/api/admin/tickets/${mockTicket._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'invalid_status' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/admin/tickets/:id/reply', () => {
  it('adds a reply and returns populated ticket', async () => {
    const ticketInstance = {
      ...mockTicket,
      messages: [],
      status: 'open',
      save: vi.fn().mockResolvedValue(),
      populate: vi.fn().mockResolvedValue({
        ...mockTicket,
        status: 'in_progress',
        messages: [{ _id: 'msg1', authorId: 'admin-id', authorRole: 'admin', message: 'Obrigado pelo contato.', createdAt: new Date().toISOString() }],
        userId: { _id: 'user1', name: 'João Silva', email: 'joao@test.com', role: 'freelancer' },
        assignedAdminId: null,
        push: vi.fn(),
      }),
      push: vi.fn(),
    };
    // patch messages.push
    ticketInstance.messages.push = vi.fn(function(item) { this.length++; return item; });
    SupportTicket.findById.mockResolvedValue(ticketInstance);

    const token = makeToken();
    const res = await request(app)
      .post(`/api/admin/tickets/${mockTicket._id}/reply`)
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Obrigado pelo contato.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(ticketInstance.save).toHaveBeenCalled();
  });

  it('returns 400 when message is empty', async () => {
    const token = makeToken();
    const res = await request(app)
      .post(`/api/admin/tickets/${mockTicket._id}/reply`)
      .set('Authorization', `Bearer ${token}`)
      .send({ message: '' });

    expect(res.status).toBe(400);
  });

  it('returns 404 when ticket not found', async () => {
    SupportTicket.findById.mockResolvedValue(null);

    const token = makeToken();
    const res = await request(app)
      .post(`/api/admin/tickets/${mockTicket._id}/reply`)
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Uma resposta válida' });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/admin/actions', () => {
  beforeEach(() => {
    AdminAction.find.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockAuditActions),
    });
    AdminAction.countDocuments.mockResolvedValue(1);
  });

  it('returns audit log for admin', async () => {
    const token = makeToken();
    const res = await request(app)
      .get('/api/admin/actions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total', 1);
  });

  it('returns 403 for non-admin', async () => {
    const token = makeToken({ role: 'freelancer' });
    const res = await request(app)
      .get('/api/admin/actions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
