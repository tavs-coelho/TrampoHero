import * as Location from 'expo-location';

import { apiClient } from '../api/client';

/**
 * Request foreground location permission, obtain current position,
 * and POST the check-in to the backend.
 *
 * @returns An error message string on failure, or null on success.
 */
export async function requestAndCheckIn(jobId: string): Promise<string | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return 'Permissão de localização negada. Acesse as configurações para habilitá-la.';
  }

  let coords: { latitude: number; longitude: number };
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    coords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch {
    return 'Não foi possível obter sua localização. Tente novamente.';
  }

  const result = await apiClient.checkInJob({
    jobId,
    latitude: coords.latitude,
    longitude: coords.longitude,
    timestamp: new Date().toISOString(),
  });

  if (!result.success) {
    return result.error ?? 'Falha ao registrar check-in.';
  }

  return null;
}
