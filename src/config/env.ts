/**
 * Frontend environment configuration with runtime validation.
 *
 * All public variables must use the VITE_ prefix so that Vite exposes them
 * via import.meta.env. Secret keys (e.g. GEMINI_API_KEY) must never be placed
 * here — they belong in the backend environment only.
 */

interface FrontendEnv {
  /** Backend API base URL */
  VITE_API_URL: string;
  /** Application name, defaults to "TrampoHero" */
  VITE_APP_NAME: string;
}

function getEnv(): FrontendEnv {
  const VITE_API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5000/api';
  const VITE_APP_NAME = (import.meta.env.VITE_APP_NAME as string | undefined) ?? 'TrampoHero';

  if (!import.meta.env.VITE_API_URL) {
    const msg =
      '[TrampoHero] VITE_API_URL is not set.\n' +
      'Copy .env.example to .env.local and set VITE_API_URL to your backend URL.\n' +
      'Example: VITE_API_URL=http://localhost:5000/api';
    if (import.meta.env.PROD) {
      throw new Error(msg);
    } else {
      console.warn(msg);
    }
  }

  return {
    VITE_API_URL,
    VITE_APP_NAME,
  };
}

export const env = getEnv();
