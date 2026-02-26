import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Advertisement from '../models/Advertisement.js';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/ads
// @desc    Get advertisements for the current employer
// @access  Private (Employer only)
router.get('/', authenticate, authorize('employer'), async (req, res) => {
  try {
    const ads = await Advertisement.find({ advertiserId: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: ads });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/ads/feed
// @desc    Get active ads for freelancer feed (based on niche targeting)
// @access  Private
router.get('/feed', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const ads = await Advertisement.find({
      isActive: true,
      endDate: { $gte: new Date() },
      'targeting.niches': user.niche,
      $expr: { $lt: ['$spent', '$budget'] },
    }).limit(5);

    // Increment impressions
    const adIds = ads.map(ad => ad._id);
    if (adIds.length > 0) {
      await Advertisement.updateMany(
        { _id: { $in: adIds } },
        { $inc: { impressions: 1 } }
      );
    }

    res.json({ success: true, data: ads });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/ads
// @desc    Create advertisement campaign
// @access  Private (Employer only)
router.post('/', authenticate, authorize('employer'), async (req, res) => {
  try {
    const { type, content, targeting, budget, startDate, endDate } = req.body;

    if (!type || !content || !budget) {
      return res.status(400).json({ success: false, error: 'Type, content, and budget are required' });
    }

    if (!content.title || !content.description) {
      return res.status(400).json({ success: false, error: 'Content must include title and description' });
    }

    const employer = await User.findById(req.user.id);
    if (!employer) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const ad = await Advertisement.create({
      advertiserId: req.user.id,
      advertiserName: employer.name,
      type,
      content,
      targeting: targeting || { niches: [], userActivity: 'medium' },
      budget,
      startDate: startDate || new Date(),
      endDate: endDate || new Date(Date.now() + 30 * 86400000),
    });

    res.status(201).json({ success: true, data: ad });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PUT /api/ads/:id
// @desc    Update advertisement
// @access  Private (Employer only)
router.put('/:id', authenticate, authorize('employer'), async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ success: false, error: 'Advertisement not found' });
    }

    if (ad.advertiserId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const updatedAd = await Advertisement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: updatedAd });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/ads/:id/click
// @desc    Record ad click
// @access  Private
router.post('/:id/click', authenticate, async (req, res) => {
  try {
    const ad = await Advertisement.findByIdAndUpdate(
      req.params.id,
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (!ad) {
      return res.status(404).json({ success: false, error: 'Advertisement not found' });
    }

    res.json({ success: true, data: { clicks: ad.clicks } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/ads/:id/analytics
// @desc    Get ad analytics
// @access  Private (Employer only)
router.get('/:id/analytics', authenticate, authorize('employer'), async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ success: false, error: 'Advertisement not found' });
    }

    if (ad.advertiserId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        impressions: ad.impressions,
        clicks: ad.clicks,
        ctr: parseFloat(ctr),
        spent: ad.spent,
        budget: ad.budget,
        remaining: ad.budget - ad.spent,
        isActive: ad.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
