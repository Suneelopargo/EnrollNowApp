// frontend/shared/authApi.test.ts - Tests for authApi and Authentication Flow
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi } from './api/authApi';
import { apiClient } from './api-client';
import { setApiMode } from './api-config';

// Node.js environment storage & event mocking
const storage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, val: string) => { storage[key] = String(val); },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

if (typeof window === 'undefined') {
  const eventListeners: Record<string, ((e: any) => void)[]> = {};
  (globalThis as any).window = {
    addEventListener: (type: string, listener: any) => {
      eventListeners[type] = eventListeners[type] || [];
      eventListeners[type].push(listener);
    },
    removeEventListener: (type: string, listener: any) => {
      if (eventListeners[type]) {
        eventListeners[type] = eventListeners[type].filter((l) => l !== listener);
      }
    },
    dispatchEvent: (event: any) => {
      const listeners = eventListeners[event.type] || [];
      listeners.forEach((l) => l(event));
      return true;
    },
  };
}

if (typeof (globalThis as any).CustomEvent === 'undefined') {
  (globalThis as any).CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, params: any = {}) {
      this.type = type;
      this.detail = params.detail;
    }
  };
}

vi.mock('./api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api-client')>();
  const mockClient = {
    get: vi.fn(),
    post: vi.fn(),
  };
  return {
    ...actual,
    apiClient: mockClient,
    defaultApiClient: mockClient,
    default: mockClient,
  };
});

describe('authApi Service Contract', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('executes POST /api/v1/auth/login in mock mode', async () => {
      setApiMode('mock');
      const mockResponse = {
        data: {
          success: true,
          data: {
            accessToken: 'jwt-fresh-login-token-777',
            user: {
              id: 10,
              username: 'coordinator1',
              email: 'coord1@enrollnow.local',
              roles: ['ROLE_COORDINATOR'],
            },
          },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const result = await authApi.login({
        username: 'coordinator1',
        password: 'Password123!',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/login', {
        usernameOrEmail: 'coordinator1',
        username: 'coordinator1',
        password: 'Password123!',
      });
      expect(result.token).toBe('jwt-fresh-login-token-777');
      expect(result.user.username).toBe('coordinator1');
    });

    it('executes POST /api/v1/tenants/{tenantId}/auth/login in real mode', async () => {
      setApiMode('real');
      const mockResponse = {
        data: {
          token: 'jwt-fresh-real-token-888',
          userId: 'user-uuid-123',
          email: 'admin@enrollnow.local',
          firstName: 'Admin',
          lastName: 'User',
          tenantId: '11111111-1111-1111-1111-111111111111',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const result = await authApi.login({
        username: 'admin@enrollnow.local',
        password: 'Password123!',
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/tenants/11111111-1111-1111-1111-111111111111/auth/login',
        {
          email: 'admin@enrollnow.local',
          password: 'Password123!',
        }
      );
      expect(result.token).toBe('jwt-fresh-real-token-888');
      expect(result.user.email).toBe('admin@enrollnow.local');
    });

    it('rejects malformed response without token', async () => {
      setApiMode('real');
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {},
      });

      await expect(
        authApi.login({ username: 'baduser', password: 'bad' })
      ).rejects.toThrow('Missing access token');
    });
  });

  describe('getCurrentUser', () => {
    it('calls GET /api/v1/auth/me to retrieve session user', async () => {
      const mockUser = {
        id: 42,
        username: 'investigator',
        email: 'inv@enrollnow.local',
        roles: ['ROLE_INVESTIGATOR'],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: mockUser,
        },
      });

      const user = await authApi.getCurrentUser();
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/auth/me', expect.any(Object));
      expect(user.username).toBe('investigator');
    });
  });

  describe('activateAccount', () => {
    it('executes POST /api/v1/tenants/{tenantId}/auth/activate with payload', async () => {
      const mockResponse = {
        data: {
          message: 'Account activated successfully.',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const result = await authApi.activateAccount({
        tenantId: '11111111-1111-1111-1111-111111111111',
        token: 'test-raw-activation-token-999',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/tenants/11111111-1111-1111-1111-111111111111/auth/activate',
        {
          token: 'test-raw-activation-token-999',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        },
        expect.objectContaining({ skipToast: true })
      );
      expect(result.message).toBe('Account activated successfully.');
    });
  });

  describe('logout', () => {
    it('clears localStorage and dispatches enrollnow_auth_change logout event', () => {
      localStorage.setItem('enrollnow_token', 'token-to-delete');
      localStorage.setItem('enrollnow_user', JSON.stringify({ username: 'admin' }));

      const eventSpy = vi.fn();
      window.addEventListener('enrollnow_auth_change', eventSpy);

      authApi.logout();

      expect(localStorage.getItem('enrollnow_token')).toBeNull();
      expect(localStorage.getItem('enrollnow_user')).toBeNull();
      expect(eventSpy).toHaveBeenCalled();
    });
  });
});
