// frontend/shared/api-client.test.ts - Tests for Central Axios Client & Interceptors
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createApiClient,
  setHeaderProvider,
  getAccessToken,
  normalizeApiError,
  handleSessionExpired,
} from './api-client';

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

describe('Central Axios API Client & Interceptors', () => {
  beforeEach(() => {
    localStorage.clear();
    setHeaderProvider({
      getToken: undefined,
      getTenantId: undefined,
      getOrganizationId: undefined,
      getCorrelationId: undefined,
    });
    vi.clearAllMocks();
  });

  describe('Token Retrieval', () => {
    it('returns null when no token is configured or in localStorage', () => {
      expect(getAccessToken()).toBeNull();
    });

    it('retrieves token from localStorage if present', () => {
      localStorage.setItem('enrollnow_token', 'local-storage-jwt-123');
      expect(getAccessToken()).toBe('local-storage-jwt-123');
    });

    it('prefers dynamic header provider getToken over localStorage', () => {
      localStorage.setItem('enrollnow_token', 'local-token');
      setHeaderProvider({ getToken: () => 'dynamic-provider-jwt' });
      expect(getAccessToken()).toBe('dynamic-provider-jwt');
    });
  });

  describe('Request Interceptor Logic', () => {
    it('does not add Authorization header when no token exists', async () => {
      const client = createApiClient({ baseURL: 'http://localhost:8080' });
      const requestInterceptor = (client.interceptors.request as any).handlers[0].fulfilled;

      const config = {
        headers: {},
      };

      const result = await requestInterceptor(config);
      expect(result.headers.Authorization).toBeUndefined();
    });

    it('automatically adds Authorization: Bearer <token> when token exists', async () => {
      localStorage.setItem('enrollnow_token', 'valid-jwt-token-abc');
      const client = createApiClient({ baseURL: 'http://localhost:8080' });
      const requestInterceptor = (client.interceptors.request as any).handlers[0].fulfilled;

      const config = {
        headers: {},
      };

      const result = await requestInterceptor(config);
      expect(result.headers.Authorization).toBe('Bearer valid-jwt-token-abc');
    });

    it('does not add Authorization header if token is null, undefined, or empty string', async () => {
      setHeaderProvider({ getToken: () => null });
      const client = createApiClient({ baseURL: 'http://localhost:8080' });
      const requestInterceptor = (client.interceptors.request as any).handlers[0].fulfilled;

      const config = {
        headers: {},
      };

      const result = await requestInterceptor(config);
      expect(result.headers.Authorization).toBeUndefined();
      expect(result.headers.Authorization).not.toBe('Bearer null');
      expect(result.headers.Authorization).not.toBe('Bearer undefined');
    });

    it('automatically injects X-Correlation-Id header', async () => {
      const client = createApiClient({ baseURL: 'http://localhost:8080' });
      const requestInterceptor = (client.interceptors.request as any).handlers[0].fulfilled;

      const config = {
        headers: {},
      };

      const result = await requestInterceptor(config);
      expect(result.headers['X-Correlation-Id']).toBeDefined();
      expect(typeof result.headers['X-Correlation-Id']).toBe('string');
    });

    it('adds Accept: application/json as standard common header', async () => {
      const client = createApiClient({ baseURL: 'http://localhost:8080' });
      const requestInterceptor = (client.interceptors.request as any).handlers[0].fulfilled;

      const config = {
        headers: {},
      };

      const result = await requestInterceptor(config);
      expect(result.headers.Accept).toBe('application/json');
    });

    it('supports dynamic header provider for X-Tenant-Id and X-Organization-Id', async () => {
      setHeaderProvider({
        getTenantId: () => 'tenant-pharma-01',
        getOrganizationId: () => 'org-trial-99',
      });

      const client = createApiClient({ baseURL: 'http://localhost:8080' });
      const requestInterceptor = (client.interceptors.request as any).handlers[0].fulfilled;

      const config = {
        headers: {},
      };

      const result = await requestInterceptor(config);
      expect(result.headers['X-Tenant-Id']).toBe('tenant-pharma-01');
      expect(result.headers['X-Organization-Id']).toBe('org-trial-99');
    });

    it('preserves FormData and does NOT force Content-Type: application/json onto multipart/form-data', async () => {
      const client = createApiClient({ baseURL: 'http://localhost:8080' });
      const requestInterceptor = (client.interceptors.request as any).handlers[0].fulfilled;

      // Mock FormData
      class MockFormData {}
      const fakeFormData = new MockFormData();
      Object.defineProperty(globalThis, 'FormData', { value: MockFormData, configurable: true });

      const config = {
        data: fakeFormData,
        headers: { 'Content-Type': 'multipart/form-data' },
      };

      const result = await requestInterceptor(config);
      // Content-Type should be removed so Axios/browser sets boundary
      expect(result.headers['Content-Type']).toBeUndefined();
    });
  });

  describe('Response Interceptor & 401 Session Handling', () => {
    it('normalizes standard Spring Boot ApiResponse and ApiError contracts', () => {
      const mockError = {
        response: {
          status: 422,
          data: {
            success: false,
            message: 'Validation failed for one or more fields',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: ['username: must not be blank', 'password: too short'],
            },
            correlationId: 'corr-xyz-123',
          },
        },
      };

      const normalized = normalizeApiError(mockError);
      expect(normalized.status).toBe(422);
      expect(normalized.code).toBe('VALIDATION_ERROR');
      expect(normalized.message).toBe('Validation failed');
      expect(normalized.details).toEqual(['username: must not be blank', 'password: too short']);
      expect(normalized.correlationId).toBe('corr-xyz-123');
    });

    it('clears session tokens and dispatches logout event on 401', () => {
      localStorage.setItem('enrollnow_token', 'stale-token');
      localStorage.setItem('enrollnow_user', JSON.stringify({ username: 'coordinator' }));

      const eventSpy = vi.fn();
      window.addEventListener('enrollnow_auth_change', eventSpy);

      handleSessionExpired();

      expect(localStorage.getItem('enrollnow_token')).toBeNull();
      expect(localStorage.getItem('enrollnow_user')).toBeNull();
      expect(eventSpy).toHaveBeenCalled();
    });

    it('triggers registered onUnauthorized callback on 401 response', async () => {
      const onUnauthMock = vi.fn();
      const client = createApiClient({
        baseURL: 'http://localhost:8080',
        onUnauthorized: onUnauthMock,
      });

      const responseInterceptorErr = (client.interceptors.response as any).handlers[0].rejected;

      const mockError = {
        config: { url: '/api/v1/studies' },
        response: {
          status: 401,
          data: { message: 'Token expired' },
        },
      };

      await expect(responseInterceptorErr(mockError)).rejects.toThrow();
      expect(onUnauthMock).toHaveBeenCalled();
    });

    it('does NOT clear session or trigger session expired on 401 when calling /api/v1/auth/login', async () => {
      localStorage.setItem('enrollnow_token', 'temp-token');

      const client = createApiClient({ baseURL: 'http://localhost:8080' });
      const responseInterceptorErr = (client.interceptors.response as any).handlers[0].rejected;

      const mockLoginError = {
        config: { url: '/api/v1/auth/login' },
        response: {
          status: 401,
          data: { message: 'Invalid credentials' },
        },
      };

      await expect(responseInterceptorErr(mockLoginError)).rejects.toThrow();
      // Token was not cleared because it was a login attempt failure
      expect(localStorage.getItem('enrollnow_token')).toBe('temp-token');
    });
  });
});
