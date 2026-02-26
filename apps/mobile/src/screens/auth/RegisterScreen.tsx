import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../../contexts/AuthContext';
import type { AuthStackParamList } from '../../navigation/AppNavigator';
import type { Niche, UserRole } from '../../api/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const NICHES: Niche[] = ['Gastronomia', 'Construção', 'Eventos', 'Serviços Gerais'];

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('freelancer');
  const [niche, setNiche] = useState<Niche | ''>('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    setLoading(true);
    const error = await register(
      email.trim(),
      password,
      name.trim(),
      role,
      niche || undefined,
    );
    setLoading(false);
    if (error) {
      Alert.alert('Erro no Cadastro', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>TrampoHero</Text>
        <Text style={styles.subtitle}>Criar conta</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome completo"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Tipo de conta</Text>
        <View style={styles.roleRow}>
          {(['freelancer', 'employer'] as UserRole[]).map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.roleButton, role === r && styles.roleButtonActive]}
              onPress={() => setRole(r)}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  role === r && styles.roleButtonTextActive,
                ]}
              >
                {r === 'freelancer' ? 'Freelancer' : 'Empregador'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {role === 'freelancer' && (
          <>
            <Text style={styles.label}>Área de atuação</Text>
            {NICHES.map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.nicheButton, niche === n && styles.nicheButtonActive]}
                onPress={() => setNiche(n)}
              >
                <Text
                  style={[
                    styles.nicheButtonText,
                    niche === n && styles.nicheButtonTextActive,
                  ]}
                >
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Criar conta</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.link}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>Já tem conta? Entrar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  roleButtonActive: {
    borderColor: '#1a1a2e',
    backgroundColor: '#1a1a2e',
  },
  roleButtonText: {
    color: '#333',
    fontSize: 14,
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  nicheButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  nicheButtonActive: {
    borderColor: '#1a1a2e',
    backgroundColor: '#e8e8f0',
  },
  nicheButtonText: {
    color: '#333',
    fontSize: 14,
  },
  nicheButtonTextActive: {
    color: '#1a1a2e',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#1a1a2e',
    fontSize: 14,
  },
});
