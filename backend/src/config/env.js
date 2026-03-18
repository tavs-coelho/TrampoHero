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

// Optional env vars that have safe defaults
// SMTP_* – required only when EMAIL_ENABLED=true

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

function parsePositiveInt(value, name, defaultValue) {
  const parsed = parseInt(value ?? String(defaultValue), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.error(
      `[TrampoHero Backend] Invalid value for ${name}: "${value}". Must be a positive integer. Using default: ${defaultValue}.`
    );
    return defaultValue;
  }
  return parsed;
}

validateEnv();

export const env = {
  PORT: parsePositiveInt(process.env.PORT, 'PORT', 5000),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE ?? '1h',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? (() => {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[TrampoHero Backend] JWT_REFRESH_SECRET is not set. Set a dedicated secret in production.');
    }
    // Derive a distinct secret so it is not identical to JWT_SECRET, while still
    // working out-of-the-box in development without extra config.
    return (process.env.JWT_SECRET ?? '') + '_refresh_trampohero';
  })(),
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE ?? '30d',
  // Auth rate limiting
  AUTH_RATE_LIMIT_MAX: parsePositiveInt(process.env.AUTH_RATE_LIMIT_MAX, 'AUTH_RATE_LIMIT_MAX', 10),
  AUTH_RATE_LIMIT_WINDOW_MS: parsePositiveInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 'AUTH_RATE_LIMIT_WINDOW_MS', 900000),
  // Email (SMTP) – optional; features degrade gracefully when not configured
  EMAIL_ENABLED: process.env.EMAIL_ENABLED === 'true',
  SMTP_HOST: process.env.SMTP_HOST ?? '',
  SMTP_PORT: parsePositiveInt(process.env.SMTP_PORT, 'SMTP_PORT', 587),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER ?? '',
  SMTP_PASS: process.env.SMTP_PASS ?? '',
  EMAIL_FROM: process.env.EMAIL_FROM ?? 'noreply@trampohero.com.br',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  RATE_LIMIT_MAX: parsePositiveInt(process.env.RATE_LIMIT_MAX, 'RATE_LIMIT_MAX', 100),
  // Azure Blob Storage (required for photo upload endpoints)
  AZURE_STORAGE_ACCOUNT_NAME: process.env.AZURE_STORAGE_ACCOUNT_NAME ?? '',
  AZURE_STORAGE_ACCOUNT_KEY: process.env.AZURE_STORAGE_ACCOUNT_KEY ?? '',
  AZURE_STORAGE_CONTAINER_NAME: process.env.AZURE_STORAGE_CONTAINER_NAME ?? 'uploads',
  // Azure Notification Hubs (required for push notification endpoints)
  ANH_CONNECTION_STRING: process.env.ANH_CONNECTION_STRING ?? '',
  ANH_HUB_NAME: process.env.ANH_HUB_NAME ?? '',
  // Azure Web PubSub (required for real-time chat token endpoint)
  AZURE_WEBPUBSUB_CONNECTION_STRING: process.env.AZURE_WEBPUBSUB_CONNECTION_STRING ?? '',
  AZURE_WEBPUBSUB_HUB_NAME: process.env.AZURE_WEBPUBSUB_HUB_NAME ?? '',
  /** Comma-separated list of allowed CORS origins, e.g. "http://localhost:3000,https://app.trampohero.com.br" */
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:3000',
};
