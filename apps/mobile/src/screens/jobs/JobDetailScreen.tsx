import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { apiClient } from '../../api/client';
import type { Job } from '../../api/types';
import { requestAndCheckIn } from '../../services/geolocation';
import { pickAndUploadPhoto } from '../../services/photoUpload';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetail'>;

export function JobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    apiClient
      .getJob(jobId)
      .then(result => {
        if (result.success && result.data) {
          setJob(result.data);
        } else {
          Alert.alert('Erro', result.error ?? 'Falha ao carregar vaga.');
        }
      })
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleApply = useCallback(async () => {
    setActionLoading(true);
    const result = await apiClient.applyToJob(jobId);
    setActionLoading(false);
    if (result.success) {
      Alert.alert('Sucesso', 'Candidatura enviada!');
    } else {
      Alert.alert('Erro', result.error ?? 'Falha ao candidatar.');
    }
  }, [jobId]);

  const handleCheckIn = useCallback(async () => {
    setActionLoading(true);
    const error = await requestAndCheckIn(jobId);
    setActionLoading(false);
    if (error) {
      Alert.alert('Erro no Check-in', error);
    } else {
      Alert.alert('Check-in realizado!', 'Sua localização foi registrada.');
    }
  }, [jobId]);

  const handleUploadPhoto = useCallback(async () => {
    setActionLoading(true);
    const error = await pickAndUploadPhoto(jobId);
    setActionLoading(false);
    if (error) {
      Alert.alert('Erro no Upload', error);
    } else {
      Alert.alert('Sucesso', 'Foto enviada como comprovante!');
    }
  }, [jobId]);

  const handleOpenChat = useCallback(() => {
    navigation.navigate('Chat', { jobId });
  }, [navigation, jobId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a1a2e" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Vaga não encontrada.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{job.title}</Text>
      <Text style={styles.employer}>{job.employer}</Text>

      <View style={styles.tagRow}>
        <Text style={styles.tag}>{job.niche}</Text>
        <Text style={styles.tag}>{job.status}</Text>
        {job.isBoosted && <Text style={styles.tagHighlight}>⭐ Destaque</Text>}
        {job.isEscrowGuaranteed && (
          <Text style={styles.tagHighlight}>🔒 Garantido</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Localização</Text>
        <Text style={styles.sectionValue}>📍 {job.location}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Data e hora</Text>
        <Text style={styles.sectionValue}>
          {job.date} às {job.startTime}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Remuneração</Text>
        <Text style={styles.paymentValue}>
          R$ {job.payment.toFixed(2)} / {job.paymentType}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Descrição</Text>
        <Text style={styles.description}>{job.description}</Text>
      </View>

      {job.status === 'open' && (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleApply}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Candidatar-se</Text>
          )}
        </TouchableOpacity>
      )}

      {job.status === 'ongoing' && (
        <>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleCheckIn}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>📍 Check-in</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, styles.secondaryButton]}
            onPress={handleUploadPhoto}
            disabled={actionLoading}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              📷 Enviar comprovante
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, styles.chatButton]}
            onPress={handleOpenChat}
          >
            <Text style={styles.buttonText}>💬 Chat com empregador</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#666',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  employer: {
    fontSize: 16,
    color: '#555',
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#e8e8f0',
    color: '#1a1a2e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
  },
  tagHighlight: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 15,
    color: '#333',
  },
  paymentValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#16a34a',
  },
  description: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1a1a2e',
  },
  chatButton: {
    backgroundColor: '#2563eb',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#1a1a2e',
  },
});
