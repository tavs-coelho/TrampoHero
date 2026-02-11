import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/ranking
// @desc    Get talent rankings
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { niche } = req.query;
    
    // TODO: Get rankings from database
    const rankings = [
      {
        userId: 't2',
        userName: 'Carlos Oliveira',
        rank: 1,
        score: 985,
        niche: 'CONSTRUCTION',
        rating: 5.0
      }
    ];
    
    res.json({ success: true, data: rankings });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
