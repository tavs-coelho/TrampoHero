import express from 'express';
import mongoose from 'mongoose';
import { authenticate, authorize } from '../middleware/auth.js';
import Job from '../models/Job.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// @route   GET /api/analytics/employer/stats
// @desc    Get aggregated analytics stats for the authenticated employer
// @access  Private (employer only)
router.get('/employer/stats', authenticate, authorize('employer'), async (req, res) => {
  try {
    const employerObjId = new mongoose.Types.ObjectId(req.user.id);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // ── Job-level aggregation ─────────────────────────────────────────────────
    // Calculates totals across ALL of the employer's jobs in a single pass.
    const jobAgg = await Job.aggregate([
      { $match: { employerId: employerObjId } },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          jobsCompleted: {
            $sum: {
              $cond: [{ $in: ['$status', ['completed', 'paid']] }, 1, 0],
            },
          },
          totalGained: {
            $sum: {
              $cond: [
                { $in: ['$status', ['completed', 'paid']] },
                '$payment',
                0,
              ],
            },
          },
        },
      },
    ]);

    const { totalJobs = 0, jobsCompleted = 0, totalGained = 0 } =
      jobAgg[0] ?? {};

    const averagePerJob =
      jobsCompleted > 0
        ? Math.round((totalGained / jobsCompleted) * 100) / 100
        : 0;

    const retentionRate =
      totalJobs > 0
        ? Math.round((jobsCompleted / totalJobs) * 10000) / 100
        : 0;

    // ── Transaction-based chart (last 30 days) ────────────────────────────────
    // Groups completed employer transactions by calendar day so the front-end
    // bar-chart always reflects actual monetary movements.
    // Only 'escrow' and 'job_payment' types are employer-originated outflows;
    // 'escrow_release' belongs to the freelancer's transaction record.
    const chartAgg = await Transaction.aggregate([
      {
        $match: {
          userId: employerObjId,
          type: { $in: ['escrow', 'job_payment'] },
          status: 'completed',
          amount: { $gt: 0 },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const last30DaysChart = chartAgg.map((d) => ({
      date: d._id,
      total: d.total,
      count: d.count,
    }));

    res.json({
      success: true,
      data: {
        totalGained,
        jobsCompleted,
        averagePerJob,
        retentionRate,
        last30DaysChart,
      },
    });
  } catch (error) {
    console.error('[Analytics] Error fetching employer stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
