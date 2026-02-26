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
validateEnv();

export const env = {
  PORT: parseInt(process.env.PORT ?? '5000', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE ?? '30d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
  RATE_LIMIT_MAX: parsePositiveInt(process.env.RATE_LIMIT_MAX, 'RATE_LIMIT_MAX', 100),
  // Azure Blob Storage (required for photo upload endpoints)
  AZURE_STORAGE_ACCOUNT_NAME: process.env.AZURE_STORAGE_ACCOUNT_NAME ?? '',
  AZURE_STORAGE_ACCOUNT_KEY: process.env.AZURE_STORAGE_ACCOUNT_KEY ?? '',
  AZURE_STORAGE_CONTAINER_NAME: process.env.AZURE_STORAGE_CONTAINER_NAME ?? 'uploads',
  /** Comma-separated list of allowed CORS origins, e.g. "http://localhost:3000,https://app.trampohero.com.br" */
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:3000',
};
