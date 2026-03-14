import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Contract from '../models/Contract.js';
import AdminAction from '../models/AdminAction.js';

const router = express.Router();

// @route   GET /api/contracts
// @desc    List contracts for the authenticated user (as employer or freelancer)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const query = req.user.role === 'employer'
      ? { employerId: userId }
      : { freelancerId: userId };

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
router.get('/:id', authenticate, async (req, res) => {
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
});

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
