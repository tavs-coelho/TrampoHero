import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { api } from '../config/api';
import { getToken, getUser, AuthUser } from '../config/auth';

interface Job {
  _id: string;
  title: string;
  location: string;
  salary: number;
  niche: string;
}

export default function HomeScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [u, token] = await Promise.all([getUser(), getToken()]);
      setUser(u);
      if (token) {
        try {
          const data = await api.get<{ jobs: Job[] }>('/jobs?limit=3', token);
          setRecentJobs(data.jobs ?? []);
        } catch {
          // non-critical: ignore errors loading jobs
        }
      }
      setLoading(false);
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Olá, {user?.name ?? 'Herói'}! 👋</Text>
      <Text style={styles.subtitle}>Pronto para o próximo trampo?</Text>

      <Text style={styles.sectionTitle}>Oportunidades recentes</Text>
      {recentJobs.length === 0 ? (
        <Text style={styles.empty}>Nenhuma vaga disponível no momento.</Text>
      ) : (
        recentJobs.map((job) => (
          <View key={job._id} style={styles.card}>
            <Text style={styles.cardTitle}>{job.title}</Text>
            <Text style={styles.cardMeta}>{job.location} · R$ {job.salary}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 16 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 12 },
  empty: { color: '#9CA3AF', fontStyle: 'italic' },
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
  cardMeta: { fontSize: 13, color: '#6B7280', marginTop: 4 },
});
