import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  registerInstallation,
  updateInstallationTags,
  removeInstallation,
  sendToUser,
  sendToSegment,
} from '../services/notificationHubs.js';

const router = express.Router();

// Allowed platforms
const PLATFORMS = ['apns', 'fcmv1'];

// Allowed tag prefixes and their permitted values
const ROLE_VALUES = ['freelancer', 'employer'];
const NICHE_VALUES = ['Gastronomia', 'Construção', 'Eventos', 'Serviços Gerais'];

/**
 * Validate that every tag follows the allowed patterns:
 *   user:<mongoId>
 *   role:<role>
 *   niche:<niche>
 */
function validateTags(tags) {
  if (!Array.isArray(tags)) return 'tags must be an array';
  for (const tag of tags) {
    if (typeof tag !== 'string') return `tag "${tag}" must be a string`;
    if (tag.startsWith('user:')) continue;
    if (tag.startsWith('role:')) {
      const val = tag.slice(5);
      if (!ROLE_VALUES.includes(val)) return `invalid role tag value: "${val}"`;
      continue;
    }
    if (tag.startsWith('niche:')) {
      const val = tag.slice(6);
      if (!NICHE_VALUES.includes(val)) return `invalid niche tag value: "${val}"`;
      continue;
    }
    return `tag "${tag}" must start with user:, role:, or niche:`;
  }
  return null;
}

// @route   POST /api/notifications/register
// @desc    Register or update a device installation
// @access  Private
router.post(
  '/register',
  authenticate,
  [
    body('installationId').isString().trim().notEmpty().withMessage('installationId is required'),
    body('platform').isIn(PLATFORMS).withMessage(`platform must be one of: ${PLATFORMS.join(', ')}`),
    body('pushToken').isString().trim().notEmpty().withMessage('pushToken is required'),
    body('tags').optional().isArray().withMessage('tags must be an array'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { installationId, platform, pushToken, tags = [] } = req.body;

    // Always inject the user tag so we can target this device by user
    const allTags = [`user:${req.user.id}`, ...tags.filter((t) => !t.startsWith('user:'))];

    const tagError = validateTags(allTags);
    if (tagError) {
      return res.status(400).json({ success: false, error: tagError });
    }

    const result = await registerInstallation({ installationId, platform, pushToken, tags: allTags });
    if (!result.success) {
      return res.status(503).json({ success: false, error: result.error });
    }

    return res.status(201).json({ success: true, data: { installationId, tags: allTags } });
  }
);

// @route   PUT /api/notifications/register/:installationId
// @desc    Update tags for an existing device installation
// @access  Private
router.put(
  '/register/:installationId',
  authenticate,
  [
    param('installationId').isString().trim().notEmpty(),
    body('tags').isArray().withMessage('tags must be an array'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { installationId } = req.params;
    const { tags = [] } = req.body;

    // Preserve user tag
    const allTags = [`user:${req.user.id}`, ...tags.filter((t) => !t.startsWith('user:'))];

    const tagError = validateTags(allTags);
    if (tagError) {
      return res.status(400).json({ success: false, error: tagError });
    }

    const result = await updateInstallationTags(installationId, allTags);
    if (!result.success) {
      return res.status(503).json({ success: false, error: result.error });
    }

    return res.json({ success: true, data: { installationId, tags: allTags } });
  }
);

// @route   DELETE /api/notifications/register/:installationId
// @desc    Remove a device installation
// @access  Private
router.delete(
  '/register/:installationId',
  authenticate,
  [param('installationId').isString().trim().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { installationId } = req.params;
    const result = await removeInstallation(installationId);
    if (!result.success) {
      return res.status(503).json({ success: false, error: result.error });
    }

    return res.json({ success: true });
  }
);

// @route   POST /api/notifications/send/user/:userId
// @desc    Send a push notification to a specific user
// @access  Private (admin only)
router.post(
  '/send/user/:userId',
  authenticate,
  authorize('admin'),
  [
    param('userId').isString().trim().notEmpty(),
    body('title').isString().trim().notEmpty().withMessage('title is required'),
    body('body').isString().trim().notEmpty().withMessage('body is required'),
    body('data').optional().isObject(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { userId } = req.params;
    const { title, body: msgBody, data = {} } = req.body;

    const result = await sendToUser(userId, { title, body: msgBody, data });
    if (!result.success) {
      return res.status(503).json({ success: false, error: result.error });
    }

    return res.json({ success: true });
  }
);

// @route   POST /api/notifications/send/segment
// @desc    Send a push notification to a tag expression (role/niche segment)
// @access  Private (admin only)
router.post(
  '/send/segment',
  authenticate,
  authorize('admin'),
  [
    body('tagExpression').isString().trim().notEmpty().withMessage('tagExpression is required'),
    body('title').isString().trim().notEmpty().withMessage('title is required'),
    body('body').isString().trim().notEmpty().withMessage('body is required'),
    body('data').optional().isObject(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { tagExpression, title, body: msgBody, data = {} } = req.body;

    const result = await sendToSegment(tagExpression, { title, body: msgBody, data });
    if (!result.success) {
      return res.status(503).json({ success: false, error: result.error });
    }

    return res.json({ success: true });
  }
);

export default router;
