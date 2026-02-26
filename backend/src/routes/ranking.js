import express from 'express';
import mongoose from 'mongoose';
import Job from '../models/Job.js';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/ranking
// @desc    Get talent rankings (calculated from completed jobs)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { niche, limit } = req.query;
    const maxResults = Math.min(parseInt(limit) || 20, 100);

    const matchStage = { role: 'freelancer' };
    if (niche) matchStage.niche = niche;

    const users = await User.find(matchStage)
      .select('name niche rating')
      .lean();

    const userIds = users.map(u => u._id);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);

    // Batch aggregate job counts for all users at once
    const [weeklyStats, monthlyStats] = await Promise.all([
      Job.aggregate([
        { $match: { status: { $in: ['completed', 'paid'] }, updatedAt: { $gte: weekAgo } } },
        { $unwind: '$applicants' },
        { $match: { 'applicants.userId': { $in: userIds }, 'applicants.status': 'approved' } },
        { $group: { _id: '$applicants.userId', count: { $sum: 1 } } },
      ]),
      Job.aggregate([
        { $match: { status: { $in: ['completed', 'paid'] }, updatedAt: { $gte: monthAgo } } },
        { $unwind: '$applicants' },
        { $match: { 'applicants.userId': { $in: userIds }, 'applicants.status': 'approved' } },
        { $group: { _id: '$applicants.userId', count: { $sum: 1 } } },
      ]),
    ]);

    const weeklyMap = new Map(weeklyStats.map(s => [s._id.toString(), s.count]));
    const monthlyMap = new Map(monthlyStats.map(s => [s._id.toString(), s.count]));

    const rankings = users.map(user => {
      const uid = user._id.toString();
      const weeklyJobs = weeklyMap.get(uid) || 0;
      const monthlyJobs = monthlyMap.get(uid) || 0;
      const score = Math.round(user.rating * 100 + monthlyJobs * 10 + weeklyJobs * 5);

      return { userId: user._id, userName: user.name, niche: user.niche, rating: user.rating, weeklyJobs, monthlyJobs, score };
    });

    // Sort by score descending and assign ranks
    rankings.sort((a, b) => b.score - a.score);
    const badges = ['🥇', '🥈', '🥉'];
    const data = rankings.slice(0, maxResults).map((r, i) => ({
      ...r,
      rank: i + 1,
      badge: badges[i] || undefined,
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
