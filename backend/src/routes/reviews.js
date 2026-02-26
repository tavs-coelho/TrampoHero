import express from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.js';
import Review from '../models/Review.js';

const router = express.Router();

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post('/', authenticate, async (req, res) => {
  try {
    const { rating, comment, targetId, jobId } = req.body;

    if (!rating || !targetId || !jobId) {
      return res.status(400).json({ success: false, error: 'rating, targetId and jobId are required' });
    }

    // Prevent self-reviews
    if (req.user.id === targetId) {
      return res.status(400).json({ success: false, error: 'Cannot review yourself' });
    }

    const review = await Review.create({
      rating,
      comment: comment || '',
      authorId: req.user.id,
      targetId,
      jobId,
    });

    // Update the target user's average rating
    const stats = await Review.aggregate([
      { $match: { targetId: review.targetId } },
      { $group: { _id: '$targetId', avgRating: { $avg: '$rating' } } },
    ]);

    if (stats.length > 0) {
      const User = (await import('../models/User.js')).default;
      await User.findByIdAndUpdate(targetId, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
      });
    }

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'You have already reviewed this job' });
    }
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/reviews?targetId=<id>
// @desc    Get reviews for a user and their average rating
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { targetId } = req.query;

    if (!targetId) {
      return res.status(400).json({ success: false, error: 'targetId query parameter is required' });
    }

    const reviews = await Review.find({ targetId })
      .populate('authorId', 'name role')
      .sort({ createdAt: -1 });

    const avgResult = await Review.aggregate([
      { $match: { targetId: new mongoose.Types.ObjectId(targetId) } },
      { $group: { _id: '$targetId', average: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    const average = avgResult.length > 0 ? Math.round(avgResult[0].average * 10) / 10 : 0;
    const count = avgResult.length > 0 ? avgResult[0].count : 0;

    res.json({ success: true, count, average, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
