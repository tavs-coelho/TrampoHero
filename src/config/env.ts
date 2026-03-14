/**
 * Frontend environment configuration with runtime validation.
 *
 * All public variables must use the VITE_ prefix so that Vite exposes them
 * via import.meta.env. Secret keys (e.g. GEMINI_API_KEY) must NEVER be placed
 * here — they belong in the backend environment only.
 *
 * AI features (Gemini) are proxied through the backend at /api/ai/generate.
 * The GEMINI_API_KEY is never exposed to the browser.
 */

interface FrontendEnv {
  /** Backend API base URL */
  VITE_API_URL: string;
  /** Application name, defaults to "TrampoHero" */
  VITE_APP_NAME: string;
  /** Stripe publishable key (safe to expose – identifies the account, not the secret) */
  VITE_STRIPE_PUBLISHABLE_KEY: string;
}

function getEnv(): FrontendEnv {
  const VITE_API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5000/api';
  const VITE_APP_NAME = (import.meta.env.VITE_APP_NAME as string | undefined) ?? 'TrampoHero';
  const VITE_STRIPE_PUBLISHABLE_KEY = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined) ?? '';

  return {
    VITE_API_URL,
    VITE_APP_NAME,
    VITE_STRIPE_PUBLISHABLE_KEY,
  };
}

export const env = getEnv();
