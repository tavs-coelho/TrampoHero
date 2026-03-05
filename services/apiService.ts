const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: { msg: string }[];
  count?: number;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('trampoHeroToken');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('trampoHeroToken', token);
    } else {
      localStorage.removeItem('trampoHeroToken');
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

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.errors?.[0]?.msg || 'An error occurred',
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

  private handleAuthResponse(result: ApiResponse<unknown>): void {
    if (result.success) {
      const token = (result as unknown as { token: string }).token;
      if (token) {
        this.setToken(token);
      }
    }
  }

  // Auth
  async register(email: string, password: string, name: string, role: string, niche?: string) {
    const result = await this.request<{ token: string; user: { id: string; email: string; name: string; role: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role, niche }),
    });
    this.handleAuthResponse(result);
    return result;
  }

  async login(email: string, password: string) {
    const result = await this.request<{ token: string; user: { id: string; email: string; name: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.handleAuthResponse(result);
    return result;
  }

  logout(): void {
    this.setToken(null);
  }

  // Jobs
  async getJobs(filters?: { niche?: string; status?: string; location?: string }) {
    const params = new URLSearchParams();
    if (filters?.niche) params.set('niche', filters.niche);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.location) params.set('location', filters.location);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/jobs${query}`);
  }

  async getJob(id: string) {
    return this.request(`/jobs/${id}`);
  }

  async createJob(jobData: Record<string, unknown>) {
    return this.request('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  async updateJob(id: string, updates: Record<string, unknown>) {
    return this.request(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async applyToJob(id: string) {
    return this.request(`/jobs/${id}/apply`, {
      method: 'POST',
    });
  }

  // User Profile
  async getProfile() {
    return this.request('/users/profile');
  }

  async updateProfile(updates: Record<string, unknown>) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Wallet
  async getWalletBalance() {
    return this.request('/wallet/balance');
  }

  async getTransactions() {
    return this.request('/wallet/transactions');
  }

  async deposit(amount: number, paymentMethod: string) {
    return this.request('/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod }),
    });
  }

  async withdraw(amount: number, pixKey: string) {
    return this.request('/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, pixKey }),
    });
  }

  // Challenges
  async getChallenges() {
    return this.request('/challenges');
  }

  async claimChallengeReward(id: string) {
    return this.request(`/challenges/${id}/claim`, {
      method: 'POST',
    });
  }

  // Rankings
  async getRankings(niche?: string) {
    const query = niche ? `?niche=${niche}` : '';
    return this.request(`/ranking${query}`);
  }

  // Store
  async getProducts(filters?: { category?: string; niche?: string }) {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.niche) params.set('niche', filters.niche);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/store/products${query}`);
  }

  async createOrder(products: { productId: string; quantity: number }[]) {
    return this.request('/store/orders', {
      method: 'POST',
      body: JSON.stringify({ products }),
    });
  }

  // Payments
  async createPaymentIntent(amount: number) {
    return this.request<{ paymentIntentId: string; clientSecret: string }>('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  // KYC (Identity Verification)
  async getKycStatus() {
    return this.request('/kyc/status');
  }

  async submitKycDocuments(documentFront: File, documentBack: File, selfie: File) {
    const formData = new FormData();
    formData.append('documentFront', documentFront);
    formData.append('documentBack', documentBack);
    formData.append('selfie', selfie);

    try {
      const response = await fetch(`${API_BASE_URL}/kyc/submit`, {
        method: 'POST',
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'An error occurred' };
      }
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
}

export const apiService = new ApiService();
