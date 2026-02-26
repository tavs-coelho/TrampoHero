/**
 * useCapabilities – detect browser/device capability support.
 *
 * Returns a stable object of booleans so UI components can conditionally
 * render features like GPS check-in, photo proof, or push notifications
 * without coupling business logic to raw Web API checks.
 *
 * The checks are intentionally lightweight (synchronous where possible) so
 * the hook never suspends and can be called at the top of any component.
 */
import { useMemo } from 'react';

export interface DeviceCapabilities {
  /** Device has a camera accessible via MediaDevices.getUserMedia */
  hasCamera: boolean;
  /** Browser supports the Geolocation API */
  hasGeolocation: boolean;
  /** Browser supports the Push / Notification APIs */
  hasPush: boolean;
  /** Running in a secure context (HTTPS or localhost) – required for many APIs */
  isSecureContext: boolean;
  /** Service Workers are available (required for PWA offline & push) */
  hasServiceWorker: boolean;
}

export function useCapabilities(): DeviceCapabilities {
  return useMemo<DeviceCapabilities>(() => {
    const isSecureContext =
      typeof window !== 'undefined' ? window.isSecureContext : false;

    return {
      hasCamera:
        isSecureContext &&
        typeof navigator !== 'undefined' &&
        typeof navigator.mediaDevices?.getUserMedia === 'function',

      hasGeolocation:
        typeof navigator !== 'undefined' &&
        typeof navigator.geolocation?.getCurrentPosition === 'function',

      hasPush:
        isSecureContext &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        'serviceWorker' in navigator &&
        'PushManager' in window,

      isSecureContext,

      hasServiceWorker:
        typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    };
  }, []);
}
