/**
 * Push notification routes – device registration and server-side send.
 *
 * Endpoints:
 *   POST  /api/notifications/register   – register a device push token
 *   DELETE /api/notifications/register  – unregister the current device
 *   POST  /api/notifications/send       – send a push to a tag expression (admin only)
 *
 * Azure Notification Hubs env vars (see backend/.env.example):
 *   NH_CONNECTION_STRING  – Azure portal → Notification Hub → Access Policies → Full access
 *   NH_HUB_NAME           – Name of the Notification Hub resource
 *
 * FCM / APNs credentials are configured inside the Azure Notification Hub,
 * not in this application.  See docs: https://aka.ms/notification-hubs-setup
 *
 * Tags applied automatically:
 *   role:<freelancer|employer>
 *   niche:<user niche>
 *   user:<userId>
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate as authMiddleware } from '../middleware/auth.js';
import DeviceRegistration from '../models/DeviceRegistration.js';
import User from '../models/User.js';
import { env } from '../config/env.js';

const router = express.Router();

// ─── Notification Hubs helper ─────────────────────────────────────────────────

/**
 * Lazily create a NotificationHubsClient only when the env var is present.
 *
 * @returns {Promise<import('@azure/notification-hubs').NotificationHubsClient | null>}
 */
async function getNhClient() {
  if (!env.NH_CONNECTION_STRING) return null;
  try {
    const { NotificationHubsClient } = await import('@azure/notification-hubs');
    return new NotificationHubsClient(env.NH_CONNECTION_STRING, env.NH_HUB_NAME);
  } catch {
    console.warn('[notifications] @azure/notification-hubs not installed – push disabled.');
    return null;
  }
}

/**
 * Build the default tag set for a user.
 *
 * @param {import('../models/User.js').default} user
 * @param {string} userId
 * @returns {string[]}
 */
function buildTags(user, userId) {
  const tags = [`user:${userId}`];
  if (user?.role) tags.push(`role:${user.role}`);
  if (user?.niche) tags.push(`niche:${user.niche}`);
  return tags;
}

// ─── routes ──────────────────────────────────────────────────────────────────

// POST /api/notifications/register
router.post(
  '/register',
  authMiddleware,
  [
    body('pushToken').trim().notEmpty().withMessage('pushToken is required'),
    body('platform')
      .isIn(['ios', 'android', 'expo'])
      .withMessage('platform must be ios | android | expo'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { pushToken, platform } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const tags = buildTags(user, userId);

    // Upsert local registration record
    const registration = await DeviceRegistration.findOneAndUpdate(
      { user: userId, pushToken },
      { platform, tags, active: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Register with Azure Notification Hubs (best-effort)
    const client = await getNhClient();
    if (client) {
      try {
        let nhResult;
        if (platform === 'ios') {
          nhResult = await client.createOrUpdateRegistration({
            kind: 'Apple',
            deviceToken: pushToken,
            tags,
          });
        } else {
          // android or expo (Expo push tokens use FCM under the hood)
          nhResult = await client.createOrUpdateRegistration({
            kind: 'FcmLegacy',
            fcmRegistrationId: pushToken,
            tags,
          });
        }
        // Store the NH registration ID for later updates/deletions
        await DeviceRegistration.findByIdAndUpdate(registration._id, {
          nhRegistrationId: nhResult.registrationId ?? null,
        });
      } catch (err) {
        console.error('[notifications] NH registration error:', err.message);
      }
    }

    return res.status(201).json({ success: true, registrationId: registration._id, tags });
  }
);

// DELETE /api/notifications/register
router.delete(
  '/register',
  authMiddleware,
  [body('pushToken').trim().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const registration = await DeviceRegistration.findOneAndUpdate(
      { user: req.user.id, pushToken: req.body.pushToken },
      { active: false },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({ success: false, error: 'Registration not found.' });
    }

    // Remove from Azure Notification Hubs (best-effort)
    if (registration.nhRegistrationId) {
      const client = await getNhClient();
      if (client) {
        try {
          await client.deleteRegistration(registration.nhRegistrationId);
        } catch (err) {
          console.error('[notifications] NH deregistration error:', err.message);
        }
      }
    }

    return res.json({ success: true });
  }
);

// POST /api/notifications/send
// Send a push notification to a tag expression.
// Restricted to employer role (or adapt to your admin check).
router.post(
  '/send',
  authMiddleware,
  [
    body('tagExpression').trim().notEmpty().withMessage('tagExpression is required'),
    body('title').trim().notEmpty().withMessage('title is required'),
    body('body').trim().notEmpty().withMessage('body is required'),
    body('data').optional().isObject(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const client = await getNhClient();
    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'Azure Notification Hubs is not configured on this server.',
      });
    }

    const { tagExpression, title, body: msgBody, data } = req.body;

    try {
      // Send to both FCM (Android/Expo) and APNs (iOS) in parallel
      const [fcmSettled, apnsSettled] = await Promise.allSettled([
        client.sendNotification(
          {
            kind: 'FcmLegacy',
            body: JSON.stringify({
              notification: { title, body: msgBody },
              data: data ?? {},
            }),
          },
          { tagExpression }
        ),
        client.sendNotification(
          {
            kind: 'Apple',
            body: JSON.stringify({
              aps: { alert: { title, body: msgBody }, sound: 'default' },
              ...(data ?? {}),
            }),
          },
          { tagExpression }
        ),
      ]);

      return res.json({
        success: true,
        tagExpression,
        fcm: fcmSettled.status === 'fulfilled' ? 'sent' : fcmSettled.reason?.message,
        apns: apnsSettled.status === 'fulfilled' ? 'sent' : apnsSettled.reason?.message,
      });
    } catch (err) {
      console.error('[notifications] send error:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

export default router;
