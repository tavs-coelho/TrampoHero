import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { apiClient } from '../../api/client';
import type { Job, LatLng } from '../../api/types';
import type { AppTabParamList, RootStackParamList } from '../../navigation/AppNavigator';

// Fallback mock coordinates (São Paulo area) for jobs without valid coordinates
const MOCK_COORDS: LatLng[] = [
  { lat: -23.5505, lng: -46.6333 },
  { lat: -23.5629, lng: -46.6544 },
  { lat: -23.5477, lng: -46.6160 },
  { lat: -23.5735, lng: -46.6250 },
  { lat: -23.5432, lng: -46.6450 },
  { lat: -23.5800, lng: -46.6500 },
  { lat: -23.5590, lng: -46.6700 },
  { lat: -23.5350, lng: -46.6200 },
];

function isValidCoord(coord: LatLng | undefined | null): boolean {
  return (
    coord != null &&
    typeof coord.lat === 'number' &&
    typeof coord.lng === 'number' &&
    !isNaN(coord.lat) &&
    !isNaN(coord.lng) &&
    (coord.lat !== 0 || coord.lng !== 0)
  );
}

function getFallbackCoord(jobId: string, index: number): LatLng {
  const hash = jobId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return MOCK_COORDS[(hash + index) % MOCK_COORDS.length];
}

type MapNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Map'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const DEFAULT_REGION = {
  latitude: -23.55,
  longitude: -46.63,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

// Use Google Maps on Android, default native maps (Apple Maps) on iOS.
const MAP_PROVIDER = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;

export function MapScreen() {
  const navigation = useNavigation<MapNavProp>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const mapRef = useRef<MapView>(null);

  // Request foreground location permission on mount
  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      setLocationGranted(status === 'granted');
    });
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      const result = await apiClient.getJobs({ status: 'open' });
      if (result.success && result.data) {
        setJobs(result.data);
      } else {
        Alert.alert('Erro', result.error ?? 'Falha ao carregar vagas no mapa.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleMarkerPress = useCallback(
    (jobId: string) => {
      navigation.navigate('JobDetail', { jobId });
    },
    [navigation],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a1a2e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mapa de Vagas</Text>
      {locationGranted === false && (
        <Text style={styles.locationWarning}>
          📍 Permissão de localização negada – sua posição não será exibida.
        </Text>
      )}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={MAP_PROVIDER}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={locationGranted === true}
        showsMyLocationButton={locationGranted === true}
      >
        {jobs.map((job, index) => {
          const coord = isValidCoord(job.coordinates)
            ? job.coordinates
            : getFallbackCoord(job.id, index);
          return (
            <Marker
              key={job.id}
              coordinate={{
                latitude: coord.lat,
                longitude: coord.lng,
              }}
              title={job.title}
              description={`${job.employer} · R$ ${job.payment.toFixed(2)}/${job.paymentType}`}
              pinColor={job.isBoosted ? '#f59e0b' : '#1a1a2e'}
              onPress={() => handleMarkerPress(job.id)}
            />
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
    margin: 16,
  },
  locationWarning: {
    fontSize: 12,
    color: '#92400e',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  map: {
    flex: 1,
  },
});
