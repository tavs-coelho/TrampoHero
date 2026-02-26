import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService } from '../apiService';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
vi.stubGlobal('localStorage', mockLocalStorage);

beforeEach(() => {
  vi.clearAllMocks();
  apiService.setToken(null);
});

describe('ApiService', () => {
  describe('token management', () => {
    it('setToken stores token in localStorage', () => {
      apiService.setToken('test-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('trampoHeroToken', 'test-token');
    });

    it('setToken removes token when null', () => {
      apiService.setToken(null);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('trampoHeroToken');
    });

    it('getToken returns current token', () => {
      apiService.setToken('my-token');
      expect(apiService.getToken()).toBe('my-token');
    });

    it('logout clears token', () => {
      apiService.setToken('token');
      apiService.logout();
      expect(apiService.getToken()).toBeNull();
    });
  });

  describe('register', () => {
    it('sends POST request with user data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, token: 'new-token', data: { id: '1' } }),
      });
      const result = await apiService.register('test@test.com', 'pass', 'Name', 'freelancer');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('login', () => {
    it('sends POST request and stores token on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, token: 'login-token' }),
      });
      const result = await apiService.login('test@test.com', 'pass');
      expect(result.success).toBe(true);
      expect(apiService.getToken()).toBe('login-token');
    });

    it('returns error on failed login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      });
      const result = await apiService.login('test@test.com', 'wrong');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('network errors', () => {
    it('handles fetch failures gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const result = await apiService.login('test@test.com', 'pass');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('handles non-Error exceptions', async () => {
      mockFetch.mockRejectedValueOnce('unexpected');
      const result = await apiService.login('test@test.com', 'pass');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('jobs API', () => {
    it('getJobs fetches jobs list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
      const result = await apiService.getJobs();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/jobs'), expect.any(Object));
      expect(result.success).toBe(true);
    });

    it('getJobs includes filters in query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
      await apiService.getJobs({ niche: 'Eventos', status: 'open' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('niche=Eventos'),
        expect.any(Object)
      );
    });

    it('getJob fetches single job', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { id: 'j1' } }),
      });
      await apiService.getJob('j1');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/jobs/j1'), expect.any(Object));
    });

    it('createJob sends POST', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      await apiService.createJob({ title: 'Test' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('updateJob sends PUT', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      await apiService.updateJob('j1', { status: 'closed' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/j1'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('applyToJob sends POST', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      await apiService.applyToJob('j1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/j1/apply'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('user profile API', () => {
    it('getProfile fetches user profile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { id: 'u1' } }),
      });
      await apiService.getProfile();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/users/profile'), expect.any(Object));
    });

    it('updateProfile sends PUT', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      await apiService.updateProfile({ name: 'New Name' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/profile'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  describe('wallet API', () => {
    it('getWalletBalance fetches balance', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { balance: 500 } }),
      });
      await apiService.getWalletBalance();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/wallet/balance'), expect.any(Object));
    });

    it('deposit sends POST', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      await apiService.deposit(100, 'pix');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/wallet/deposit'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('withdraw sends POST', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      await apiService.withdraw(50, '11999999999');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/wallet/withdraw'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('getTransactions fetches transactions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
      await apiService.getTransactions();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/wallet/transactions'), expect.any(Object));
    });
  });

  describe('challenges API', () => {
    it('getChallenges fetches challenges', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
      await apiService.getChallenges();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/challenges'), expect.any(Object));
    });

    it('claimChallengeReward sends POST', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      await apiService.claimChallengeReward('wc1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/challenges/wc1/claim'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('rankings API', () => {
    it('getRankings fetches rankings', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
      await apiService.getRankings();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/ranking'), expect.any(Object));
    });

    it('getRankings includes niche filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
      await apiService.getRankings('Eventos');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('niche=Eventos'), expect.any(Object));
    });
  });

  describe('store API', () => {
    it('getProducts fetches products', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
      await apiService.getProducts();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/store/products'), expect.any(Object));
    });

    it('getProducts includes filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
      await apiService.getProducts({ category: 'uniform', niche: 'Eventos' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('category=uniform'),
        expect.any(Object)
      );
    });

    it('createOrder sends POST', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      await apiService.createOrder([{ productId: 'p1', quantity: 2 }]);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/store/orders'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('authorization header', () => {
    it('includes Authorization header when token is set', async () => {
      apiService.setToken('auth-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      await apiService.getProfile();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer auth-token' }),
        })
      );
    });

    it('does not include Authorization header when no token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      await apiService.getProfile();
      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders.Authorization).toBeUndefined();
    });
  });

  describe('error response handling', () => {
    it('handles errors array in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ errors: [{ msg: 'Field required' }] }),
      });
      const result = await apiService.getProfile();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Field required');
    });

    it('handles generic error fallback', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });
      const result = await apiService.getProfile();
      expect(result.success).toBe(false);
      expect(result.error).toBe('An error occurred');
    });
  });
});
