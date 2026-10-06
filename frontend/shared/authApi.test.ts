// frontend/shared/authApi.test.ts - Tests for authApi and Authentication Flow
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi } from './api/authApi';
import { apiClient } from './api-client';

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

vi.mock('./api-client', () => {
  const mockClient = {
    get: vi.fn(),
    post: vi.fn(),
  };
  return {
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
    it('executes POST /api/v1/auth/login without requiring existing token', async () => {
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

    it('rejects malformed response without token', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          success: true,
          data: {},
        },
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
