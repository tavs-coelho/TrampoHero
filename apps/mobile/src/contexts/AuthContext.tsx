import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { apiClient } from '../api/client';
import type { User } from '../api/types';

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
    (async () => {
      await apiClient.init();
      const token = apiClient.getToken();
      if (token) {
        const result = await apiClient.getProfile();
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
