// frontend/microfrontends/administration/src/api/administratorApi.ts
import { AxiosInstance } from 'axios';
import type {
  AdministratorApi,
  AdminDashboard,
  AdminUser,
  AdminUserPage,
  CreateUserRequest,
  UpdateUserRequest,
  UserQuery,
  AdminRole,
  CreateRoleRequest,
  UpdateRoleRequest,
  PermissionCatalog,
  PermissionModule,
  RolePermission,
  UserRoleAssignment,
  AdminProviderMapping,
  AdminProviderOption,
  AdminLocationOption,
  AdminLocationAccess,
  AdminAuditPage,
  AuditQuery,
  ResetPasswordRequest,
  EntityId,
} from '@aiventrahealth/administrator-ui';
import { MfeContext } from '../../../../shared/contracts';
import { apiClient } from '../../../../shared/api-client';

const ADMIN_PREFIX = '/api/v1/administrator';

export class EnrollNowAdministratorApi implements AdministratorApi {
  private client: AxiosInstance;

  constructor(_context?: MfeContext, customClient?: AxiosInstance) {
    this.client = customClient || apiClient;
  }

  // Dashboard
  async getDashboard(): Promise<AdminDashboard> {
    const res = await this.client.get(`${ADMIN_PREFIX}/dashboard`);
    return res.data?.data || {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      activeLocations: 0,
    };
  }

  // Users
  async getUsers(query?: UserQuery): Promise<AdminUser[] | AdminUserPage> {
    const params: Record<string, string | boolean | number | undefined> = {};
    if (query?.search) params.search = query.search;
    if (query?.active !== undefined) params.active = query.active;

    const res = await this.client.get(`${ADMIN_PREFIX}/users`, { params });
    const data = res.data?.data || [];
    return data;
  }

  async getUser(id: EntityId): Promise<AdminUser> {
    const res = await this.client.get(`${ADMIN_PREFIX}/users/${id}`);
    return res.data?.data;
  }

  async createUser(request: CreateUserRequest): Promise<AdminUser> {
    const res = await this.client.post(`${ADMIN_PREFIX}/users`, request);
    return res.data?.data;
  }

  async updateUser(id: EntityId, request: UpdateUserRequest): Promise<AdminUser> {
    const res = await this.client.put(`${ADMIN_PREFIX}/users/${id}`, request);
    return res.data?.data;
  }

  async activateUser(id: EntityId): Promise<void | AdminUser> {
    const res = await this.client.post(`${ADMIN_PREFIX}/users/${id}/activate`);
    return res.data?.data;
  }

  async deactivateUser(id: EntityId): Promise<void | AdminUser> {
    const res = await this.client.post(`${ADMIN_PREFIX}/users/${id}/deactivate`);
    return res.data?.data;
  }

  async resetPassword(id: EntityId, request: ResetPasswordRequest): Promise<void> {
    await this.client.post(`${ADMIN_PREFIX}/users/${id}/reset-password`, request);
  }

  // Role Assignments
  async getUserRoleAssignments(userId: EntityId): Promise<UserRoleAssignment[]> {
    const res = await this.client.get(`${ADMIN_PREFIX}/users/${userId}/role-assignments`);
    return res.data?.data || [];
  }

  async saveUserRoleAssignments(userId: EntityId, assignments: UserRoleAssignment[]): Promise<void | AdminUser> {
    const res = await this.client.put(`${ADMIN_PREFIX}/users/${userId}/role-assignments`, assignments);
    return res.data?.data;
  }

  // Locations / Research Sites
  async getLocations(): Promise<AdminLocationOption[]> {
    const res = await this.client.get(`${ADMIN_PREFIX}/locations`);
    return res.data?.data || [];
  }

  async getUserLocations(userId: EntityId): Promise<AdminLocationAccess[]> {
    const res = await this.client.get(`${ADMIN_PREFIX}/users/${userId}/locations`);
    return res.data?.data || [];
  }

  async saveUserLocations(userId: EntityId, locationIds: EntityId[]): Promise<AdminLocationAccess[] | void> {
    const numericIds = locationIds.map((id) => Number(id));
    const res = await this.client.put(`${ADMIN_PREFIX}/users/${userId}/locations`, numericIds);
    return res.data?.data || [];
  }

  // Roles & RBAC
  async getRoles(): Promise<AdminRole[]> {
    const res = await this.client.get(`${ADMIN_PREFIX}/roles`);
    return res.data?.data || [];
  }

  async getRole(id: EntityId): Promise<AdminRole> {
    const res = await this.client.get(`${ADMIN_PREFIX}/roles/${id}`);
    return res.data?.data;
  }

  async createRole(request: CreateRoleRequest): Promise<AdminRole> {
    const res = await this.client.post(`${ADMIN_PREFIX}/roles`, request);
    return res.data?.data;
  }

  async updateRole(id: EntityId, request: UpdateRoleRequest): Promise<AdminRole> {
    const res = await this.client.put(`${ADMIN_PREFIX}/roles/${id}`, request);
    return res.data?.data;
  }

  async setRoleStatus(id: EntityId, status: string): Promise<AdminRole> {
    const res = await this.client.patch(`${ADMIN_PREFIX}/roles/${id}/status`, null, { params: { status } });
    return res.data?.data;
  }

  async getPermissionCatalog(): Promise<PermissionCatalog> {
    const res = await this.client.get(`${ADMIN_PREFIX}/roles/1/permissions`);
    if (res.data?.data && Array.isArray(res.data.data)) {
      return res.data.data.map((m: { moduleCode?: string; code?: string; title?: string; name?: string; actions?: string[] }) => ({
        code: m.moduleCode || m.code || '',
        name: m.title || m.name || '',
        actions: Array.isArray(m.actions) ? m.actions : ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT'],
      }));
    }
    return [];
  }

  async getRolePermissions(roleId: EntityId): Promise<PermissionModule[]> {
    const res = await this.client.get(`${ADMIN_PREFIX}/roles/${roleId}/permissions`);
    return res.data?.data || [];
  }

  async saveRolePermissions(roleId: EntityId, permissions: RolePermission[]): Promise<void | PermissionModule[]> {
    const res = await this.client.put(`${ADMIN_PREFIX}/roles/${roleId}/permissions`, permissions);
    return res.data?.data || [];
  }

  // Audit Logs
  async getAuditLogs(query?: AuditQuery): Promise<AdminAuditPage> {
    const params: Record<string, string | number | undefined> = {};
    if (query?.action) params.action = query.action;
    if (query?.performedBy) params.performedBy = query.performedBy;
    if (query?.targetUserId) params.targetUserId = query.targetUserId;
    if (query?.search) params.search = query.search;
    if (query?.page !== undefined) params.page = query.page;
    if (query?.size !== undefined) params.size = query.size;

    const res = await this.client.get(`${ADMIN_PREFIX}/audit-logs`, { params });
    const data = res.data?.data;
    return {
      content: data?.content || [],
      totalElements: data?.totalElements || 0,
      totalPages: data?.totalPages || 1,
    };
  }

  // Provider Mapping
  async getProviderMappings(): Promise<AdminProviderMapping[]> {
    const res = await this.client.get(`${ADMIN_PREFIX}/provider-mappings`);
    return res.data?.data || [];
  }

  async mapUserProvider(userId: EntityId, doctorId: EntityId): Promise<AdminProviderMapping> {
    const res = await this.client.post(`${ADMIN_PREFIX}/provider-mappings`, {
      userId,
      providerId: doctorId,
    });
    return res.data?.data;
  }

  async unmapUserProvider(userId: EntityId): Promise<void> {
    await this.client.delete(`${ADMIN_PREFIX}/provider-mappings/${userId}`);
  }

  async getAvailableProviders(): Promise<AdminProviderOption[]> {
    const res = await this.client.get(`${ADMIN_PREFIX}/providers`);
    return res.data?.data || [];
  }
}
