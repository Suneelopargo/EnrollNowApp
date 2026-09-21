import axiosInstance from '../api/axiosInstance';
import {
  AdministratorApi,
  AdminDashboard,
  AdminUser,
  CreateUserRequest,
  UpdateUserRequest,
  UserQuery,
  AdminRole,
  CreateRoleRequest,
  UpdateRoleRequest,
  PermissionModule,
  RolePermission,
  UserRoleAssignment,
  AdminLocationOption,
  AdminLocationAccess,
  AdminAuditPage,
  AuditQuery,
  ResetPasswordRequest,
  AdministratorApiError,
  EntityId,
} from '@aiventrahealth/administrator-ui';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
}

function handleAxiosError(err: any, fallbackMessage: string): never {
  const message = err.response?.data?.message || err.message || fallbackMessage;
  const status = err.response?.status;
  const code = err.code || 'HTTP_ERROR';
  throw new AdministratorApiError({
    message,
    status,
    code,
    originalError: err,
  });
}

export const enrollNowAdministratorApi: AdministratorApi = {
  // =========================================================================
  // DASHBOARD
  // =========================================================================
  getDashboard: async (): Promise<AdminDashboard> => {
    try {
      const response = await axiosInstance.get<ApiResponse<any>>('/api/administrator/dashboard');
      const d = response.data.data;
      return {
        totalUsers: d.totalUsers || 0,
        activeUsers: d.activeUsers || 0,
        inactiveUsers: d.inactiveUsers || 0,
        adminUsers: d.adminUsers || 0,
        activeLocations: d.activeLocations || 0,
        usersByRole: (d.usersByRole || []).map((r: any) => ({
          role: r.role,
          count: Number(r.count),
        })),
        usersByLocation: (d.usersByLocation || []).map((l: any) => ({
          locationId: l.locationId,
          locationName: l.locationName,
          count: Number(l.count),
        })),
        recentActivity: (d.recentActivity || []).map((a: any) => ({
          id: a.id,
          performedBy: a.performedBy,
          performedByUsername: a.performedByUsername,
          targetUserId: a.targetUserId,
          targetUsername: a.targetUsername,
          action: a.action,
          details: a.details,
          ipAddress: a.ipAddress,
          locationId: a.locationId,
          createdAt: a.createdAt,
        })),
      };
    } catch (err) {
      handleAxiosError(err, 'Failed to retrieve administrative dashboard metrics');
    }
  },

  // =========================================================================
  // USERS
  // =========================================================================
  getUsers: async (query?: UserQuery): Promise<AdminUser[]> => {
    try {
      const response = await axiosInstance.get<ApiResponse<any[]>>('/api/administrator/users', {
        params: query,
      });
      const rawList = response.data.data || [];
      return rawList.map((u: any): AdminUser => ({
        id: u.id,
        username: u.username,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        active: Boolean(u.active),
        roles: u.roles || [],
        roleAssignments: u.roleAssignments,
        assignedLocations: (u.assignedLocations || []).map((loc: any): AdminLocationAccess => ({
          assignmentId: loc.assignmentId,
          userId: loc.userId,
          locationId: loc.locationId,
          locationCode: loc.locationCode,
          locationName: loc.locationName,
          city: loc.city,
          state: loc.state,
          status: loc.status,
        })),
        createdDate: u.createdDate,
        updatedDate: u.updatedDate,
      }));
    } catch (err) {
      handleAxiosError(err, 'Failed to retrieve user list');
    }
  },

  getUser: async (id: EntityId): Promise<AdminUser> => {
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(`/api/administrator/users/${id}`);
      const u = response.data.data;
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: u.fullName,
        active: Boolean(u.active),
        roles: u.roles || [],
        roleAssignments: u.roleAssignments,
        assignedLocations: u.assignedLocations,
        createdDate: u.createdDate,
        updatedDate: u.updatedDate,
      };
    } catch (err) {
      handleAxiosError(err, `Failed to retrieve user ${id}`);
    }
  },

  createUser: async (request: CreateUserRequest): Promise<AdminUser> => {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>('/api/administrator/users', request);
      const u = response.data.data;
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: u.fullName,
        active: Boolean(u.active),
        roles: u.roles || [],
      };
    } catch (err) {
      handleAxiosError(err, 'Failed to create user account');
    }
  },

  updateUser: async (id: EntityId, request: UpdateUserRequest): Promise<AdminUser> => {
    try {
      const response = await axiosInstance.put<ApiResponse<any>>(`/api/administrator/users/${id}`, request);
      const u = response.data.data;
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: u.fullName,
        active: Boolean(u.active),
        roles: u.roles || [],
      };
    } catch (err) {
      handleAxiosError(err, `Failed to update user account ${id}`);
    }
  },

  activateUser: async (id: EntityId): Promise<void> => {
    try {
      await axiosInstance.post<ApiResponse<any>>(`/api/administrator/users/${id}/activate`);
    } catch (err) {
      handleAxiosError(err, `Failed to activate user ${id}`);
    }
  },

  deactivateUser: async (id: EntityId): Promise<void> => {
    try {
      await axiosInstance.post<ApiResponse<any>>(`/api/administrator/users/${id}/deactivate`);
    } catch (err) {
      handleAxiosError(err, `Failed to deactivate user ${id}`);
    }
  },

  resetPassword: async (id: EntityId, request: ResetPasswordRequest): Promise<void> => {
    try {
      await axiosInstance.post<ApiResponse<void>>(`/api/administrator/users/${id}/reset-password`, request);
    } catch (err) {
      handleAxiosError(err, `Failed to reset password for user ${id}`);
    }
  },

  // =========================================================================
  // ROLES & RBAC
  // =========================================================================
  getRoles: async (): Promise<AdminRole[]> => {
    try {
      const response = await axiosInstance.get<ApiResponse<any[]>>('/api/administrator/roles');
      return (response.data.data || []).map((r: any): AdminRole => ({
        id: r.id,
        name: r.name,
        roleCode: r.roleCode,
        cleanName: r.roleCode?.replace('ROLE_', '').replace(/_/g, ' '),
        description: r.description,
        status: r.status,
        userCount: r.userCount || 0,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    } catch (err) {
      handleAxiosError(err, 'Failed to retrieve roles');
    }
  },

  getRole: async (id: EntityId): Promise<AdminRole> => {
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(`/api/administrator/roles/${id}`);
      const r = response.data.data;
      return {
        id: r.id,
        name: r.name,
        roleCode: r.roleCode,
        cleanName: r.roleCode?.replace('ROLE_', '').replace(/_/g, ' '),
        description: r.description,
        status: r.status,
        userCount: r.userCount || 0,
      };
    } catch (err) {
      handleAxiosError(err, `Failed to retrieve role ${id}`);
    }
  },

  createRole: async (request: CreateRoleRequest): Promise<AdminRole> => {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>('/api/administrator/roles', request);
      const r = response.data.data;
      return {
        id: r.id,
        name: r.name,
        roleCode: r.roleCode,
        cleanName: r.roleCode?.replace('ROLE_', '').replace(/_/g, ' '),
        description: r.description,
        status: r.status,
      };
    } catch (err) {
      handleAxiosError(err, 'Failed to create role');
    }
  },

  updateRole: async (id: EntityId, request: UpdateRoleRequest): Promise<AdminRole> => {
    try {
      const response = await axiosInstance.put<ApiResponse<any>>(`/api/administrator/roles/${id}`, request);
      const r = response.data.data;
      return {
        id: r.id,
        name: r.name,
        roleCode: r.roleCode,
        cleanName: r.roleCode?.replace('ROLE_', '').replace(/_/g, ' '),
        description: r.description,
        status: r.status,
      };
    } catch (err) {
      handleAxiosError(err, `Failed to update role ${id}`);
    }
  },

  setRoleStatus: async (id: EntityId, status: string): Promise<AdminRole> => {
    try {
      const response = await axiosInstance.patch<ApiResponse<any>>(`/api/administrator/roles/${id}/status`, null, {
        params: { status },
      });
      const r = response.data.data;
      return {
        id: r.id,
        name: r.name,
        roleCode: r.roleCode,
        status: r.status,
      };
    } catch (err) {
      handleAxiosError(err, `Failed to update role status ${id}`);
    }
  },

  getRolePermissions: async (roleId: EntityId): Promise<PermissionModule[]> => {
    try {
      const response = await axiosInstance.get<ApiResponse<any[]>>(`/api/administrator/roles/${roleId}/permissions`);
      return (response.data.data || []).map((m: any): PermissionModule => ({
        moduleId: m.moduleId,
        moduleCode: m.moduleCode,
        title: m.title,
        shortTitle: m.shortTitle,
        icon: m.icon,
        displayOrder: m.displayOrder,
        links: (m.links || []).map((l: any) => ({
          linkId: l.linkId,
          linkCode: l.linkCode,
          title: l.title,
          path: l.path,
          icon: l.icon,
          description: l.description,
          displayOrder: l.displayOrder,
          canView: Boolean(l.canView),
          canCreate: Boolean(l.canCreate),
          canEdit: Boolean(l.canEdit),
          canDelete: Boolean(l.canDelete),
          canExport: Boolean(l.canExport),
        })),
      }));
    } catch (err) {
      handleAxiosError(err, `Failed to retrieve permissions for role ${roleId}`);
    }
  },

  saveRolePermissions: async (roleId: EntityId, permissions: RolePermission[]): Promise<PermissionModule[]> => {
    try {
      const response = await axiosInstance.put<ApiResponse<any[]>>(`/api/administrator/roles/${roleId}/permissions`, permissions);
      return (response.data.data || []).map((m: any): PermissionModule => ({
        moduleId: m.moduleId,
        moduleCode: m.moduleCode,
        title: m.title,
        shortTitle: m.shortTitle,
        icon: m.icon,
        displayOrder: m.displayOrder,
        links: (m.links || []).map((l: any) => ({
          linkId: l.linkId,
          linkCode: l.linkCode,
          title: l.title,
          path: l.path,
          canView: Boolean(l.canView),
          canCreate: Boolean(l.canCreate),
          canEdit: Boolean(l.canEdit),
          canDelete: Boolean(l.canDelete),
          canExport: Boolean(l.canExport),
        })),
      }));
    } catch (err) {
      handleAxiosError(err, `Failed to update permissions for role ${roleId}`);
    }
  },

  // =========================================================================
  // MULTI-ROLE ASSIGNMENTS
  // =========================================================================
  getUserRoleAssignments: async (userId: EntityId): Promise<UserRoleAssignment[]> => {
    try {
      const response = await axiosInstance.get<ApiResponse<any[]>>(`/api/administrator/users/${userId}/role-assignments`);
      return (response.data.data || []).map((a: any): UserRoleAssignment => ({
        roleId: a.roleId,
        roleName: a.roleName,
        roleCode: a.roleCode,
        description: a.description,
        validFrom: a.validFrom,
        validUntil: a.validUntil,
        status: a.status || 'ACTIVE',
        isCurrentlyValid: a.currentlyValid,
      }));
    } catch (err) {
      handleAxiosError(err, `Failed to retrieve role assignments for user ${userId}`);
    }
  },

  saveUserRoleAssignments: async (userId: EntityId, assignments: UserRoleAssignment[]): Promise<AdminUser> => {
    try {
      const response = await axiosInstance.put<ApiResponse<any>>(`/api/administrator/users/${userId}/role-assignments`, assignments);
      const u = response.data.data;
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        active: Boolean(u.active),
        roles: u.roles || [],
      };
    } catch (err) {
      handleAxiosError(err, `Failed to save role assignments for user ${userId}`);
    }
  },

  // =========================================================================
  // SITE (LOCATION) ACCESS
  // =========================================================================
  getLocations: async (): Promise<AdminLocationOption[]> => {
    try {
      const response = await axiosInstance.get<ApiResponse<any[]>>('/api/administrator/locations');
      return (response.data.data || []).map((l: any): AdminLocationOption => ({
        id: l.id,
        name: l.name,
        code: l.code,
        city: l.city,
        state: l.state,
      }));
    } catch (err) {
      handleAxiosError(err, 'Failed to retrieve sites');
    }
  },

  getUserLocations: async (userId: EntityId): Promise<AdminLocationAccess[]> => {
    try {
      const response = await axiosInstance.get<ApiResponse<any[]>>(`/api/administrator/users/${userId}/locations`);
      return (response.data.data || []).map((l: any): AdminLocationAccess => ({
        assignmentId: l.assignmentId,
        userId: l.userId,
        locationId: l.locationId,
        locationCode: l.locationCode,
        locationName: l.locationName,
        city: l.city,
        state: l.state,
        status: l.status,
      }));
    } catch (err) {
      handleAxiosError(err, `Failed to retrieve sites for user ${userId}`);
    }
  },

  saveUserLocations: async (userId: EntityId, locationIds: EntityId[]): Promise<AdminLocationAccess[]> => {
    try {
      const response = await axiosInstance.put<ApiResponse<any[]>>(
        `/api/administrator/users/${userId}/locations`,
        locationIds.map((id) => Number(id))
      );
      return (response.data.data || []).map((l: any): AdminLocationAccess => ({
        assignmentId: l.assignmentId,
        userId: l.userId,
        locationId: l.locationId,
        locationCode: l.locationCode,
        locationName: l.locationName,
        city: l.city,
        state: l.state,
        status: l.status,
      }));
    } catch (err) {
      handleAxiosError(err, `Failed to save site assignments for user ${userId}`);
    }
  },

  // =========================================================================
  // AUDIT LOGS
  // =========================================================================
  getAuditLogs: async (query?: AuditQuery): Promise<AdminAuditPage> => {
    try {
      const response = await axiosInstance.get<ApiResponse<any>>('/api/administrator/audit-logs', {
        params: query,
      });
      const data = response.data.data;
      return {
        content: (data?.content || []).map((a: any) => ({
          id: a.id,
          performedBy: a.performedBy,
          performedByUsername: a.performedByUsername,
          targetUserId: a.targetUserId,
          targetUsername: a.targetUsername,
          action: a.action,
          details: a.details,
          ipAddress: a.ipAddress,
          locationId: a.locationId,
          createdAt: a.createdAt,
        })),
        totalElements: data?.totalElements || 0,
        totalPages: data?.totalPages || 1,
      };
    } catch (err) {
      handleAxiosError(err, 'Failed to retrieve administrative audit logs');
    }
  },
};
