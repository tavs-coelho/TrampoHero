import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'trampohero_auth_token';
const USER_KEY = 'trampohero_user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'freelancer' | 'employer';
}

/** Persist the JWT and user profile to secure storage. */
export async function saveAuth(token: string, user: AuthUser): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

/** Retrieve the stored JWT (or null if not logged in). */
export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

/** Retrieve the stored user profile (or null if not logged in). */
export async function getUser(): Promise<AuthUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/** Remove stored credentials (logout). */
export async function clearAuth(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}
