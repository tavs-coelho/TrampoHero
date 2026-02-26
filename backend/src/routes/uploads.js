/**
 * Azure Blob Storage SAS upload routes.
 *
 * Flow:
 *   1. Client calls POST /api/uploads/sas  →  receives a short-lived SAS URL
 *   2. Client uploads the file directly to Azure Blob Storage (PUT request)
 *   3. Client calls POST /api/uploads/confirm/:blobName  →  marks upload done
 *
 * No Azure SDK is required at runtime – SAS tokens are constructed manually
 * using HMAC-SHA256 so the only Node dependency is the built-in `crypto` module.
 */

import express from 'express';
import crypto from 'crypto';
import { body, param, validationResult } from 'express-validator';
import { authenticate as authMiddleware } from '../middleware/auth.js';
import Upload from '../models/Upload.js';
import { env } from '../config/env.js';

const router = express.Router();

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Generate a Blob-level SAS token URL for PUT (upload) access.
 *
 * @param {string} blobName  – blob name inside the container
 * @param {string} contentType – MIME type the client will send
 * @param {number} ttlSeconds  – token validity window (default 15 min)
 * @returns {{ sasUrl: string, blobUrl: string }}
 */
function generateSasUrl(blobName, contentType, ttlSeconds = 900) {
  const account = env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = env.AZURE_STORAGE_ACCOUNT_KEY;
  const container = env.AZURE_STORAGE_CONTAINER_NAME;

  const start = new Date();
  const expiry = new Date(start.getTime() + ttlSeconds * 1000);

  const startStr = start.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const expiryStr = expiry.toISOString().replace(/\.\d{3}Z$/, 'Z');

  // Canonicalized resource: /blob/<account>/<container>/<blob>
  const canonicalizedResource = `/blob/${account}/${container}/${blobName}`;

  // String-to-sign for Blob SAS (service version 2020-10-02)
  const signedPermissions = 'cw'; // create + write
  const signedStart = startStr;
  const signedExpiry = expiryStr;
  const signedIdentifier = '';
  const signedIP = '';
  const signedProtocol = 'https';
  const signedVersion = '2020-10-02';
  const signedResource = 'b'; // blob
  const signedSnapshotTime = '';
  const rscc = ''; // Cache-Control
  const rscd = ''; // Content-Disposition
  const rsce = ''; // Content-Encoding
  const rscl = ''; // Content-Language
  const rsct = contentType; // Content-Type

  const stringToSign = [
    signedPermissions,
    signedStart,
    signedExpiry,
    canonicalizedResource,
    signedIdentifier,
    signedIP,
    signedProtocol,
    signedVersion,
    signedResource,
    signedSnapshotTime,
    rscc,
    rscd,
    rsce,
    rscl,
    rsct,
  ].join('\n');

  const key = Buffer.from(accountKey, 'base64');
  const sig = crypto.createHmac('sha256', key).update(stringToSign, 'utf8').digest('base64');

  const params = new URLSearchParams({
    sv: signedVersion,
    sr: signedResource,
    sp: signedPermissions,
    st: signedStart,
    se: signedExpiry,
    rsct: rsct,
    spr: signedProtocol,
    sig,
  });

  const blobUrl = `https://${account}.blob.core.windows.net/${container}/${blobName}`;
  const sasUrl = `${blobUrl}?${params.toString()}`;

  return { sasUrl, blobUrl };
}

// ─── routes ──────────────────────────────────────────────────────────────────

// POST /api/uploads/sas
// Request a SAS URL to upload a file directly to Azure Blob Storage.
router.post(
  '/sas',
  authMiddleware,
  [
    body('fileName').trim().notEmpty().withMessage('fileName is required'),
    body('contentType')
      .trim()
      .notEmpty()
      .matches(/^[\w\-+.]+\/[\w\-+.]+$/)
      .withMessage('Invalid contentType'),
    body('category')
      .isIn(['job-proof', 'profile-photo', 'check-in'])
      .withMessage('Invalid category'),
    body('jobId').optional().isMongoId(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (!env.AZURE_STORAGE_ACCOUNT_NAME) {
      return res
        .status(503)
        .json({ success: false, error: 'Azure Blob Storage is not configured on this server.' });
    }

    const { fileName, contentType, category, jobId } = req.body;

    // Build a unique blob name: <category>/<userId>/<timestamp>-<safeName>
    const extMatch = fileName.match(/(\.[a-zA-Z0-9]{1,10})$/);
    const ext = extMatch ? extMatch[1] : '';
    const baseName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120 - ext.length);
    const safeName = `${baseName}${ext}`;
    const blobName = `${category}/${req.user.id}/${Date.now()}-${safeName}`;

    const { sasUrl, blobUrl } = generateSasUrl(blobName, contentType);

    // Pre-create the Upload record (unconfirmed)
    const upload = await Upload.create({
      blobName,
      blobUrl,
      contentType,
      category,
      uploadedBy: req.user.id,
      jobId: jobId ?? null,
    });

    return res.status(201).json({
      success: true,
      uploadId: upload._id,
      blobName,
      sasUrl,
      blobUrl,
      expiresInSeconds: 900,
    });
  }
);

// POST /api/uploads/confirm/:uploadId
// Mark an upload as confirmed (client has finished the PUT to Azure).
router.post(
  '/confirm/:uploadId',
  authMiddleware,
  [param('uploadId').isMongoId().withMessage('Invalid uploadId')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const upload = await Upload.findOneAndUpdate(
      { _id: req.params.uploadId, uploadedBy: req.user.id },
      { confirmed: true },
      { new: true }
    );

    if (!upload) {
      return res.status(404).json({ success: false, error: 'Upload not found.' });
    }

    return res.json({ success: true, upload });
  }
);

// GET /api/uploads/mine
// List confirmed uploads belonging to the authenticated user.
router.get('/mine', authMiddleware, async (req, res) => {
  const uploads = await Upload.find({
    uploadedBy: req.user.id,
    confirmed: true,
  })
    .sort({ createdAt: -1 })
    .limit(50);

  return res.json({ success: true, uploads });
});

export default router;
