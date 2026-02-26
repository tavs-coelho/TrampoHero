import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Challenge from '../models/Challenge.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// @route   GET /api/challenges
// @desc    Get active challenges with user progress
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const challenges = await Challenge.find({
      isActive: true,
      endDate: { $gte: new Date() },
    }).sort({ endDate: 1 });

    // Attach user-specific progress
    const data = challenges.map(challenge => {
      const participant = challenge.participants.find(
        p => p.userId.toString() === req.user.id
      );
      return {
        id: challenge._id,
        title: challenge.title,
        description: challenge.description,
        icon: challenge.icon,
        reward: challenge.reward,
        requirement: {
          ...challenge.requirement.toObject(),
          current: participant ? participant.current : 0,
        },
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        isActive: challenge.isActive,
        isCompleted: participant ? participant.isCompleted : false,
        isClaimed: participant ? !!participant.claimedAt : false,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/challenges/:id/progress
// @desc    Update challenge progress for the user
// @access  Private
router.post('/:id/progress', authenticate, async (req, res) => {
  try {
    const { increment } = req.body;
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    if (!challenge.isActive || challenge.endDate < new Date()) {
      return res.status(400).json({ success: false, error: 'Challenge is no longer active' });
    }

    let participant = challenge.participants.find(
      p => p.userId.toString() === req.user.id
    );

    if (!participant) {
      challenge.participants.push({ userId: req.user.id, current: 0 });
      participant = challenge.participants[challenge.participants.length - 1];
    }

    if (participant.isCompleted) {
      return res.status(400).json({ success: false, error: 'Challenge already completed' });
    }

    participant.current = Math.min(
      participant.current + (increment || 1),
      challenge.requirement.target
    );

    if (participant.current >= challenge.requirement.target) {
      participant.isCompleted = true;
    }

    await challenge.save();

    res.json({
      success: true,
      data: {
        current: participant.current,
        target: challenge.requirement.target,
        isCompleted: participant.isCompleted,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/challenges/:id/claim
// @desc    Claim challenge reward
// @access  Private
router.post('/:id/claim', authenticate, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    const participant = challenge.participants.find(
      p => p.userId.toString() === req.user.id
    );

    if (!participant || !participant.isCompleted) {
      return res.status(400).json({ success: false, error: 'Challenge not completed' });
    }

    if (participant.claimedAt) {
      return res.status(400).json({ success: false, error: 'Reward already claimed' });
    }

    // Grant reward based on type
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (challenge.reward.type === 'cash') {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { 'wallet.balance': challenge.reward.value },
      });
      await Transaction.create({
        userId: req.user.id,
        type: 'challenge_reward',
        amount: challenge.reward.value,
        description: `Recompensa: ${challenge.title}`,
      });
    } else if (challenge.reward.type === 'coins') {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { 'trampoCoins.balance': challenge.reward.value },
      });
    }

    participant.claimedAt = new Date();
    await challenge.save();

    res.json({ success: true, message: 'Reward claimed', reward: challenge.reward });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
