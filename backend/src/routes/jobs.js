import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { generateJobContract } from '../services/pdfService.js';
import { REFERRAL_BONUS } from './referral.js';

const router = express.Router();

// @route   GET /api/jobs
// @desc    Get all jobs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { niche, status, location } = req.query;
    
    const filter = {};
    if (niche) filter.niche = niche;
    if (status) filter.status = status;
    if (location) filter.location = { $regex: location, $options: 'i' };

    const jobs = await Job.find(filter).sort({ isBoosted: -1, payment: -1 });

    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get single job
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/jobs
// @desc    Create a new job
// @access  Private (Employer only)
router.post('/', authenticate, authorize('employer'), async (req, res) => {
  try {
    const { title, payment, niche, location, coordinates, description, date, startTime, paymentType, isBoosted, isEscrowGuaranteed, minRatingRequired } = req.body;

    // Fetch employer name from user document
    const employer = await User.findById(req.user.id);
    if (!employer) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      return res.status(400).json({ success: false, error: 'Valid coordinates (lat, lng) are required' });
    }

    const job = await Job.create({
      employerId: req.user.id,
      title,
      employer: employer.name,
      payment,
      niche,
      location,
      coordinates,
      description,
      date,
      startTime,
      paymentType: paymentType || 'dia',
      isBoosted: isBoosted || false,
      isEscrowGuaranteed: isEscrowGuaranteed || false,
      minRatingRequired: minRatingRequired || 0,
    });

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update a job
// @access  Private (Employer only)
router.put('/:id', authenticate, authorize('employer'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    // Ensure employer owns this job
    if (job.employerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: updatedJob });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/jobs/:id/apply
// @desc    Apply to a job
// @access  Private (Freelancer only)
router.post('/:id/apply', authenticate, authorize('freelancer'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ success: false, error: 'Job is not open for applications' });
    }

    // Check if already applied
    const alreadyApplied = job.applicants.some(a => a.userId.toString() === req.user.id);
    if (alreadyApplied) {
      return res.status(400).json({ success: false, error: 'Already applied to this job' });
    }

    job.applicants.push({ userId: req.user.id });
    await job.save();

    res.json({ success: true, message: 'Applied successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/jobs/:id/complete
// @desc    Mark a job as completed, generate a digital contract PDF and return its download link
// @access  Private (Employer only)
router.post('/:id/complete', authenticate, authorize('employer'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    // Only the employer who owns this job may complete it
    if (job.employerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (!['ongoing', 'waiting_approval'].includes(job.status)) {
      return res.status(400).json({ success: false, error: 'Job cannot be completed in its current status' });
    }

    // Identify the approved freelancer
    const approvedApplicant = job.applicants.find(a => a.status === 'approved');
    if (!approvedApplicant) {
      return res.status(400).json({ success: false, error: 'No approved freelancer assigned to this job' });
    }

    const [freelancer, employer] = await Promise.all([
      User.findById(approvedApplicant.userId),
      User.findById(req.user.id),
    ]);

    if (!freelancer || !employer) {
      return res.status(404).json({ success: false, error: 'User data not found' });
    }

    // Update job status
    job.status = 'completed';
    await job.save();

    // Referral bonus: credit R$ 10.00 to the referrer on the freelancer's first completed job.
    // Use an atomic update to prevent double-payment in concurrent requests.
    if (freelancer.referredBy && !freelancer.referralBonusPaid) {
      const claimed = await User.findOneAndUpdate(
        { _id: freelancer._id, referralBonusPaid: false },
        { referralBonusPaid: true },
      );
      if (claimed) {
        const referrerUpdate = await User.findByIdAndUpdate(freelancer.referredBy, {
          $inc: { 'wallet.balance': REFERRAL_BONUS },
        });
        if (referrerUpdate) {
          await Transaction.create({
            userId: freelancer.referredBy,
            type: 'referral_bonus',
            amount: REFERRAL_BONUS,
            description: `Bônus de indicação por ${freelancer.name} completar sua primeira vaga`,
            relatedJobId: job._id,
          });
        }
      }
    }

    // Generate PDF contract
    const { downloadUrl, validationHash } = await generateJobContract(freelancer, employer, job);

    res.json({
      success: true,
      message: 'Job completed successfully',
      data: {
        job,
        contract: {
          downloadUrl,
          validationHash,
        },
      },
    });
  } catch (error) {
    console.error('[POST /jobs/:id/complete]', error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
