import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { apiClient } from '../api/client';
import type { PushInstallationPayload } from '../api/types';

const INSTALLATION_ID_KEY = 'trampoHeroInstallationId';

/** Returns the stable installation ID for this device, creating one if needed. */
async function getOrCreateInstallationId(): Promise<string> {
  let id = await AsyncStorage.getItem(INSTALLATION_ID_KEY);
  if (!id) {
    // Simple RFC-4122 v4 UUID without external dependencies
    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    await AsyncStorage.setItem(INSTALLATION_ID_KEY, id);
  }
  return id;
}

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
 * Register this device for push notifications and sync the installation with
 * Azure Notification Hubs via the backend.
 *
 * Tags are used for audience targeting (e.g. role + niche segments).
 *
 * Android note: FCM v1 integration is configured via `google-services.json`
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

  let pushToken: string | undefined;
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const expoPushToken = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    pushToken = expoPushToken.data;
  } catch (err) {
    console.error('[notifications] Failed to obtain push token:', err);
    return null;
  }

  const installationId = await getOrCreateInstallationId();
  const platform: PushInstallationPayload['platform'] =
    Platform.OS === 'ios' ? 'apns' : 'fcmv1';

  // Register the device installation with the backend (which relays to Azure ANH)
  const payload: PushInstallationPayload = {
    installationId,
    platform,
    pushToken,
    tags,
  };

  const result = await apiClient.registerPushInstallation(payload);
  if (!result.success) {
    console.warn('[notifications] Failed to register with backend:', result.error);
    // Return the token even if backend registration failed so the app can still receive
    // Expo-mediated push notifications during development.
  }

  return pushToken;
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
  const tags = [`role:${role}`];
  if (niche) tags.push(`niche:${niche}`);
  return tags;
}
