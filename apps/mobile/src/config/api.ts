import Constants from 'expo-constants';

const apiBaseUrl: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'http://localhost:5000/api';

/** Shared API client for TrampoHero mobile. */
export const api = {
  baseUrl: apiBaseUrl,

  /** Build a full API URL from a path segment, e.g. `/auth/login`. */
  url(path: string): string {
    return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  },

  async get<T = unknown>(path: string, token?: string): Promise<T> {
    const res = await fetch(this.url(path), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
    return json as T;
  },

  async post<T = unknown>(path: string, body: unknown, token?: string): Promise<T> {
    const res = await fetch(this.url(path), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
    return json as T;
  },
};
