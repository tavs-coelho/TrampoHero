/**
 * Typed, validated access to Vite environment variables.
 *
 * Only VITE_* variables are exposed to the browser by Vite.
 * Import this module instead of accessing `import.meta.env` directly
 * so that missing configuration is caught at startup with a clear message.
 *
 * Usage:
 *   import { env } from '@/services/env';
 *   fetch(env.VITE_API_URL + '/jobs');
 */

interface FrontendEnv {
  /** Base URL for the backend API, e.g. "https://api.trampohero.com/api" */
  VITE_API_URL: string;
  /** Vite mode: "development" | "production" | "test" */
  MODE: string;
  DEV: boolean;
  PROD: boolean;
}

function loadEnv(): FrontendEnv {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) {
    const msg =
      'VITE_API_URL is not set.\n' +
      'Copy .env.example to .env.local and set VITE_API_URL to your backend URL.\n' +
      'Example: VITE_API_URL=http://localhost:5000/api';

    // In production crash loudly; in development log a warning but continue
    // (the dev server proxy on /api may still work).
    if (import.meta.env.PROD) {
      throw new Error(msg);
    } else {
      console.warn(`[env] ${msg}`);
    }
  }

  return {
    VITE_API_URL: apiUrl || '/api',
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  };
}

export const env = loadEnv();
