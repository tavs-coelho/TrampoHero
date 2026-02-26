import express from 'express';
import multer from 'multer';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { randomBytes } from 'crypto';

const router = express.Router();

// Allowed MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MIME_TO_EXT = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' };

// Max file size: 5 MB per document
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Multer memory storage – files are held in memory and uploaded directly to Azure
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG and WebP are accepted.`));
    }
  },
});

/**
 * Upload a single buffer to Azure Blob Storage.
 * Returns the permanent blob URL or null when Azure is not configured.
 */
async function uploadToAzure(buffer, blobName, contentType) {
  if (!env.AZURE_STORAGE_ACCOUNT_NAME || !env.AZURE_STORAGE_ACCOUNT_KEY) {
    return null;
  }
  const credential = new StorageSharedKeyCredential(
    env.AZURE_STORAGE_ACCOUNT_NAME,
    env.AZURE_STORAGE_ACCOUNT_KEY
  );
  const blobServiceClient = new BlobServiceClient(
    `https://${env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
    credential
  );
  const blockBlobClient = blobServiceClient
    .getContainerClient(env.AZURE_STORAGE_CONTAINER_NAME)
    .getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  return `https://${env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${env.AZURE_STORAGE_CONTAINER_NAME}/${blobName}`;
}

// @route   POST /api/kyc/submit
// @desc    Upload KYC documents (documentFront, documentBack, selfie) via multer
// @access  Private
router.post(
  '/submit',
  authenticate,
  upload.fields([
    { name: 'documentFront', maxCount: 1 },
    { name: 'documentBack', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  async (req, res) => {
    const files = req.files || {};

    if (!files.documentFront || !files.documentBack || !files.selfie) {
      return res.status(400).json({
        success: false,
        error: 'All three documents are required: documentFront, documentBack, selfie',
      });
    }

    try {
      const userId = req.user.id;
      const uniqueSuffix = `${Date.now()}-${randomBytes(6).toString('hex')}`;

      const buildBlobName = (label) => {
        const file = files[label][0];
        const ext = MIME_TO_EXT[file.mimetype] ?? 'jpg';
        return `kyc/${userId}/${label}-${uniqueSuffix}.${ext}`;
      };

      // Upload all three files (or fall back to null when Azure is not configured)
      const [documentFrontUrl, documentBackUrl, selfieUrl] = await Promise.all([
        uploadToAzure(files.documentFront[0].buffer, buildBlobName('documentFront'), files.documentFront[0].mimetype),
        uploadToAzure(files.documentBack[0].buffer, buildBlobName('documentBack'), files.documentBack[0].mimetype),
        uploadToAzure(files.selfie[0].buffer, buildBlobName('selfie'), files.selfie[0].mimetype),
      ]);

      const user = await User.findByIdAndUpdate(
        userId,
        {
          'kyc.status': 'pending',
          'kyc.documentFrontUrl': documentFrontUrl,
          'kyc.documentBackUrl': documentBackUrl,
          'kyc.selfieUrl': selfieUrl,
          'kyc.submittedAt': new Date(),
          'kyc.rejectionReason': null,
          'kyc.reviewedAt': null,
        },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      return res.status(200).json({
        success: true,
        data: {
          kycStatus: user.kyc.status,
          documentFrontUrl,
          documentBackUrl,
          selfieUrl,
          submittedAt: user.kyc.submittedAt,
        },
      });
    } catch (error) {
      console.error('[kyc/submit]', error);
      return res.status(500).json({ success: false, error: 'Server error during KYC submission' });
    }
  }
);

// @route   GET /api/kyc/status
// @desc    Get the current user's KYC status
// @access  Private
router.get('/status', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('kyc');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    return res.json({ success: true, data: user.kyc });
  } catch (error) {
    console.error('[kyc/status]', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Multer error handler
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message?.startsWith('Invalid file type')) {
    return res.status(400).json({ success: false, error: err.message });
  }
  console.error('[kyc] Unexpected error:', err);
  return res.status(500).json({ success: false, error: 'Server error' });
});

export default router;
