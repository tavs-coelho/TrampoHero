/**
 * Feature flags for TrampoHero.
 *
 * Flags are resolved from VITE_ environment variables so they can be toggled
 * per deployment without a code change.  All flags default to `true` (on) so
 * the application works out-of-the-box without extra configuration.
 *
 * Usage:
 *   import { featureFlags } from '@/src/config/featureFlags';
 *   if (featureFlags.enableAI) { ... }
 */

function flag(envKey: string, defaultValue = true): boolean {
  const raw = import.meta.env[envKey];
  if (raw === undefined || raw === '') return defaultValue;
  return raw !== 'false' && raw !== '0';
}

export const featureFlags = {
  /** Google Gemini AI features (job insights, voice job creation, etc.) */
  enableAI: flag('VITE_FEATURE_AI'),

  /** GPS-based check-in / check-out validation */
  enableGeolocation: flag('VITE_FEATURE_GEOLOCATION'),

  /** Camera / photo proof capture */
  enableCamera: flag('VITE_FEATURE_CAMERA'),

  /** Push notification subscription flow */
  enablePush: flag('VITE_FEATURE_PUSH'),

  /** Hero Pay – receivables advance feature */
  enableHeroPay: flag('VITE_FEATURE_HERO_PAY'),

  /** Hero Prime subscription */
  enableHeroPrime: flag('VITE_FEATURE_HERO_PRIME'),

  /** Hero Academy courses */
  enableAcademy: flag('VITE_FEATURE_ACADEMY'),
} as const;

export type FeatureFlags = typeof featureFlags;
