import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getUser, AuthUser } from '../config/auth';
import { useAuth } from '../config/AuthContext';

export default function ProfileScreen() {
  const { logout } = useAuth();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user?.name ?? '—'}</Text>
      <Text style={styles.email}>{user?.email ?? '—'}</Text>
      <Text style={styles.role}>
        {user?.role === 'freelancer' ? '🦸 Freelancer' : '🏢 Empregador'}
      </Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  name: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  email: { fontSize: 16, color: '#6B7280', marginTop: 8 },
  role: { fontSize: 18, color: '#7C3AED', marginTop: 12, fontWeight: '600' },
  logoutButton: {
    marginTop: 40,
    backgroundColor: '#EF4444',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});
