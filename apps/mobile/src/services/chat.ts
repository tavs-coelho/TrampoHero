import { apiClient } from '../api/client';
import type { Message } from '../api/types';

type MessageHandler = (message: Message) => void;

interface ChatClient {
  connect: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  disconnect: () => void;
}

const WEB_PUBSUB_URL = process.env.EXPO_PUBLIC_WEB_PUBSUB_URL ?? '';

/**
 * Create a chat client for a specific job channel.
 *
 * Integration: Azure Web PubSub
 * - The backend provides a client access URL via `GET /api/jobs/:jobId/chat-token`.
 * - The client connects via WebSocket and receives/sends JSON messages.
 * - If the backend stub is not yet available, the client operates in a
 *   no-op / mock mode and logs a warning.
 *
 * Message format expected from the server:
 * ```json
 * {
 *   "id": "uuid",
 *   "senderId": "userId",
 *   "senderName": "Name",
 *   "text": "Hello",
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 * ```
 */
export function createChatClient(
  jobId: string,
  onMessage: MessageHandler,
): ChatClient {
  let ws: WebSocket | null = null;

  const connect = async (): Promise<void> => {
    // Obtain a short-lived access URL from the backend
    const result = await apiClient.getChatAccessUrl(jobId);
    const accessUrl = result.data?.url ?? WEB_PUBSUB_URL;

    if (!accessUrl) {
      console.warn('[chat] No Web PubSub URL available. Running in stub mode.');
      return;
    }

    ws = new WebSocket(accessUrl);

    ws.onmessage = event => {
      try {
        const msg: Message = JSON.parse(event.data as string);
        onMessage(msg);
      } catch {
        console.warn('[chat] Failed to parse incoming message:', event.data);
      }
    };

    await new Promise<void>((resolve, reject) => {
      if (!ws) return resolve();
      ws.onopen = () => {
        // Re-attach a non-throwing error handler once connected
        if (ws) {
          ws.onerror = error => {
            console.error('[chat] WebSocket error:', error);
          };
        }
        resolve();
      };
      ws.onerror = () => reject(new Error('WebSocket connection failed'));
    });
  };

  const sendMessage = async (text: string): Promise<void> => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('[chat] WebSocket not connected. Message not sent.');
      return;
    }
    ws.send(JSON.stringify({ type: 'message', text }));
  };

  const disconnect = (): void => {
    if (ws) {
      ws.close();
      ws = null;
    }
  };

  return { connect, sendMessage, disconnect };
}
