// frontend/microfrontends/administration/src/test/administratorApi.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../../../../shared/api-client';
import { EnrollNowAdministratorApi } from '../api/administratorApi';
import { EnrollNowAdministratorAuthAdapter } from '../api/administratorAuthAdapter';
import { MfeContext } from '../../../../shared/contracts';

vi.mock('../../../../shared/api-client', () => {
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

describe('EnrollNow Administrator MFE Integration', () => {
  const mockContext: MfeContext = {
    user: {
      id: 'admin-1',
      username: 'sysadmin',
      email: 'admin@enrollnow.local',
      roles: ['ROLE_SUPER_ADMIN'],
      firstName: 'System',
      lastName: 'Admin',
      active: true,
      siteCodes: ['SITE-001'],
    },
    token: 'jwt-bearer-token-xyz',
    apiBaseUrl: 'http://localhost:8080',
    basePath: '/administrator',
    correlationId: 'test-correlation-id',
    navigate: vi.fn(),
    emitEvent: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('EnrollNowAdministratorAuthAdapter', () => {
    it('returns formatted current admin user from context', () => {
      const auth = new EnrollNowAdministratorAuthAdapter(mockContext);
      const user = auth.getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.username).toBe('sysadmin');
      expect(user?.roles).toContain('ROLE_SUPER_ADMIN');
    });

    it('confirms administrator access for admin roles', () => {
      const auth = new EnrollNowAdministratorAuthAdapter(mockContext);
      expect(auth.hasAdministratorAccess()).toBe(true);
    });

    it('denies administrator access for non-admin users', () => {
      const nonAdminContext = {
        ...mockContext,
        user: { ...mockContext.user!, roles: ['ROLE_PARTICIPANT'] },
      };
      const auth = new EnrollNowAdministratorAuthAdapter(nonAdminContext);
      expect(auth.hasAdministratorAccess()).toBe(false);
    });
  });

  describe('EnrollNowAdministratorApi Adapter', () => {
    it('fetches dashboard metrics from /api/v1/administrator/dashboard', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            totalUsers: 14,
            activeUsers: 12,
            inactiveUsers: 2,
            activeLocations: 3,
          },
        },
      });

      const api = new EnrollNowAdministratorApi(mockContext);
      const dashboard = await api.getDashboard();

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/administrator/dashboard');
      expect(dashboard.totalUsers).toBe(14);
      expect(dashboard.activeLocations).toBe(3);
    });

    it('queries users with search parameters', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: [
            { id: 1, username: 'jdoe', email: 'jdoe@enrollnow.local', firstName: 'John', active: true, roles: ['ROLE_COORDINATOR'] },
          ],
        },
      });

      const api = new EnrollNowAdministratorApi(mockContext);
      const users = await api.getUsers({ search: 'jdoe', active: true });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/administrator/users', {
        params: { search: 'jdoe', active: true },
      });
      expect(Array.isArray(users)).toBe(true);
      expect((users as any[])[0].username).toBe('jdoe');
    });

    it('creates a new user account with POST /api/v1/administrator/users', async () => {
      const newReq = {
        username: 'newcoord',
        email: 'coord@enrollnow.local',
        password: 'TempPassword123!',
        firstName: 'Elena',
        lastName: 'Rostova',
        roles: ['ROLE_COORDINATOR'],
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          data: { id: 2, ...newReq, active: true },
        },
      });

      const api = new EnrollNowAdministratorApi(mockContext);
      const created = await api.createUser(newReq as any);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/administrator/users', newReq);
      expect(created.id).toBe(2);
      expect(created.username).toBe('newcoord');
    });

    it('updates user details with PUT /api/v1/administrator/users/:id', async () => {
      const updateReq = {
        firstName: 'Elena Updated',
        lastName: 'Rostova',
        email: 'elena.updated@enrollnow.local',
        active: true,
      };

      vi.mocked(apiClient.put).mockResolvedValueOnce({
        data: {
          data: { id: 2, username: 'newcoord', ...updateReq },
        },
      });

      const api = new EnrollNowAdministratorApi(mockContext);
      const updated = await api.updateUser(2, updateReq as any);

      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/administrator/users/2', updateReq);
      expect(updated.firstName).toBe('Elena Updated');
    });

    it('activates and deactivates users via dedicated endpoints', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { success: true } });

      const api = new EnrollNowAdministratorApi(mockContext);
      await api.activateUser(5);
      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/administrator/users/5/activate');

      await api.deactivateUser(5);
      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/administrator/users/5/deactivate');
    });

    it('resets user password with POST /api/v1/administrator/users/:id/reset-password', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { success: true } });

      const api = new EnrollNowAdministratorApi(mockContext);
      await api.resetPassword(5, { newPassword: 'NewSecurePassword123!' });

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/administrator/users/5/reset-password', {
        newPassword: 'NewSecurePassword123!',
      });
    });

    it('manages clinical site access with GET and PUT /api/v1/administrator/users/:id/locations', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: [{ locationId: 101, locationName: 'Boston Medical Center' }],
        },
      });
      vi.mocked(apiClient.put).mockResolvedValueOnce({
        data: {
          data: [{ locationId: 101 }, { locationId: 102 }],
        },
      });

      const api = new EnrollNowAdministratorApi(mockContext);
      const sites = await api.getUserLocations(5);
      expect(sites.length).toBe(1);

      await api.saveUserLocations(5, [101, 102]);
      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/administrator/users/5/locations', [101, 102]);
    });

    it('manages roles and RBAC entitlement matrices', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: [{ id: 1, name: 'ROLE_COORDINATOR', description: 'Clinical coordinator' }],
        },
      });

      const api = new EnrollNowAdministratorApi(mockContext);
      const roles = await api.getRoles();
      expect(roles.length).toBe(1);
      expect(roles[0].name).toBe('ROLE_COORDINATOR');
    });

    it('queries audit trail logs with query parameters', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            content: [
              { id: 1, action: 'CREATE_USER', performedByUsername: 'sysadmin', createdAt: '2026-09-21T12:00:00Z' },
            ],
            totalElements: 1,
            totalPages: 1,
          },
        },
      });

      const api = new EnrollNowAdministratorApi(mockContext);
      const auditPage = await api.getAuditLogs({ action: 'CREATE_USER', page: 0, size: 10 });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/administrator/audit-logs', {
        params: { action: 'CREATE_USER', page: 0, size: 10 },
      });
      expect(auditPage.content.length).toBe(1);
      expect(auditPage.content[0].action).toBe('CREATE_USER');
    });
  });
});
