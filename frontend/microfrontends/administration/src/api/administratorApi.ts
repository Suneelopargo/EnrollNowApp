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
import { getApiBaseUrl } from '../../../../shared/api-config';

export class EnrollNowAdministratorApi implements AdministratorApi {
  private client: AxiosInstance;
  private apiBase: string;

  constructor(context: MfeContext) {
    this.apiBase = context.apiBaseUrl || getApiBaseUrl();
    this.client = axios.create({
      baseURL: `${this.apiBase}/api/v1/administrator`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': context.correlationId || `admin-${Date.now()}`,
        ...(context.token ? { Authorization: `Bearer ${context.token}` } : {}),
      },
    });

    if (this.client.interceptors?.request) {
      this.client.interceptors.request.use((config) => {
        const activeToken = context.token || localStorage.getItem('enrollnow_token');
        if (activeToken && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${activeToken}`;
        }
        return config;
      });
    }
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
    let list: AdminLocationOption[] = [];
    try {
      const res = await this.client.get('/locations');
      list = res.data?.data || [];
    } catch {
      list = [];
    }
    const defaultLocations: AdminLocationOption[] = [
      { id: 1, code: 'LOC-001', name: 'Colonial Health Center', city: 'Boston', state: 'MA', active: true },
      { id: 2, code: 'LOC-002', name: 'Main Campus Clinical Facility', city: 'Cambridge', state: 'MA', active: true },
      { id: 3, code: 'LOC-003', name: 'Metro Research Center', city: 'New York', state: 'NY', active: true },
      { id: 4, code: 'LOC-004', name: 'Northwest Trial Site', city: 'Seattle', state: 'WA', active: true },
      { id: 5, code: 'LOC-005', name: 'Boston Memorial Hospital', city: 'Boston', state: 'MA', active: true },
      { id: 6, code: 'LOC-006', name: 'Pacific Health Institute', city: 'San Francisco', state: 'CA', active: true },
      { id: 7, code: 'LOC-007', name: 'Midwest Medical Complex', city: 'Chicago', state: 'IL', active: true },
      { id: 8, code: 'LOC-008', name: 'Southern Regional Clinic', city: 'Atlanta', state: 'GA', active: true },
      { id: 9, code: 'LOC-009', name: 'Capitol Health Pavilion', city: 'Washington', state: 'DC', active: true },
      { id: 10, code: 'LOC-010', name: 'Lakeside Ambulatory Care', city: 'Cleveland', state: 'OH', active: true },
      { id: 11, code: 'LOC-011', name: 'East Coast Oncology Center', city: 'Philadelphia', state: 'PA', active: true },
    ];
    const merged = [...list];
    for (const dl of defaultLocations) {
      if (!merged.some((m) => m.code === dl.code || m.id === dl.id)) {
        merged.push(dl);
      }
    }
    return merged;
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
    try {
      const res = await this.client.get('/roles/1/permissions');
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return res.data.data.map((m: any) => ({
          code: m.moduleCode || m.code,
          name: m.title || m.name,
          actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT'],
        }));
      }
    } catch {
      // Fallback standard catalog
    }
    return [
      { code: 'DASHBOARD', name: 'Clinical Operations Dashboard', actions: ['VIEW', 'EXPORT'] },
      { code: 'STUDY', name: 'Clinical Study Management', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT'] },
      { code: 'PARTICIPANT', name: 'Participant Registry & Intake', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT'] },
      { code: 'RECRUITMENT', name: 'Recruitment Campaigns', actions: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'] },
      { code: 'SURVEY', name: 'Survey Studio & eConsent', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT'] },
      { code: 'TASK', name: 'Tasks & Milestone Operations', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'] },
      { code: 'COMMUNICATION', name: 'Participant Outreach & Notifications', actions: ['VIEW', 'CREATE', 'SEND'] },
      { code: 'DOCUMENT', name: 'Document Repository & Binder', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'DOWNLOAD'] },
      { code: 'ADMIN', name: 'Platform Administration & Security', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'] },
    ];
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

  // Provider Mapping
  private providerMappings: AdminProviderMapping[] = [
    { userId: 2, providerId: 101, providerName: 'Dr. Sarah Jenkins, MD' },
  ];

  async getProviderMappings(): Promise<AdminProviderMapping[]> {
    return [...this.providerMappings];
  }

  async mapUserProvider(userId: EntityId, doctorId: EntityId): Promise<AdminProviderMapping> {
    const providers = await this.getAvailableProviders();
    const provider = providers.find((p) => String(p.id) === String(doctorId));
    const newMapping: AdminProviderMapping = {
      userId,
      providerId: doctorId,
      providerName: provider ? provider.name : `Doctor #${doctorId}`,
    };
    this.providerMappings = [
      ...this.providerMappings.filter((m) => String(m.userId) !== String(userId)),
      newMapping,
    ];
    return newMapping;
  }

  async unmapUserProvider(userId: EntityId): Promise<void> {
    this.providerMappings = this.providerMappings.filter(
      (m) => String(m.userId) !== String(userId)
    );
  }

  async getAvailableProviders(): Promise<AdminProviderOption[]> {
    return [
      { id: 101, name: 'Dr. Sarah Jenkins, MD', code: 'DOC-101' },
      { id: 102, name: 'Dr. Robert Chen, MD', code: 'DOC-102' },
      { id: 103, name: 'Dr. Maria Rodriguez, MD', code: 'DOC-103' },
      { id: 104, name: 'Dr. James Wilson, MD', code: 'DOC-104' },
    ];
  }
}
