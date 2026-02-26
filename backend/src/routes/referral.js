import express from 'express';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

const REFERRAL_BONUS = 10.00;

const router = express.Router();

// @route   GET /api/referral/stats
// @desc    Get referral stats for the authenticated user
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const referredCount = await User.countDocuments({ referredBy: req.user.id });

    const bonusTransactions = await Transaction.find({
      userId: req.user.id,
      type: 'referral_bonus',
    });

    const totalBonus = bonusTransactions.reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referredCount,
        totalBonus,
        bonusPerReferral: REFERRAL_BONUS,
      },
    });
  } catch (error) {
    console.error('[GET /referral/stats]', error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export { REFERRAL_BONUS };
export default router;
