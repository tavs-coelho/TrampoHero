import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Job from '../models/Job.js';

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
    
    const job = await Job.create({
      employerId: req.user.id,
      title,
      employer: req.user.name || 'Employer',
      payment,
      niche,
      location,
      coordinates: coordinates || { lat: -23.5505, lng: -46.6333 },
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

export default router;
