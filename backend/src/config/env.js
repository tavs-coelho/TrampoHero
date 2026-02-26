/**
 * Backend environment configuration with runtime validation.
 *
 * Import this module early in server.js so that missing variables are caught
 * before any route handlers are registered.
 *
 * Usage:
 *   import { env } from './config/env.js';
 *   mongoose.connect(env.MONGODB_URI);
 */

import dotenv from 'dotenv';
dotenv.config();

const REQUIRED = ['JWT_SECRET', 'MONGODB_URI'];

function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `[TrampoHero Backend] Missing required environment variables: ${missing.join(', ')}.\n` +
        'Copy backend/.env.example to backend/.env and fill in the values.'
    );
    process.exit(1);
  }
}

validateEnv();

export const env = {
  PORT: parseInt(process.env.PORT ?? '5000', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE ?? '30d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
  /** Comma-separated list of allowed CORS origins, e.g. "http://localhost:3000,https://app.trampohero.com.br" */
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:3000',

  // ── Azure Blob Storage (PR 3: SAS uploads) ──────────────────────────────────
  /** Azure Storage account name (optional – SAS upload endpoints disabled when absent). */
  AZURE_STORAGE_ACCOUNT_NAME: process.env.AZURE_STORAGE_ACCOUNT_NAME ?? '',
  /** Azure Storage account key (keep in Key Vault in production). */
  AZURE_STORAGE_ACCOUNT_KEY: process.env.AZURE_STORAGE_ACCOUNT_KEY ?? '',
  /** Blob container name for user-uploaded files. */
  AZURE_STORAGE_CONTAINER_NAME: process.env.AZURE_STORAGE_CONTAINER_NAME ?? 'uploads',

  // ── Azure Web PubSub (PR 4: chat) ───────────────────────────────────────────
  /** Web PubSub connection string (optional – real-time chat disabled when absent). */
  WEB_PUBSUB_CONNECTION_STRING: process.env.WEB_PUBSUB_CONNECTION_STRING ?? '',
  /** Web PubSub hub name. */
  WEB_PUBSUB_HUB_NAME: process.env.WEB_PUBSUB_HUB_NAME ?? 'chat',

  // ── Azure Notification Hubs (PR 5: push notifications) ──────────────────────
  /** Notification Hubs connection string (optional – push disabled when absent). */
  NH_CONNECTION_STRING: process.env.NH_CONNECTION_STRING ?? '',
  /** Notification Hub name. */
  NH_HUB_NAME: process.env.NH_HUB_NAME ?? 'trampohero',
};
