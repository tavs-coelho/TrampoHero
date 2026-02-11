import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/challenges
// @desc    Get active challenges
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    // TODO: Get challenges from database
    const challenges = [
      {
        id: 'wc1',
        title: '🔥 Desafio da Semana',
        description: 'Complete 3 trampos esta semana',
        requirement: { type: 'jobs_completed', target: 3, current: 1 },
        reward: { type: 'cash', value: 30 }
      }
    ];
    res.json({ success: true, data: challenges });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/challenges/:id/claim
// @desc    Claim challenge reward
// @access  Private
router.post('/:id/claim', authenticate, async (req, res) => {
  try {
    // TODO: Claim reward logic
    res.json({ success: true, message: 'Reward claimed' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
