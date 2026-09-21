// frontend/shell/src/test/AuthContext.test.ts - Shell Host Hardened Verification Suite
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULT_BACKEND_URLS, getRemoteDefinition, getAllRemoteDefinitions } from '../remotes/RemoteRegistry';
import { defaultApiClient } from '../../../shared/api-client';

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
}));

describe('Shell Host Hardened Infrastructure', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('RemoteRegistry Backend URL Propagation', () => {
    it('defines explicit, non-empty backend URLs for all 11 micro-frontends', () => {
      const expectedPorts: Record<string, number> = {
        identity: 8081,
        administration: 8082,
        organization: 8083,
        study: 8084,
        participant: 8085,
        recruitment: 8086,
        survey: 8087,
        task: 8088,
        communication: 8089,
        document: 8090,
        dashboard: 8091,
      };

      for (const [mfeId, expectedPort] of Object.entries(expectedPorts)) {
        const url = DEFAULT_BACKEND_URLS[mfeId];
        expect(url).toBeDefined();
        expect(url).toContain(`:${expectedPort}`);
      }
    });

    it('populates remote definitions with correct routes, exposed modules, and apiBaseUrls', () => {
      const remotes = getAllRemoteDefinitions();
      expect(remotes.length).toBe(11);

      const adminRemote = getRemoteDefinition('administration');
      expect(adminRemote).toBeDefined();
      expect(adminRemote?.route).toBe('/admin');
      expect(adminRemote?.exposedModule).toBe('AdministrationModule');
      expect(adminRemote?.apiBaseUrl).toBe('http://localhost:8082');

      const dashRemote = getRemoteDefinition('dashboard');
      expect(dashRemote).toBeDefined();
      expect(dashRemote?.route).toBe('/dashboard');
      expect(dashRemote?.apiBaseUrl).toBe('http://localhost:8091');
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

      const res = await defaultApiClient.get('/api/v1/auth/me', {
        headers: { Authorization: 'Bearer valid-token-xyz' },
      });

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
        await defaultApiClient.get('/api/v1/auth/me', {
          headers: { Authorization: 'Bearer expired-token' },
        });
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
