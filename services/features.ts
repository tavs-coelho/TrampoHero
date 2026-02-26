/**
 * Feature flags and device capability checks.
 *
 * Centralises progressive-enhancement logic so that:
 *  - Future mobile clients can share and extend the same API surface.
 *  - Components never need to inline `navigator.*` checks.
 *  - Flags can be overridden for testing via URL search params
 *    (?flag_camera=1) or by adding a `featureFlags` key to localStorage.
 *
 * Usage:
 *   import { features, capabilities } from '@/services/features';
 *
 *   if (capabilities.geolocation) { ... }
 *   if (features.aiAssistant)     { ... }
 */

// ─── Device capability detection ─────────────────────────────────────────────

export interface DeviceCapabilities {
  /** Browser supports navigator.geolocation */
  geolocation: boolean;
  /** Browser supports MediaDevices.getUserMedia (camera/mic) */
  camera: boolean;
  /** Browser supports Web Push Notifications */
  pushNotifications: boolean;
  /** Browser supports the Payment Request API */
  paymentRequest: boolean;
  /** Connection is likely offline */
  offline: boolean;
}

function detectCapabilities(): DeviceCapabilities {
  return {
    geolocation: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    camera:
      typeof navigator !== 'undefined' &&
      'mediaDevices' in navigator &&
      'getUserMedia' in navigator.mediaDevices,
    pushNotifications:
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator,
    paymentRequest:
      typeof window !== 'undefined' && 'PaymentRequest' in window,
    offline: typeof navigator !== 'undefined' && !navigator.onLine,
  };
}

export const capabilities: DeviceCapabilities = detectCapabilities();

// ─── Feature flags ────────────────────────────────────────────────────────────

export interface FeatureFlags {
  /** AI-powered job insight cards */
  aiAssistant: boolean;
  /** GPS check-in / check-out validation */
  gpsCheckin: boolean;
  /** Photo proof upload for job completion */
  photoProof: boolean;
  /** In-app voice job creation */
  voiceJobCreation: boolean;
  /** Hero Prime subscription upsell */
  heroPrime: boolean;
  /** Hero Academy learning section */
  heroAcademy: boolean;
  /** In-app wallet / Hero Pay */
  wallet: boolean;
  /** Referral / invite program */
  referrals: boolean;
}

const DEFAULTS: FeatureFlags = {
  aiAssistant: true,
  gpsCheckin: true,
  photoProof: true,
  voiceJobCreation: true,
  heroPrime: true,
  heroAcademy: true,
  wallet: true,
  referrals: true,
};

/**
 * Reads overrides from localStorage key `featureFlags` (JSON object) and from
 * URL search params `?flag_<name>=0|1`.  Useful for staged roll-outs and QA.
 */
function loadFlags(): FeatureFlags {
  let overrides: Partial<FeatureFlags> = {};

  try {
    const stored = localStorage.getItem('featureFlags');
    if (stored) overrides = { ...overrides, ...(JSON.parse(stored) as Partial<FeatureFlags>) };
  } catch (err) {
    console.warn('[features] Could not parse featureFlags from localStorage:', err);
  }

  try {
    const params = new URLSearchParams(window.location.search);
    for (const key of Object.keys(DEFAULTS) as Array<keyof FeatureFlags>) {
      const param = params.get(`flag_${key}`);
      if (param !== null) {
        (overrides as Record<string, boolean>)[key] = param !== '0';
      }
    }
  } catch {
    // window.location not available — use defaults
  }

  return { ...DEFAULTS, ...overrides };
}

export const features: FeatureFlags = loadFlags();

/**
 * Convenience guard — disables a feature when the required capability is absent.
 * E.g. disable GPS check-in on devices without geolocation support.
 */
export function isFeatureAvailable(flag: keyof FeatureFlags): boolean {
  if (!features[flag]) return false;

  switch (flag) {
    case 'gpsCheckin':
      return capabilities.geolocation;
    case 'photoProof':
    case 'voiceJobCreation':
      return capabilities.camera;
    default:
      return true;
  }
}
