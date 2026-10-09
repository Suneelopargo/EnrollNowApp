// frontend/shared/mock-api.test.ts - Tests for Mock API Layer, Interceptor Flow, and Authentication
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApiClient, setHeaderProvider } from './api-client';
import { authApi } from './api/authApi';
import { dashboardApi } from './api/dashboardApi';
import { studyApi } from './api/studyApi';
import { participantApi } from './api/participantApi';
import { setApiMode, setMockErrorSimulation } from './api-config';
import { mockStore } from './mock-api/mockStore';
import { EXPIRED_TOKEN } from './mock-api/mockData';

// Node.js environment storage & event mocking
const storage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, val: string) => {
    storage[key] = String(val);
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
  clear: () => {
    Object.keys(storage).forEach((k) => delete storage[k]);
  },
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

describe('Mock API Layer & End-to-End Interceptor Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    mockStore.reset();
    setApiMode('mock');
    setMockErrorSimulation(null);
    setHeaderProvider({
      getToken: undefined,
      getTenantId: undefined,
      getOrganizationId: undefined,
      getCorrelationId: undefined,
    });
  });

  afterEach(() => {
    setApiMode(null);
    setMockErrorSimulation(null);
  });

  describe('Authentication via Mock API (authApi -> apiClient -> mockAdapter)', () => {
    it('successfully logs in Administrator with admin / Admin@123', async () => {
      const result = await authApi.login({
        username: 'admin',
        password: 'Admin@123',
      });

      expect(result).toBeDefined();
      expect(result.token).toBe('mock-jwt-admin-1');
      expect(result.user).toBeDefined();
      expect(result.user.username).toBe('admin');
      expect(result.user.roles).toContain('ADMIN');
      expect(result.user.email).toBe('admin@enrollnow.local');
    });

    it('successfully logs in Standard User with user / User@123', async () => {
      const result = await authApi.login({
        username: 'user',
        password: 'User@123',
      });

      expect(result).toBeDefined();
      expect(result.token).toBe('mock-jwt-user-2');
      expect(result.user.username).toBe('user');
      expect(result.user.roles).toContain('USER');
    });

    it('rejects invalid password (admin / wrong) with 401 and does NOT clear session', async () => {
      // Pre-set an active session to verify login failure does not clear it
      localStorage.setItem('enrollnow_token', 'pre-existing-token');

      let thrownError: any;
      try {
        await authApi.login({
          username: 'admin',
          password: 'wrong-password',
        });
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeDefined();
      expect(thrownError.status).toBe(401);
      // Ensure the login 401 did NOT clear existing session (Login exception rule)
      expect(localStorage.getItem('enrollnow_token')).toBe('pre-existing-token');
    });

    it('rejects unknown user with 401', async () => {
      await expect(
        authApi.login({ username: 'nonexistent', password: 'password' })
      ).rejects.toMatchObject({ status: 401 });
    });
  });

  describe('Session Validation: GET /api/v1/auth/me', () => {
    it('returns authenticated user profile when valid token is in localStorage', async () => {
      localStorage.setItem('enrollnow_token', 'mock-jwt-admin-1');

      const currentUser = await authApi.getCurrentUser();
      expect(currentUser).toBeDefined();
      expect(currentUser.username).toBe('admin');
      expect(currentUser.id).toBe(1);
    });

    it('returns 401 when no token is present', async () => {
      await expect(authApi.getCurrentUser()).rejects.toMatchObject({
        status: 401,
      });
    });

    it('returns 401 when token is unrecognized or invalid', async () => {
      localStorage.setItem('enrollnow_token', 'unknown-invalid-token');

      await expect(authApi.getCurrentUser()).rejects.toMatchObject({
        status: 401,
      });
    });

    it('clears session when token is mock-expired-token', async () => {
      localStorage.setItem('enrollnow_token', EXPIRED_TOKEN);
      localStorage.setItem('enrollnow_user', JSON.stringify({ username: 'admin' }));

      const authChangeSpy = vi.fn();
      window.addEventListener('enrollnow_auth_change', authChangeSpy);

      await expect(authApi.getCurrentUser()).rejects.toMatchObject({
        status: 401,
      });

      // Session tokens must be purged by response interceptor
      expect(localStorage.getItem('enrollnow_token')).toBeNull();
      expect(localStorage.getItem('enrollnow_user')).toBeNull();
      expect(authChangeSpy).toHaveBeenCalled();
    });
  });

  describe('Protected Endpoints & Interceptor Header Injection', () => {
    it('rejects protected dashboard endpoint when unauthenticated', async () => {
      await expect(dashboardApi.getOverview()).rejects.toMatchObject({
        status: 401,
      });
    });

    it('returns dashboard overview when authenticated with valid token', async () => {
      localStorage.setItem('enrollnow_token', 'mock-jwt-admin-1');

      const overview = await dashboardApi.getOverview();
      expect(overview).toBeDefined();
      expect(overview.totalStudies).toBeGreaterThan(0);
      expect(overview.totalParticipants).toBeGreaterThan(0);
      expect(overview.recentStudies).toBeInstanceOf(Array);
    });

    it('returns studies list and supports creating new study in mock store', async () => {
      localStorage.setItem('enrollnow_token', 'mock-jwt-admin-1');

      const initialStudies = await studyApi.getStudies();
      expect(initialStudies.length).toBeGreaterThan(0);

      const created = await studyApi.createStudy({
        title: 'New Respiratory Intervention Study',
        phase: 'Phase II',
        status: 'ACTIVE',
      });
      expect(created).toBeDefined();
      expect(created.title).toBe('New Respiratory Intervention Study');

      const afterStudies = await studyApi.getStudies();
      expect(afterStudies.length).toBe(initialStudies.length + 1);
    });

    it('allows updating participant status in mock store', async () => {
      localStorage.setItem('enrollnow_token', 'mock-jwt-admin-1');

      const participants = await participantApi.getParticipants();
      expect(participants.length).toBeGreaterThan(0);

      const updated = await participantApi.updateParticipantStatus(1, 'COMPLETED');
      expect(updated.status).toBe('COMPLETED');
    });
  });

  describe('Mock Error Simulation Mode', () => {
    it('simulates HTTP 500 error when VITE_API_MOCK_ERROR=500', async () => {
      localStorage.setItem('enrollnow_token', 'mock-jwt-admin-1');
      setMockErrorSimulation(500);

      await expect(dashboardApi.getOverview()).rejects.toMatchObject({
        status: 500,
      });
    });

    it('simulates HTTP 503 error when VITE_API_MOCK_ERROR=503', async () => {
      localStorage.setItem('enrollnow_token', 'mock-jwt-admin-1');
      setMockErrorSimulation(503);

      await expect(dashboardApi.getOverview()).rejects.toMatchObject({
        status: 503,
      });
    });

    it('simulates network disconnection when VITE_API_MOCK_ERROR=network', async () => {
      localStorage.setItem('enrollnow_token', 'mock-jwt-admin-1');
      setMockErrorSimulation('network');

      await expect(dashboardApi.getOverview()).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
      });
    });
  });

  describe('Real Mode Configuration Support', () => {
    it('delegates to HTTP adapter when mode is real', async () => {
      const realAdapterSpy = vi.fn().mockResolvedValue({
        data: { success: true, data: { realBackend: true } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });

      const client = createApiClient({
        mode: 'real',
        adapter: realAdapterSpy,
      });

      const response = await client.get('/api/v1/live-test');
      expect(realAdapterSpy).toHaveBeenCalled();
      expect(response.data.data.realBackend).toBe(true);
    });
  });
});
