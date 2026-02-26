/**
 * Frontend environment configuration with runtime validation.
 *
 * All public variables must use the VITE_ prefix so that Vite exposes them
 * via import.meta.env. Secret keys (e.g. GEMINI_API_KEY) must never be placed
 * here — they belong in the backend environment only.
 */

interface FrontendEnv {
  /** Google Gemini API key – used client-side for AI features */
  VITE_GEMINI_API_KEY: string;
  /** Backend API base URL */
  VITE_API_URL: string;
  /** Application name, defaults to "TrampoHero" */
  VITE_APP_NAME: string;
}

function getEnv(): FrontendEnv {
  const VITE_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const VITE_API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5000/api';
  const VITE_APP_NAME = (import.meta.env.VITE_APP_NAME as string | undefined) ?? 'TrampoHero';

  const missing: string[] = [];

  if (!VITE_GEMINI_API_KEY) {
    missing.push('VITE_GEMINI_API_KEY');
  }

  if (missing.length > 0) {
    const msg =
      `[TrampoHero] Missing required environment variables: ${missing.join(', ')}.\n` +
      'Copy .env.example to .env.local and fill in the values.';
    // In development (but not test), throw so the developer sees the error immediately.
    // In production, log a warning and continue so the app can still load.
    if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
      throw new Error(msg);
    } else {
      console.warn(msg);
    }
  }

  return {
    VITE_GEMINI_API_KEY: VITE_GEMINI_API_KEY ?? '',
    VITE_API_URL,
    VITE_APP_NAME,
  };
}

export const env = getEnv();
