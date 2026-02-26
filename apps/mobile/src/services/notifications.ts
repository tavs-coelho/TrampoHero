import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { apiClient } from '../api/client';
import type { PushRegistrationPayload } from '../api/types';

/**
 * Configure the local notification handler (how notifications appear
 * while the app is in the foreground).
 */
export function configureForegroundNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Register this device for push notifications and sync the token with
 * Azure Notification Hubs via the backend.
 *
 * Tags are used for audience targeting (e.g. role + niche segments).
 *
 * Android note: FCM integration is configured via `google-services.json`
 * (see `apps/mobile/docs/android.md`).
 *
 * @param userId  Authenticated user ID to associate with the device.
 * @param tags    Array of tag strings for ANH targeting (e.g. `['role:freelancer', 'niche:Gastronomia']`).
 * @returns The Expo push token string, or null if registration failed.
 */
export async function registerForPushNotifications(
  userId: string,
  tags: string[],
): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[notifications] Push notifications require a physical device.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[notifications] Push notification permission denied.');
    return null;
  }

  // Create a dedicated Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('trampohero-default', {
      name: 'TrampoHero',
      description: 'Notificações de vagas e mensagens do TrampoHero',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1a1a2e',
      showBadge: true,
    });

    // Separate channel for new job alerts
    await Notifications.setNotificationChannelAsync('trampohero-jobs', {
      name: 'Novas Vagas',
      description: 'Alertas de novas vagas disponíveis',
      importance: Notifications.AndroidImportance.DEFAULT,
      showBadge: true,
    });
  }

  let token: string | undefined;
  try {
    const expoPushToken = await Notifications.getExpoPushTokenAsync();
    token = expoPushToken.data;
  } catch (err) {
    console.error('[notifications] Failed to obtain push token:', err);
    return null;
  }

  // Register the device token with the backend (which relays to Azure ANH)
  const payload: PushRegistrationPayload = {
    deviceToken: token,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    userId,
    tags,
  };

  const result = await apiClient.registerPushDevice(payload);
  if (!result.success) {
    console.warn('[notifications] Failed to register with backend:', result.error);
    // Return the token even if backend registration failed so the app can still receive
    // Expo-mediated push notifications during development.
  }

  return token;
}

/**
 * Build the standard tag array for a user based on their role and niche.
 * These tags are used by Azure Notification Hubs to target specific segments.
 */
export function buildNotificationTags(
  userId: string,
  role: string,
  niche?: string,
): string[] {
  const tags = [`userId:${userId}`, `role:${role}`];
  if (niche) tags.push(`niche:${niche}`);
  return tags;
}
