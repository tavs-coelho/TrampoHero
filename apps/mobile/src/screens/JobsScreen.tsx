import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { api } from '../config/api';
import { getToken } from '../config/auth';

interface Job {
  _id: string;
  title: string;
  description: string;
  location: string;
  salary: number;
  niche: string;
  status: string;
}

export default function JobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        const data = await api.get<{ jobs: Job[] }>('/jobs', token ?? undefined);
        setJobs(data.jobs ?? []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar vagas.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={jobs}
      keyExtractor={(item) => item._id}
      ListHeaderComponent={<Text style={styles.header}>Vagas disponíveis</Text>}
      ListEmptyComponent={
        <Text style={styles.empty}>Nenhuma vaga disponível no momento.</Text>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} activeOpacity={0.8}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardNiche}>{item.niche}</Text>
          <Text style={styles.cardMeta}>
            {item.location} · R$ {item.salary}
          </Text>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  empty: { color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', marginTop: 40 },
  errorText: { color: '#EF4444', textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  cardNiche: { fontSize: 12, color: '#7C3AED', marginTop: 2, fontWeight: '500' },
  cardMeta: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  cardDesc: { fontSize: 13, color: '#374151', marginTop: 6, lineHeight: 18 },
});
