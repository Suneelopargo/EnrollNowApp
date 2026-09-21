// frontend/microfrontends/administration/src/api/administratorApi.ts
import axios, { AxiosInstance } from 'axios';
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

export class EnrollNowAdministratorApi implements AdministratorApi {
  private client: AxiosInstance;
  private apiBase: string;

  constructor(context: MfeContext) {
    this.apiBase = context.apiBaseUrl || 'http://localhost:8082';
    this.client = axios.create({
      baseURL: `${this.apiBase}/api/v1/administrator`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': context.correlationId || `admin-${Date.now()}`,
        ...(context.token ? { Authorization: `Bearer ${context.token}` } : {}),
      },
    });
  }

  // Dashboard
  async getDashboard(): Promise<AdminDashboard> {
    const res = await this.client.get('/dashboard');
    return res.data?.data || {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      activeLocations: 0,
    };
  }

  // Users
  async getUsers(query?: UserQuery): Promise<AdminUser[] | AdminUserPage> {
    const params: Record<string, any> = {};
    if (query?.search) params.search = query.search;
    if (query?.active !== undefined) params.active = query.active;

    const res = await this.client.get('/users', { params });
    const data = res.data?.data || [];
    return data;
  }

  async getUser(id: EntityId): Promise<AdminUser> {
    const res = await this.client.get(`/users/${id}`);
    return res.data?.data;
  }

  async createUser(request: CreateUserRequest): Promise<AdminUser> {
    const res = await this.client.post('/users', request);
    return res.data?.data;
  }

  async updateUser(id: EntityId, request: UpdateUserRequest): Promise<AdminUser> {
    const res = await this.client.put(`/users/${id}`, request);
    return res.data?.data;
  }

  async activateUser(id: EntityId): Promise<void | AdminUser> {
    const res = await this.client.post(`/users/${id}/activate`);
    return res.data?.data;
  }

  async deactivateUser(id: EntityId): Promise<void | AdminUser> {
    const res = await this.client.post(`/users/${id}/deactivate`);
    return res.data?.data;
  }

  async resetPassword(id: EntityId, request: ResetPasswordRequest): Promise<void> {
    await this.client.post(`/users/${id}/reset-password`, request);
  }

  // Role Assignments
  async getUserRoleAssignments(userId: EntityId): Promise<UserRoleAssignment[]> {
    const res = await this.client.get(`/users/${userId}/role-assignments`);
    return res.data?.data || [];
  }

  async saveUserRoleAssignments(userId: EntityId, assignments: UserRoleAssignment[]): Promise<void | AdminUser> {
    const res = await this.client.put(`/users/${userId}/role-assignments`, assignments);
    return res.data?.data;
  }

  // Locations / Research Sites
  async getLocations(): Promise<AdminLocationOption[]> {
    const res = await this.client.get('/locations');
    return res.data?.data || [];
  }

  async getUserLocations(userId: EntityId): Promise<AdminLocationAccess[]> {
    const res = await this.client.get(`/users/${userId}/locations`);
    return res.data?.data || [];
  }

  async saveUserLocations(userId: EntityId, locationIds: EntityId[]): Promise<AdminLocationAccess[] | void> {
    const numericIds = locationIds.map((id) => Number(id));
    const res = await this.client.put(`/users/${userId}/locations`, numericIds);
    return res.data?.data || [];
  }

  // Roles & RBAC
  async getRoles(): Promise<AdminRole[]> {
    const res = await this.client.get('/roles');
    return res.data?.data || [];
  }

  async getRole(id: EntityId): Promise<AdminRole> {
    const res = await this.client.get(`/roles/${id}`);
    return res.data?.data;
  }

  async createRole(request: CreateRoleRequest): Promise<AdminRole> {
    const res = await this.client.post('/roles', request);
    return res.data?.data;
  }

  async updateRole(id: EntityId, request: UpdateRoleRequest): Promise<AdminRole> {
    const res = await this.client.put(`/roles/${id}`, request);
    return res.data?.data;
  }

  async setRoleStatus(id: EntityId, status: string): Promise<AdminRole> {
    const res = await this.client.patch(`/roles/${id}/status`, null, { params: { status } });
    return res.data?.data;
  }

  async getPermissionCatalog(): Promise<PermissionCatalog> {
    // If available on role or default catalog
    return [];
  }

  async getRolePermissions(roleId: EntityId): Promise<PermissionModule[]> {
    const res = await this.client.get(`/roles/${roleId}/permissions`);
    return res.data?.data || [];
  }

  async saveRolePermissions(roleId: EntityId, permissions: RolePermission[]): Promise<void | PermissionModule[]> {
    const res = await this.client.put(`/roles/${roleId}/permissions`, permissions);
    return res.data?.data || [];
  }

  // Audit Logs
  async getAuditLogs(query?: AuditQuery): Promise<AdminAuditPage> {
    const params: Record<string, any> = {};
    if (query?.action) params.action = query.action;
    if (query?.performedBy) params.performedBy = query.performedBy;
    if (query?.targetUserId) params.targetUserId = query.targetUserId;
    if (query?.search) params.search = query.search;
    if (query?.page !== undefined) params.page = query.page;
    if (query?.size !== undefined) params.size = query.size;

    const res = await this.client.get('/audit-logs', { params });
    const data = res.data?.data;
    return {
      content: data?.content || [],
      totalElements: data?.totalElements || 0,
      totalPages: data?.totalPages || 1,
    };
  }

  // Provider Mapping (Disabled in EnrollNow Clinical Trials Scope)
  async getProviderMappings(): Promise<AdminProviderMapping[]> {
    return [];
  }

  async mapUserProvider(_userId: EntityId, _doctorId: EntityId): Promise<AdminProviderMapping> {
    throw new Error('Provider mapping is disabled for EnrollNow Clinical Trials scope');
  }

  async unmapUserProvider(_userId: EntityId): Promise<void> {
    // No-op
  }

  async getAvailableProviders(): Promise<AdminProviderOption[]> {
    return [];
  }
}
