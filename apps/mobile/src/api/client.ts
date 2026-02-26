import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  ApiResponse,
  AuthTokenPayload,
  CheckInPayload,
  Job,
  PhotoUploadSasResponse,
  PushRegistrationPayload,
  User,
} from './types';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api';

const TOKEN_KEY = 'trampoHeroToken';

class MobileApiClient {
  private token: string | null = null;

  async init(): Promise<void> {
    this.token = await AsyncStorage.getItem(TOKEN_KEY);
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async setToken(token: string | null): Promise<void> {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: this.getHeaders(),
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            data.error ??
            data.errors?.[0]?.msg ??
            'An error occurred',
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // ── Auth ──────────────────────────────────────────────────────

  async register(
    email: string,
    password: string,
    name: string,
    role: string,
    niche?: string,
  ): Promise<ApiResponse<AuthTokenPayload>> {
    const result = await this.request<AuthTokenPayload>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role, niche }),
    });
    if (result.success && result.data?.token) {
      await this.setToken(result.data.token);
    }
    return result;
  }

  async login(
    email: string,
    password: string,
  ): Promise<ApiResponse<AuthTokenPayload>> {
    const result = await this.request<AuthTokenPayload>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.success && result.data?.token) {
      await this.setToken(result.data.token);
    }
    return result;
  }

  async logout(): Promise<void> {
    await this.setToken(null);
  }

  // ── Jobs ──────────────────────────────────────────────────────

  async getJobs(filters?: {
    niche?: string;
    status?: string;
    location?: string;
  }): Promise<ApiResponse<Job[]>> {
    const params = new URLSearchParams();
    if (filters?.niche) params.set('niche', filters.niche);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.location) params.set('location', filters.location);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Job[]>(`/jobs${query}`);
  }

  async getJob(id: string): Promise<ApiResponse<Job>> {
    return this.request<Job>(`/jobs/${id}`);
  }

  async applyToJob(id: string): Promise<ApiResponse<unknown>> {
    return this.request(`/jobs/${id}/apply`, { method: 'POST' });
  }

  async checkInJob(payload: CheckInPayload): Promise<ApiResponse<unknown>> {
    return this.request(`/jobs/${payload.jobId}/checkin`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ── User Profile ──────────────────────────────────────────────

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<User>('/users/profile');
  }

  async updateProfile(
    updates: Record<string, unknown>,
  ): Promise<ApiResponse<User>> {
    return this.request<User>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // ── Photo Upload ──────────────────────────────────────────────

  /**
   * Request a SAS URL from the backend to upload a photo directly
   * to Azure Blob Storage.
   */
  async getPhotoUploadSasUrl(
    jobId: string,
    fileName: string,
  ): Promise<ApiResponse<PhotoUploadSasResponse>> {
    return this.request<PhotoUploadSasResponse>('/jobs/upload-sas', {
      method: 'POST',
      body: JSON.stringify({ jobId, fileName }),
    });
  }

  // ── Push Notifications ────────────────────────────────────────

  async registerPushDevice(
    payload: PushRegistrationPayload,
  ): Promise<ApiResponse<unknown>> {
    return this.request('/users/push-device', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ── Chat ──────────────────────────────────────────────────────

  /**
   * Obtain a Web PubSub client access URL for the given job/channel.
   */
  async getChatAccessUrl(jobId: string): Promise<ApiResponse<{ url: string }>> {
    return this.request<{ url: string }>(`/jobs/${jobId}/chat-token`);
  }
}

export const apiClient = new MobileApiClient();
