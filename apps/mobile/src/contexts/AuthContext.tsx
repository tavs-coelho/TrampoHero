import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { apiClient } from '../api/client';
import type { User } from '../api/types';
import {
  buildNotificationTags,
  configureForegroundNotifications,
  registerForPushNotifications,
} from '../services/notifications';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<string | null>;
  register: (
    email: string,
    password: string,
    name: string,
    role: string,
    niche?: string,
  ) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  useEffect(() => {
    configureForegroundNotifications();
    (async () => {
      await apiClient.init();
      const token = apiClient.getToken();
      if (token) {
        const result = await apiClient.getProfile();
        if (result.data) {
          const { id, role, niche } = result.data;
          const tags = buildNotificationTags(id, role, niche);
          registerForPushNotifications(id, tags).catch(() => {});
        }
        setState({
          user: result.data ?? null,
          token,
          isLoading: false,
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    })();
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      const result = await apiClient.login(email, password);
      if (result.success && result.data) {
        setState({
          user: result.data.user,
          token: result.data.token,
          isLoading: false,
        });
        const { id, role, niche } = result.data.user;
        const tags = buildNotificationTags(id, role, niche);
        registerForPushNotifications(id, tags).catch(() => {});
        return null;
      }
      return result.error ?? 'Login failed';
    },
    [],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      role: string,
      niche?: string,
    ): Promise<string | null> => {
      const result = await apiClient.register(email, password, name, role, niche);
      if (result.success && result.data) {
        setState({
          user: result.data.user,
          token: result.data.token,
          isLoading: false,
        });
        const { id, role: userRole, niche: userNiche } = result.data.user;
        const tags = buildNotificationTags(id, userRole, userNiche);
        registerForPushNotifications(id, tags).catch(() => {});
        return null;
      }
      return result.error ?? 'Registration failed';
    },
    [],
  );

  const logout = useCallback(async () => {
    await apiClient.logout();
    setState({ user: null, token: null, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
