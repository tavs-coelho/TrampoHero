import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob';
import { WebPubSubServiceClient } from '@azure/web-pubsub';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { authenticate, authorize } from '../middleware/auth.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { generateJobContract } from '../services/pdfService.js';
import { REFERRAL_BONUS } from './referral.js';
import { env } from '../config/env.js';

const router = express.Router();

/**
 * Validate that the proof photo URL is:
 * - a syntactically valid URL
 * - served over HTTPS
 * - (optionally) within the configured Azure blob storage base URL
 */
function isValidProofPhotoUrl(photoUrl) {
  try {
    const parsed = new URL(photoUrl);

    if (parsed.protocol !== 'https:') {
      return false;
    }

    // If a specific Azure blob base URL is configured, enforce that prefix.
    if (env.AZURE_BLOB_BASE_URL) {
      return photoUrl.startsWith(env.AZURE_BLOB_BASE_URL);
    }

    // Fallback: accept any HTTPS URL when no base URL is configured.
    return true;
  } catch {
    return false;
  }
}

// @route   GET /api/jobs
// @desc    Get all jobs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { niche, status, location } = req.query;
    
    const filter = {};
    if (niche) filter.niche = niche;
    if (status) filter.status = status;
    if (location) {
      // Escape special regex characters to prevent ReDoS
      const escapedLocation = location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.location = { $regex: escapedLocation, $options: 'i' };
    }

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

// @route   GET /api/jobs/:id/applicants
// @desc    Get applicants for a job with user details (name, rating)
// @access  Private (Employer only)
router.get(
  '/:id/applicants',
  [
    param('id').isMongoId().withMessage('Invalid job id'),
  ],
  authenticate,
  authorize('employer'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const job = await Job.findById(req.params.id);
      if (!job) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      if (job.employerId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }

      const applicantIds = job.applicants.map(a => a.userId);
      const users = await User.find({ _id: { $in: applicantIds } }, 'name rating niche');

      const userMap = {};
      users.forEach(u => { userMap[u._id.toString()] = u; });

      const applicants = job.applicants.map(a => {
        const u = userMap[a.userId.toString()] || {};
        return {
          userId: a.userId,
          appliedAt: a.appliedAt,
          status: a.status,
          name: u.name || 'Desconhecido',
          rating: u.rating ?? null,
          niche: u.niche || null,
        };
      });

      res.json({ success: true, count: applicants.length, data: applicants });
    } catch (error) {
      console.error('[GET /jobs/:id/applicants]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   POST /api/jobs/:id/select-candidate
// @desc    Employer approves one candidate, rejects all others, transitions job to applied
// @access  Private (Employer only)
router.post(
  '/:id/select-candidate',
  authenticate,
  authorize('employer'),
  [
    param('id').isMongoId().withMessage('Invalid job ID'),
    body('candidateId').optional().isMongoId().withMessage('candidateId must be a valid MongoId'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        return res.status(400).json({ success: false, error: firstError.msg });
      }

      const { candidateId } = req.body;
      if (!candidateId) {
        return res.status(400).json({ success: false, error: 'candidateId is required' });
      }

      const job = await Job.findById(req.params.id);
      if (!job) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      if (job.employerId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }

      if (!['open', 'applied'].includes(job.status)) {
        return res.status(400).json({ success: false, error: 'Job is not accepting candidate selection in its current status' });
      }

      const targetApplicant = job.applicants.find(a => a.userId.toString() === candidateId);
      if (!targetApplicant) {
        return res.status(404).json({ success: false, error: 'Candidate not found in applicants list' });
      }

      // Approve selected candidate, reject all others
      job.applicants.forEach(a => {
        a.status = a.userId.toString() === candidateId ? 'approved' : 'rejected';
      });

      job.status = 'applied';
      await job.save();

      res.json({ success: true, message: 'Candidate selected successfully', data: job });
    } catch (error) {
      console.error('[POST /jobs/:id/select-candidate]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   POST /api/jobs/:id/submit-proof
// @desc    Freelancer records the proof-photo URL (uploaded separately via SAS) against the job
// @access  Private (Freelancer only)
router.post(
  '/:id/submit-proof',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid job id'),
    body('photoUrl')
      .notEmpty()
      .withMessage('photoUrl is required')
      .bail()
      .custom((value) => {
        if (!isValidProofPhotoUrl(value)) {
          if (env.AZURE_BLOB_BASE_URL) {
            throw new Error('photoUrl must be a valid HTTPS URL within the configured storage container');
          }
          throw new Error('photoUrl must be a valid HTTPS URL');
        }
        return true;
      }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { photoUrl } = req.body;

    try {
      const job = await Job.findById(req.params.id);
      if (!job) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      const approved = job.applicants.find(
        a => a.status === 'approved' && a.userId.toString() === req.user.id
      );
      if (!approved) {
        return res.status(403).json({ success: false, error: 'Not authorized to submit proof for this job' });
      }

      if (!['ongoing', 'waiting_approval'].includes(job.status)) {
        return res.status(400).json({ success: false, error: 'Job must be ongoing or waiting approval to submit proof' });
      }

      job.proofPhoto = photoUrl;
      await job.save();

      return res.json({ success: true, data: job });
    } catch (error) {
      console.error('[POST /jobs/:id/submit-proof]', error.message);
      return res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// ─── Constants for upload-sas ─────────────────────────────────────────────────

const UPLOAD_ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD_MIME_TO_EXT = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' };
const UPLOAD_SAS_EXPIRY_MINUTES = 15;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStorageCredential() {
  if (!env.AZURE_STORAGE_ACCOUNT_NAME || !env.AZURE_STORAGE_ACCOUNT_KEY) return null;
  return new StorageSharedKeyCredential(env.AZURE_STORAGE_ACCOUNT_NAME, env.AZURE_STORAGE_ACCOUNT_KEY);
}

function generateJobSasUrl(blobName, contentType) {
  const credential = getStorageCredential();
  const startsOn = new Date();
  const expiresOn = new Date(startsOn.getTime() + UPLOAD_SAS_EXPIRY_MINUTES * 60 * 1000);
  const sasParams = generateBlobSASQueryParameters(
    {
      containerName: env.AZURE_STORAGE_CONTAINER_NAME,
      blobName,
      permissions: BlobSASPermissions.parse('cw'),
      startsOn,
      expiresOn,
      contentType,
    },
    credential
  );
  return `https://${env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${env.AZURE_STORAGE_CONTAINER_NAME}/${blobName}?${sasParams.toString()}`;
}

// @route   POST /api/jobs/upload-sas
// @desc    Request a SAS URL for direct-to-Blob photo upload scoped to jobs
// @access  Private
router.post(
  '/upload-sas',
  authenticate,
  [
    body('contentType')
      .optional()
      .isIn(UPLOAD_ALLOWED_CONTENT_TYPES)
      .withMessage(`contentType must be one of: ${UPLOAD_ALLOWED_CONTENT_TYPES.join(', ')}`),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const contentType = req.body.contentType ?? 'image/jpeg';
    const ext = UPLOAD_MIME_TO_EXT[contentType];
    const uniqueSuffix = `${Date.now()}-${randomBytes(6).toString('hex')}`;
    const blobName = `jobs/${req.user.id}/${uniqueSuffix}.${ext}`;

    // Fallback: Azure not configured – return a safe mock response
    if (!env.AZURE_STORAGE_ACCOUNT_NAME || !env.AZURE_STORAGE_ACCOUNT_KEY) {
      return res.status(200).json({
        success: true,
        data: {
          sasUrl: `https://mock-storage.blob.core.windows.net/uploads/${blobName}?sv=mock`,
          blobName,
          containerUrl: 'https://mock-storage.blob.core.windows.net/uploads',
        },
      });
    }

    try {
      const sasUrl = generateJobSasUrl(blobName, contentType);
      const containerUrl = `https://${env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${env.AZURE_STORAGE_CONTAINER_NAME}`;
      return res.status(201).json({
        success: true,
        data: { sasUrl, blobName, containerUrl },
      });
    } catch (error) {
      console.error('[POST /jobs/upload-sas]', error.message);
      return res.status(500).json({ success: false, error: 'Could not generate SAS URL' });
    }
  }
);

// @route   POST /api/jobs/:id/checkin
// @desc    Record a freelancer check-in (lat/lng/timestamp) and update job status
// @access  Private
router.post(
  '/:id/checkin',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid job id'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('latitude must be a number between -90 and 90'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('longitude must be a number between -180 and 180'),
    body('timestamp').notEmpty().withMessage('timestamp is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { latitude, longitude, timestamp } = req.body;

    try {
      const job = await Job.findById(req.params.id);
      if (!job) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      // Only the approved freelancer may check in
      const approved = job.applicants.find(
        (a) => a.status === 'approved' && a.userId.toString() === req.user.id
      );
      if (!approved) {
        return res.status(403).json({ success: false, error: 'Not authorized to check in for this job' });
      }

      if (!['applied', 'ongoing'].includes(job.status)) {
        return res.status(400).json({ success: false, error: 'Job is not in a state that allows check-in' });
      }

      const checkinDate = new Date(timestamp);
      job.checkInTime = checkinDate.toISOString();
      job.checkin = { latitude, longitude, recordedAt: checkinDate };
      if (job.status === 'applied') {
        job.status = 'ongoing';
      }
      await job.save();

      return res.json({ success: true, data: job });
    } catch (error) {
      console.error('[POST /jobs/:id/checkin]', error.message);
      return res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   POST /api/jobs/:id/checkout
// @desc    Freelancer records end of work (changes status to waiting_approval)
// @access  Private (Freelancer only)
router.post(
  '/:id/checkout',
  authenticate,
  authorize('freelancer'),
  [param('id').isMongoId().withMessage('Invalid job id')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const job = await Job.findById(req.params.id);
      if (!job) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      // Only the approved freelancer may check out
      const approved = job.applicants.find(
        (a) => a.status === 'approved' && a.userId.toString() === req.user.id
      );
      if (!approved) {
        return res.status(403).json({ success: false, error: 'Not authorized to check out for this job' });
      }

      if (job.status !== 'ongoing') {
        return res.status(400).json({ success: false, error: 'Job is not ongoing' });
      }

      job.status = 'waiting_approval';
      job.checkOutTime = new Date().toISOString();
      await job.save();

      return res.json({ success: true, data: job });
    } catch (error) {
      console.error('[POST /jobs/:id/checkout]', error.message);
      return res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   GET /api/jobs/:id/chat-token
// @desc    Return an Azure Web PubSub client access URL (or JWT mock) for real-time chat
// @access  Private
router.get(
  '/:id/chat-token',
  authenticate,
  [param('id').isMongoId().withMessage('Invalid job id')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const job = await Job.findById(req.params.id);
      if (!job) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      // Verify the requesting user is the employer or an approved freelancer for this job
      const isEmployer = job.employerId.toString() === req.user.id;
      const isApprovedFreelancer = job.applicants.some(
        (a) => a.status === 'approved' && a.userId.toString() === req.user.id
      );
      if (!isEmployer && !isApprovedFreelancer) {
        return res.status(403).json({ success: false, error: 'Not authorized to access chat for this job' });
      }

      // Azure Web PubSub path
      if (env.AZURE_WEBPUBSUB_CONNECTION_STRING && env.AZURE_WEBPUBSUB_HUB_NAME) {
        try {
          const client = new WebPubSubServiceClient(
            env.AZURE_WEBPUBSUB_CONNECTION_STRING,
            env.AZURE_WEBPUBSUB_HUB_NAME
          );
          const tokenResponse = await client.getClientAccessToken({
            userId: req.user.id,
            groups: [`job-${req.params.id}`],
            expirationTimeInMinutes: 60,
          });
          return res.json({ success: true, data: { url: tokenResponse.url } });
        } catch (azureError) {
          console.error('[GET /jobs/:id/chat-token] Azure error:', azureError.message);
          // Fall through to mock fallback
        }
      }

      // Fallback: JWT mock token (development/staging use only – no server-side validation)
      const mockToken = jwt.sign(
        { userId: req.user.id, jobId: req.params.id, type: 'chat' },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      return res.json({
        success: true,
        data: { url: `wss://mock-pubsub.example.com/chat?token=${mockToken}` },
      });
    } catch (error) {
      console.error('[GET /jobs/:id/chat-token]', error.message);
      return res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

export default router;
