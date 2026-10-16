// frontend/shared/administrationApi.test.ts - Unit tests for administrationApi
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import {
  administrationApi,
  toSitePermissionLabel,
  toStudyPermissionLabel,
  normalizeStudyPermission,
  SITE_PERMISSION_TO_ROLE_CODE,
  ROLE_CODE_TO_SITE_PERMISSION,
} from './api/administrationApi';
import { apiClient } from './api-client';

vi.mock('./api-client', () => {
  const mockClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return {
    apiClient: mockClient,
    defaultApiClient: mockClient,
    default: mockClient,
  };
});

describe('administrationApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.setItem('enrollnow_tenant_id', 'tenant-test-uuid');
  });

  describe('Permission mapping helpers', () => {
    it('maps site permission values correctly', () => {
      expect(toSitePermissionLabel('SITE_ADMIN')).toBe('Site Admin');
      expect(toSitePermissionLabel('SITE_MANAGER')).toBe('Site Manager');
      expect(toSitePermissionLabel('SITE_REGISTRY')).toBe('Registry Access');
      expect(toSitePermissionLabel('NONE')).toBe('None');
      expect(toSitePermissionLabel('None')).toBe('None');
      expect(toSitePermissionLabel(null)).toBe('None');
      expect(toSitePermissionLabel(undefined)).toBe('None');
    });

    it('maps study permission values correctly', () => {
      expect(toStudyPermissionLabel('STUDY_ADMIN')).toBe('Admin');
      expect(toStudyPermissionLabel('STUDY_LEADER')).toBe('Leader');
      expect(toStudyPermissionLabel('STUDY_RA')).toBe('RA');
      expect(toStudyPermissionLabel('STUDY_READ_ONLY')).toBe('Read Only');
      expect(toStudyPermissionLabel(null)).toBe('Admin');
      expect(toStudyPermissionLabel(undefined)).toBe('Admin');
    });

    it('normalizes study permission input correctly', () => {
      expect(normalizeStudyPermission('Admin')).toBe('STUDY_ADMIN');
      expect(normalizeStudyPermission('Leader')).toBe('STUDY_LEADER');
      expect(normalizeStudyPermission('RA')).toBe('STUDY_RA');
      expect(normalizeStudyPermission('Read Only')).toBe('STUDY_READ_ONLY');
      expect(normalizeStudyPermission(null)).toBe('STUDY_ADMIN');
    });
  });

  describe('getRoles API method', () => {
    it('calls /api/v1/roles with uppercase scope parameter when provided', async () => {
      const mockRoles = [
        { id: '1', code: 'SITE_ADMIN', name: 'Site Admin', scopeType: 'SITE', systemRole: true, active: true },
        { id: '2', code: 'SITE_MANAGER', name: 'Site Manager', scopeType: 'SITE', systemRole: false, active: true },
      ];
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRoles });

      const roles = await administrationApi.getRoles('site');

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/roles', {
        params: { scope: 'SITE' },
      });
      expect(roles).toEqual(mockRoles);
    });

    it('calls /api/v1/roles without scope parameter when omitted', async () => {
      const mockRoles = [
        { id: '1', code: 'GLOBAL_ADMIN', name: 'Global Admin', scopeType: 'TENANT', systemRole: true, active: true },
      ];
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRoles });

      const roles = await administrationApi.getRoles();

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/roles', {
        params: {},
      });
      expect(roles).toEqual(mockRoles);
    });
  });

  describe('removeSiteRole API method', () => {
    it('sends DELETE to /api/v1/tenants/{tenantId}/users/{userId}/roles/site', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: {} });

      await administrationApi.removeSiteRole('user-123', 'tenant-test-uuid');

      expect(apiClient.delete).toHaveBeenCalledWith(
        '/api/v1/tenants/tenant-test-uuid/users/user-123/roles/site'
      );
    });
  });
});
