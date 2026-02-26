/**
 * Chat routes – conversations and messages, with Azure Web PubSub integration.
 *
 * REST endpoints:
 *   POST   /api/chat/conversations            – create or fetch a DM thread
 *   GET    /api/chat/conversations            – list my conversations
 *   GET    /api/chat/conversations/:id/messages – paginated message history
 *   POST   /api/chat/conversations/:id/messages – send a message
 *   GET    /api/chat/negotiate                – get a Web PubSub client access URL
 *
 * Real-time delivery:
 *   After a message is persisted, the server broadcasts it to the Web PubSub
 *   group named after the conversationId so both participants receive it instantly.
 *   Clients connect via the URL returned by GET /api/chat/negotiate.
 *
 * Web PubSub env vars (see backend/.env.example):
 *   WEB_PUBSUB_CONNECTION_STRING  – Azure portal → Web PubSub → Keys
 *   WEB_PUBSUB_HUB_NAME           – hub name configured in Azure (default: "chat")
 */

import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate as authMiddleware } from '../middleware/auth.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { env } from '../config/env.js';

const router = express.Router();

// ─── Web PubSub helpers ───────────────────────────────────────────────────────

/**
 * Lazily create a WebPubSubServiceClient only when the env var is present.
 * We import dynamically to avoid crashing the server when the Azure SDK is not
 * installed (it is an optional peer dependency).
 *
 * @returns {Promise<import('@azure/web-pubsub').WebPubSubServiceClient | null>}
 */
async function getPubSubClient() {
  if (!env.WEB_PUBSUB_CONNECTION_STRING) return null;
  try {
    const { WebPubSubServiceClient } = await import('@azure/web-pubsub');
    return new WebPubSubServiceClient(
      env.WEB_PUBSUB_CONNECTION_STRING,
      env.WEB_PUBSUB_HUB_NAME
    );
  } catch {
    console.warn('[chat] @azure/web-pubsub not installed – real-time disabled.');
    return null;
  }
}

/** Broadcast a new message to the conversation's Web PubSub group. */
async function broadcastMessage(conversationId, message) {
  const client = await getPubSubClient();
  if (!client) return;
  try {
    await client.group(String(conversationId)).sendToAll({
      type: 'new_message',
      message,
    });
  } catch (err) {
    console.error('[chat] Web PubSub broadcast error:', err.message);
  }
}

// ─── routes ──────────────────────────────────────────────────────────────────

// GET /api/chat/negotiate
// Returns a Web PubSub client access URL so the mobile/web client can open a WebSocket.
router.get('/negotiate', authMiddleware, async (req, res) => {
  const client = await getPubSubClient();
  if (!client) {
    return res.status(503).json({
      success: false,
      error: 'Real-time chat is not configured on this server.',
    });
  }

  const token = await client.getClientAccessToken({
    userId: String(req.user.id),
    roles: [`webpubsub.joinLeaveGroup`, `webpubsub.sendToGroup`],
  });

  return res.json({ success: true, url: token.url });
});

// POST /api/chat/conversations
// Find existing DM thread with `recipientId` or create one.
router.post(
  '/conversations',
  authMiddleware,
  [body('recipientId').isMongoId().withMessage('recipientId must be a valid user ID')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { recipientId } = req.body;
    const myId = req.user.id;

    if (String(myId) === recipientId) {
      return res.status(400).json({ success: false, error: 'Cannot start a conversation with yourself.' });
    }

    // Normalize participant order so [A,B] and [B,A] produce the same conversation
    const participantsSorted = [String(myId), recipientId].sort();

    // Find existing conversation between the two users
    let conversation = await Conversation.findOne({
      participants: { $all: participantsSorted, $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: participantsSorted,
      });
    }

    return res.status(201).json({ success: true, conversation });
  }
);

// GET /api/chat/conversations
// List all conversations for the authenticated user, newest first.
router.get('/conversations', authMiddleware, async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user.id,
  })
    .populate('participants', 'name email role')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 });

  return res.json({ success: true, conversations });
});

// GET /api/chat/conversations/:id/messages
// Paginated message history (newest first).
router.get(
  '/conversations/:id/messages',
  authMiddleware,
  [param('id').isMongoId()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Verify the user is a participant
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user.id,
    });
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found.' });
    }

    const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit ?? '30', 10)));

    const messages = await Message.find({ conversation: req.params.id })
      .populate('sender', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({ success: true, messages, page, limit });
  }
);

// POST /api/chat/conversations/:id/messages
// Send a message in a conversation.
router.post(
  '/conversations/:id/messages',
  authMiddleware,
  [
    param('id').isMongoId(),
    body('text').trim().notEmpty().isLength({ max: 2000 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Verify the user is a participant
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user.id,
    });
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found.' });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user.id,
      text: req.body.text,
    });

    // Update conversation's lastMessage pointer
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: message._id,
      lastMessageAt: message.createdAt,
    });

    const populated = await message.populate('sender', 'name');

    // Broadcast via Web PubSub (fire-and-forget)
    broadcastMessage(conversation._id, populated);

    return res.status(201).json({ success: true, message: populated });
  }
);

export default router;
