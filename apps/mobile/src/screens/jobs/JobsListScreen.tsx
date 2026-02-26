import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { apiClient } from '../../api/client';
import type { Job } from '../../api/types';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Tabs'>;

function JobCard({
  job,
  onPress,
}: {
  job: Job;
  onPress: (jobId: string) => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(job.id)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {job.title}
        </Text>
        {job.isBoosted && <Text style={styles.badge}>⭐ Destaque</Text>}
      </View>
      <Text style={styles.cardEmployer}>{job.employer}</Text>
      <Text style={styles.cardLocation} numberOfLines={1}>
        📍 {job.location}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardNiche}>{job.niche}</Text>
        <Text style={styles.cardPayment}>
          R$ {job.payment.toFixed(2)} / {job.paymentType}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function JobsListScreen({ navigation }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const result = await apiClient.getJobs();
      if (result.success && result.data) {
        setJobs(result.data);
      } else {
        Alert.alert('Erro', result.error ?? 'Falha ao carregar vagas.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  }, [fetchJobs]);

  const handleJobPress = useCallback(
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
      <Text style={styles.screenTitle}>Vagas Disponíveis</Text>
      <FlatList
        data={jobs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={handleJobPress} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhuma vaga disponível.</Text>
        }
      />
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
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
    margin: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    flex: 1,
  },
  badge: {
    fontSize: 12,
    color: '#f59e0b',
    marginLeft: 8,
  },
  cardEmployer: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 13,
    color: '#777',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardNiche: {
    fontSize: 12,
    color: '#1a1a2e',
    backgroundColor: '#e8e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cardPayment: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 48,
    fontSize: 16,
  },
});
