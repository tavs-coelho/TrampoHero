import mongoose from 'mongoose';

/**
 * A conversation (direct message thread) between two users.
 */
const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    /** ID of the last message in this conversation (for list sorting). */
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Enforce exactly 2 participants and prevent duplicate conversations
conversationSchema.index({ participants: 1 });

export default mongoose.model('Conversation', conversationSchema);
