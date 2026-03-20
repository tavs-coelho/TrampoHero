import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import Consent from '../models/Consent.js';

const router = express.Router();

// @route   GET /api/consents
// @desc    List consent records for authenticated user
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const consents = await Consent.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: consents });
  } catch (error) {
    console.error('[GET /consents]', error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/consents
// @desc    Record or update a consent decision
// @access  Private
router.post(
  '/',
  authenticate,
  body('purpose')
    .isString()
    .trim()
    .isLength({ max: 100 })
    .notEmpty()
    .withMessage('purpose is required'),
  body('legalBasis')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 }),
  body('granted').optional().isBoolean(),
  body('policyVersion')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 }),
  body('source')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const {
        purpose,
        legalBasis = 'consent',
        granted = true,
        policyVersion = null,
        source = 'app',
      } = req.body;

      const update = {
        legalBasis,
        granted,
        policyVersion,
        source,
        revokedAt: granted ? null : new Date(),
      };

      const consent = await Consent.findOneAndUpdate(
        { userId: req.user.id, purpose, policyVersion },
        { $set: update },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      res.status(201).json({ success: true, data: consent });
    } catch (error) {
      console.error('[POST /consents]', error.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

export default router;
