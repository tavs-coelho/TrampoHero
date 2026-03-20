import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { authenticate, authorize } from '../middleware/auth.js';
import Contract from '../models/Contract.js';
import AdminAction from '../models/AdminAction.js';
import { param, validationResult } from 'express-validator';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTRACTS_DIR = path.join(__dirname, '..', '..', 'contracts');

function isSafeFileName(fileName) {
  return fileName === path.basename(fileName);
}

// @route   GET /api/contracts
// @desc    List contracts for the authenticated user (as employer or freelancer)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    let query;

    if (req.user.role === 'employer') {
      query = { employerId: userId };
    } else if (req.user.role === 'admin') {
      // Admins can list all contracts
      query = {};
    } else {
      // Default to freelancer view
      query = { freelancerId: userId };
    }

    const contracts = await Contract.find(query)
      .populate('jobId', 'title date payment')
      .populate('freelancerId', 'name email')
      .populate('employerId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: contracts.length, data: contracts });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/contracts/:id
// @desc    Get a single contract
// @access  Private (employer or freelancer of that contract)
router.get(
  '/:id',
  authenticate,
  param('id').isMongoId().withMessage('Invalid contract ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const contract = await Contract.findById(req.params.id)
        .populate('jobId', 'title date payment paymentType niche location')
        .populate('freelancerId', 'name email rating')
        .populate('employerId', 'name email rating');

      if (!contract) {
        return res.status(404).json({ success: false, error: 'Contract not found' });
      }

      const userId = req.user.id;
      const isParty =
        contract.freelancerId._id.toString() === userId ||
        contract.employerId._id.toString() === userId;

      if (!isParty && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }

      res.json({ success: true, data: contract });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   GET /api/contracts/files/:fileName
// @desc    Download a contract file (authenticated and authorized)
// @access  Private (party or admin)
router.get(
  '/files/:fileName',
  authenticate,
  param('fileName').notEmpty().withMessage('File name is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { fileName } = req.params;
    if (!isSafeFileName(fileName)) {
      return res.status(400).json({ success: false, error: 'Invalid file name' });
    }

    try {
      const contract = await Contract.findOne({ pdfUrl: `/api/contracts/files/${fileName}` });
      if (!contract) {
        return res.status(404).json({ success: false, error: 'Contract not found' });
      }

      const userId = req.user.id;
      const isParty =
        contract.freelancerId.toString() === userId ||
        contract.employerId.toString() === userId;
      if (!isParty && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }

      const filePath = path.join(CONTRACTS_DIR, fileName);
      try {
        await fs.access(filePath);
      } catch (err) {
        const message = err.code === 'ENOENT'
          ? 'Contract file not found'
          : 'Error retrieving contract file';
        return res.status(err.code === 'ENOENT' ? 404 : 500).json({ success: false, error: message });
      }

      return res.sendFile(filePath);
    } catch (error) {
      console.error('[GET /contracts/files]', error.message);
      return res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   POST /api/contracts/:id/void
// @desc    Void a contract (admin only)
// @access  Private (admin)
router.post('/:id/void', authenticate, authorize('admin'), async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }

    if (contract.status === 'voided') {
      return res.status(400).json({ success: false, error: 'Contract is already voided' });
    }

    contract.status = 'voided';
    await contract.save();

    await AdminAction.create({
      adminId: req.user.id,
      action: 'contract_void',
      targetType: 'Contract',
      targetId: contract._id,
      details: { reason: req.body.reason || null },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || null,
    });

    res.json({ success: true, data: contract });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
