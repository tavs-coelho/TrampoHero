import express from 'express';
import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import Upload from '../models/Upload.js';
import { env } from '../config/env.js';
import { randomBytes } from 'crypto';

const router = express.Router();

// Allowed MIME types for photo uploads
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Safe extension map (avoids splitting on '/')
const MIME_TO_EXT = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' };

// SAS token validity in minutes
const SAS_EXPIRY_MINUTES = 15;

/**
 * Returns a StorageSharedKeyCredential, or null if Azure Storage is not configured.
 */
function getCredential() {
  if (!env.AZURE_STORAGE_ACCOUNT_NAME || !env.AZURE_STORAGE_ACCOUNT_KEY) {
    return null;
  }
  return new StorageSharedKeyCredential(
    env.AZURE_STORAGE_ACCOUNT_NAME,
    env.AZURE_STORAGE_ACCOUNT_KEY
  );
}

/**
 * Build a BlockBlobClient for a given blob name.
 * Returns null if Azure Storage is not configured.
 */
function getBlobClient(blobName) {
  const credential = getCredential();
  if (!credential) return null;
  const blobServiceClient = new BlobServiceClient(
    `https://${env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
    credential
  );
  return blobServiceClient
    .getContainerClient(env.AZURE_STORAGE_CONTAINER_NAME)
    .getBlockBlobClient(blobName);
}

/**
 * Generate a write-only SAS URL for a new blob.
 * Assumes Azure credentials are already validated by the caller.
 */
function generateSasUrl(blobName, contentType) {
  const credential = getCredential();
  const startsOn = new Date();
  const expiresOn = new Date(startsOn.getTime() + SAS_EXPIRY_MINUTES * 60 * 1000);

  const sasParams = generateBlobSASQueryParameters(
    {
      containerName: env.AZURE_STORAGE_CONTAINER_NAME,
      blobName,
      permissions: BlobSASPermissions.parse('cw'), // create + write only
      startsOn,
      expiresOn,
      contentType,
    },
    credential
  );

  return `https://${env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${env.AZURE_STORAGE_CONTAINER_NAME}/${blobName}?${sasParams.toString()}`;
}

// @route   POST /api/uploads/sas
// @desc    Request a SAS URL for direct-to-Blob photo upload
// @access  Private
router.post(
  '/sas',
  authenticate,
  [
    body('contentType')
      .isIn(ALLOWED_CONTENT_TYPES)
      .withMessage(`contentType must be one of: ${ALLOWED_CONTENT_TYPES.join(', ')}`),
    body('jobId').optional({ nullable: true }).isMongoId(),
    body('checkinId').optional({ nullable: true }).isString().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (!env.AZURE_STORAGE_ACCOUNT_NAME || !env.AZURE_STORAGE_ACCOUNT_KEY) {
      return res.status(503).json({ success: false, error: 'Storage service not configured' });
    }

    const { contentType, jobId = null, checkinId = null } = req.body;
    const ext = MIME_TO_EXT[contentType];
    const uniqueSuffix = `${Date.now()}-${randomBytes(6).toString('hex')}`;
    const blobName = `users/${req.user.id}/${uniqueSuffix}.${ext}`;

    try {
      const sasUrl = generateSasUrl(blobName, contentType);

      // Persist metadata as "pending" while the client performs the upload
      const upload = await Upload.create({
        userId: req.user.id,
        jobId,
        checkinId,
        blobName,
        containerName: env.AZURE_STORAGE_CONTAINER_NAME,
        contentType,
        status: 'pending',
      });

      return res.status(201).json({
        success: true,
        data: {
          uploadId: upload._id,
          sasUrl,
          blobName,
          expiresInMinutes: SAS_EXPIRY_MINUTES,
        },
      });
    } catch (error) {
      console.error('[uploads/sas]', error);
      return res.status(500).json({ success: false, error: 'Could not generate SAS URL' });
    }
  }
);

// @route   POST /api/uploads/confirm
// @desc    Confirm a completed upload and register its permanent URL
// @access  Private
router.post(
  '/confirm',
  authenticate,
  [body('uploadId').isMongoId()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { uploadId } = req.body;

    try {
      const upload = await Upload.findOne({ _id: uploadId, userId: req.user.id });
      if (!upload) {
        return res.status(404).json({ success: false, error: 'Upload record not found' });
      }

      if (upload.status !== 'pending') {
        return res.status(400).json({ success: false, error: `Upload already in status: ${upload.status}` });
      }

      // Verify the blob actually exists in Azure (optional but recommended)
      const blobClient = getBlobClient(upload.blobName);
      if (blobClient) {
        const exists = await blobClient.exists();
        if (!exists) {
          upload.status = 'failed';
          await upload.save();
          return res.status(422).json({ success: false, error: 'Blob not found in storage; upload may have failed' });
        }
      }

      // Permanent base URL – the container is private so callers must generate
      // a short-lived read SAS token when they need to display the image.
      const permanentUrl = `https://${env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${upload.containerName}/${upload.blobName}`;
      upload.status = 'confirmed';
      upload.url = permanentUrl;
      await upload.save();

      return res.json({ success: true, data: { url: permanentUrl, upload } });
    } catch (error) {
      console.error('[uploads/confirm]', error);
      return res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

export default router;
