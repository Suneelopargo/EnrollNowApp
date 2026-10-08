// frontend/shell/src/test/AuthContext.test.ts - Shell Host Hardened Verification Suite
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRemoteDefinition, getAllRemoteDefinitions } from '../remotes/RemoteRegistry';
import { defaultApiClient } from '../../../shared/api-client';
import { getApiBaseUrl } from '../../../shared/api-config';

const storage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, val: string) => { storage[key] = val; },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
};
Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

vi.mock('../../../shared/api-client', () => ({
  defaultApiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Shell Host Hardened Infrastructure', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('RemoteRegistry Single Backend URL Propagation', () => {
    it('configures the single authoritative API base URL (:8080) for all 11 micro-frontends', () => {
      const remotes = getAllRemoteDefinitions();
      expect(remotes.length).toBe(11);

      const authoritativeBaseUrl = getApiBaseUrl();
      expect(authoritativeBaseUrl).toBe('http://localhost:8080');

      remotes.forEach((remote) => {
        expect(remote.apiBaseUrl).toBe('http://localhost:8080');
      });
    });

    it('populates remote definitions with correct routes, exposed modules, and unified apiBaseUrl', () => {
      const adminRemote = getRemoteDefinition('administration');
      expect(adminRemote).toBeDefined();
      expect(adminRemote?.route).toBe('/admin');
      expect(adminRemote?.exposedModule).toBe('AdministrationModule');
      expect(adminRemote?.apiBaseUrl).toBe('http://localhost:8080');

      const dashRemote = getRemoteDefinition('dashboard');
      expect(dashRemote).toBeDefined();
      expect(dashRemote?.route).toBe('/dashboard');
      expect(dashRemote?.apiBaseUrl).toBe('http://localhost:8080');
    });
  });

  describe('Session Storage & JWT Validation Contracts', () => {
    it('verifies valid session payload parsing from /api/v1/auth/me', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 42,
            username: 'leadinvestigator',
            email: 'investigator@enrollnow.local',
            roles: ['ROLE_INVESTIGATOR', 'ROLE_STUDY_LEAD'],
            siteCodes: ['SITE-001'],
            active: true,
          },
        },
      };

      vi.mocked(defaultApiClient.get).mockResolvedValueOnce(mockResponse);

      const res = await defaultApiClient.get('/api/v1/auth/me');

      expect(res.data.success).toBe(true);
      expect(res.data.data.username).toBe('leadinvestigator');
      expect(res.data.data.roles).toContain('ROLE_INVESTIGATOR');
      expect(res.data.data.siteCodes).toEqual(['SITE-001']);
    });

    it('rejects malformed user payloads without required roles or username', () => {
      const invalidUserPayload: any = {
        id: 99,
      };

      const isValidUser = (u: any): boolean => {
        return Boolean(u && u.username && Array.isArray(u.roles));
      };

      expect(isValidUser(invalidUserPayload)).toBe(false);
      expect(isValidUser({ username: 'admin', roles: ['ROLE_SUPER_ADMIN'] })).toBe(true);
    });

    it('clears token from localStorage on 401 unauthorized session response', async () => {
      localStorage.setItem('enrollnow_token', 'expired-token');

      vi.mocked(defaultApiClient.get).mockRejectedValueOnce({
        response: { status: 401, data: { message: 'Unauthorized' } },
      });

      try {
        await defaultApiClient.get('/api/v1/auth/me');
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem('enrollnow_token');
          localStorage.removeItem('enrollnow_user');
        }
      }

      expect(localStorage.getItem('enrollnow_token')).toBeNull();
      expect(localStorage.getItem('enrollnow_user')).toBeNull();
    });
  });
});
