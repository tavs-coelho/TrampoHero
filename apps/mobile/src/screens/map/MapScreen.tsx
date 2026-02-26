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

import { apiClient } from '../../api/client';
import type { Job } from '../../api/types';

const DEFAULT_REGION = {
  latitude: -23.55,
  longitude: -46.63,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

// Use Google Maps on Android, default native maps (Apple Maps) on iOS.
const MAP_PROVIDER = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;

export function MapScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  const fetchJobs = useCallback(async () => {
    const result = await apiClient.getJobs({ status: 'open' });
    if (result.success && result.data) {
      setJobs(result.data);
    } else {
      Alert.alert('Erro', result.error ?? 'Falha ao carregar vagas no mapa.');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchJobs().finally(() => setLoading(false));
  }, [fetchJobs]);

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
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={MAP_PROVIDER}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton
      >
        {jobs.map(job => (
          <Marker
            key={job.id}
            coordinate={{
              latitude: job.coordinates.lat,
              longitude: job.coordinates.lng,
            }}
            title={job.title}
            description={`${job.employer} · R$ ${job.payment.toFixed(2)}/${job.paymentType}`}
            pinColor={job.isBoosted ? '#f59e0b' : '#1a1a2e'}
          />
        ))}
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
  map: {
    flex: 1,
  },
});
