import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getToken, saveAuth, clearAuth, AuthUser } from '../config/auth';

interface AuthContextValue {
  isLoggedIn: boolean;
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    getToken().then((token) => setIsLoggedIn(!!token));
  }, []);

  const login = async (token: string, user: AuthUser) => {
    await saveAuth(token, user);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await clearAuth();
    setIsLoggedIn(false);
  };

  if (isLoggedIn === null) return null; // splash / loading

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
