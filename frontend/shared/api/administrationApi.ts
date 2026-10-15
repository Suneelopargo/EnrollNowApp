// frontend/shared/api/administrationApi.ts - Authoritative Centralized Administration API
import { apiClient } from '../api-client';
import { getTenantId } from '../api-config';

export interface UserStudyAccessResponse {
  id: string;
  name: string;
  studyRole?: string | null;
  studyPermission?: string | null;
}

export interface UserSummaryResponse {
  id: string;
  firstName: string;
  lastName: string;
  title?: string | null;
  status: 'ACTIVE' | 'DISABLED' | string;
  primaryEmail: string;
}

export interface UserListItemResponse {
  id: string;
  firstName: string;
  lastName: string;
  title?: string | null;
  primaryEmail: string;
  status: 'ACTIVE' | 'DISABLED' | string;
  sitePermission: string | null;
  studies: UserStudyAccessResponse[];
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  title?: string;
  timezone?: string;
  email: string;
}

export interface UpdateUserPayload {
  firstName: string;
  lastName: string;
  title?: string;
  timezone?: string;
}

export interface AssignRolePayload {
  roleCode: string;
  scopeType: 'TENANT' | 'SITE' | 'STUDY';
  scopeId: string;
}

export interface GrantStudyAccessPayload {
  studyRole: string;
  studyPermission: string;
}

export const STUDY_PERMISSION_TO_ROLE_CODE: Record<string, string> = {
  'Admin': 'STUDY_ADMIN',
  'Leader': 'STUDY_LEADER',
  'RA': 'STUDY_RA',
  'Read Only': 'STUDY_READ_ONLY',
  'ReadOnly': 'STUDY_READ_ONLY',
  'STUDY_ADMIN': 'STUDY_ADMIN',
  'STUDY_LEADER': 'STUDY_LEADER',
  'STUDY_RA': 'STUDY_RA',
  'STUDY_READ_ONLY': 'STUDY_READ_ONLY',
};

export const ROLE_CODE_TO_STUDY_PERMISSION: Record<string, string> = {
  'STUDY_ADMIN': 'Admin',
  'STUDY_LEADER': 'Leader',
  'STUDY_RA': 'RA',
  'STUDY_READ_ONLY': 'Read Only',
};

export function normalizeStudyPermission(perm?: string | null): string {
  if (!perm) return 'STUDY_ADMIN';
  const trimmed = perm.trim();
  if (STUDY_PERMISSION_TO_ROLE_CODE[trimmed]) {
    return STUDY_PERMISSION_TO_ROLE_CODE[trimmed];
  }
  const clean = trimmed.toUpperCase();
  if (clean === 'ADMIN' || clean === 'STUDY_ADMIN') return 'STUDY_ADMIN';
  if (clean === 'LEADER' || clean === 'STUDY_LEADER') return 'STUDY_LEADER';
  if (clean === 'RA' || clean === 'STUDY_RA') return 'STUDY_RA';
  if (clean === 'READ ONLY' || clean === 'READONLY' || clean === 'STUDY_READ_ONLY') return 'STUDY_READ_ONLY';
  return clean;
}

export function toStudyPermissionLabel(roleCode?: string | null): string {
  if (!roleCode) return 'Admin';
  return ROLE_CODE_TO_STUDY_PERMISSION[roleCode] || roleCode;
}

function resolveTenantId(tenantId?: string): string {
  const tid = (tenantId || getTenantId())?.trim();
  if (!tid) {
    throw new Error('Tenant context is required for user administration operations. No valid tenant found.');
  }
  return tid;
}

export const administrationApi = {
  /**
   * GET /api/v1/tenants/{tenantId}/users
   * Retrieves the basic user summary list.
   */
  async getUsers(tenantId?: string): Promise<UserSummaryResponse[]> {
    const tid = resolveTenantId(tenantId);
    const res = await apiClient.get<UserSummaryResponse[]>(`/api/v1/tenants/${tid}/users`);
    return Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
  },

  /**
   * GET /api/v1/tenants/{tenantId}/users/details
   * Retrieves users enriched with active study-access details.
   */
  async getDetailedUsers(tenantId?: string): Promise<UserListItemResponse[]> {
    const tid = resolveTenantId(tenantId);
    const res = await apiClient.get<UserListItemResponse[]>(`/api/v1/tenants/${tid}/users/details`);
    return Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
  },

  /**
   * GET /api/v1/tenants/{tenantId}/users/{userId}
   * Retrieves single user summary details by ID.
   */
  async getUser(userId: string | number, tenantId?: string): Promise<UserSummaryResponse> {
    const tid = resolveTenantId(tenantId);
    const res = await apiClient.get<UserSummaryResponse>(`/api/v1/tenants/${tid}/users/${userId}`);
    return res.data;
  },

  /**
   * POST /api/v1/tenants/{tenantId}/users
   * Creates a new user record in the specified tenant.
   */
  async createUser(payload: CreateUserPayload, tenantId?: string): Promise<UserSummaryResponse> {
    const tid = resolveTenantId(tenantId);
    const res = await apiClient.post<UserSummaryResponse>(`/api/v1/tenants/${tid}/users`, {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      title: payload.title?.trim() || 'Study Coordinator',
      timezone: payload.timezone?.trim() || 'America/New_York',
      email: payload.email.trim(),
    });
    return res.data;
  },

  /**
   * PUT /api/v1/tenants/{tenantId}/users/{userId}
   * Updates user mutable fields (firstName, lastName, title, timezone).
   * Note: Email is intentionally immutable through this endpoint.
   */
  async updateUser(userId: string | number, payload: UpdateUserPayload, tenantId?: string): Promise<UserSummaryResponse> {
    const tid = resolveTenantId(tenantId);
    const res = await apiClient.put<UserSummaryResponse>(`/api/v1/tenants/${tid}/users/${userId}`, {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      title: payload.title !== undefined ? payload.title.trim() : null,
      timezone: payload.timezone !== undefined ? payload.timezone.trim() : 'America/New_York',
    });
    return res.data;
  },

  /**
   * PUT /api/v1/tenants/{tenantId}/users/{userId}/deactivate
   * Performs soft deactivation; sets status to DISABLED.
   */
  async deactivateUser(userId: string | number, tenantId?: string): Promise<UserSummaryResponse> {
    const tid = resolveTenantId(tenantId);
    const res = await apiClient.put<UserSummaryResponse>(`/api/v1/tenants/${tid}/users/${userId}/deactivate`);
    return res.data;
  },

  /**
   * PUT /api/v1/tenants/{tenantId}/users/{userId}/activate
   * Reactivates / unlocks a user; sets status to ACTIVE.
   */
  async activateUser(userId: string | number, tenantId?: string): Promise<UserSummaryResponse> {
    const tid = resolveTenantId(tenantId);
    const res = await apiClient.put<UserSummaryResponse>(`/api/v1/tenants/${tid}/users/${userId}/activate`);
    return res.data;
  },

  /**
   * POST /api/v1/tenants/{tenantId}/users/{userId}/roles
   * Assigns a scoped role to a user.
   */
  async assignScopedRole(userId: string | number, payload: AssignRolePayload, tenantId?: string): Promise<any> {
    const tid = resolveTenantId(tenantId);
    const res = await apiClient.post(`/api/v1/tenants/${tid}/users/${userId}/roles`, payload);
    return res.data;
  },

  /**
   * PUT /api/v1/roles/{roleCode}/permissions
   * Replaces role permission mappings.
   */
  async updateRolePermissions(roleCode: string, permissionCodes: string[]): Promise<void> {
    await apiClient.put(`/api/v1/roles/${encodeURIComponent(roleCode)}/permissions`, {
      permissionCodes,
    });
  },

  /**
   * POST /api/v1/tenants/{tenantId}/studies/{studyId}/users/{userId}/access
   * Grants or replaces active study access for a user.
   */
  async grantStudyAccess(
    studyId: string,
    userId: string | number,
    payload: GrantStudyAccessPayload,
    tenantId?: string
  ): Promise<void> {
    const tid = resolveTenantId(tenantId);
    const cleanStudyId = String(studyId).trim().replace(/^\/+|\/+$/g, '');
    const cleanUserId = String(userId).trim().replace(/^\/+|\/+$/g, '');
    const permissionCode = normalizeStudyPermission(payload.studyPermission);
    const roleMetadata = payload.studyRole?.trim() || 'Study Coordinator';

    await apiClient.post(`/api/v1/tenants/${tid}/studies/${cleanStudyId}/users/${cleanUserId}/access`, {
      studyRole: roleMetadata,
      studyPermission: permissionCode,
    });
  },

  /**
   * DELETE /api/v1/tenants/{tenantId}/studies/{studyId}/users/{userId}/access
   * Soft removes study access (marks active=false).
   */
  async removeStudyAccess(studyId: string, userId: string | number, tenantId?: string): Promise<void> {
    const tid = resolveTenantId(tenantId);
    const cleanStudyId = String(studyId).trim().replace(/^\/+|\/+$/g, '');
    const cleanUserId = String(userId).trim().replace(/^\/+|\/+$/g, '');
    await apiClient.delete(`/api/v1/tenants/${tid}/studies/${cleanStudyId}/users/${cleanUserId}/access`);
  },

  /**
   * GET /api/v1/tenants/{tenantId}/users/{userId}/studies
   * Retrieves all active studies assigned to the user.
   */
  async getUserStudies(userId: string | number, tenantId?: string): Promise<any[]> {
    const tid = resolveTenantId(tenantId);
    const res = await apiClient.get(`/api/v1/tenants/${tid}/users/${userId}/studies`);
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * POST /api/v1/tenants/{tenantId}/users/{userId}/send-invitation
   * Sends user invitation / first-time activation email.
   */
  async sendUserInvitation(userId: string | number, tenantId?: string): Promise<{ message: string }> {
    const tid = resolveTenantId(tenantId);
    const res = await apiClient.post<{ message: string }>(`/api/v1/tenants/${tid}/users/${userId}/send-invitation`);
    return res.data;
  },

  /**
   * POST /api/v1/tenants/{tenantId}/auth/forgot-password
   * Initiates password recovery workflow for a user by email.
   */
  async requestPasswordReset(email: string, tenantId?: string): Promise<{ message: string; resetToken?: string }> {
    const tid = resolveTenantId(tenantId);
    const res = await apiClient.post<{ message: string; resetToken?: string }>(`/api/v1/tenants/${tid}/auth/forgot-password`, {
      email: email.trim(),
    });
    return res.data;
  },

  // Supporting views compatibility methods
  async getDashboard(): Promise<any> {
    try {
      const res = await apiClient.get('/api/v1/administrator/dashboard');
      return res.data?.data;
    } catch {
      return null;
    }
  },

  async getLocations(): Promise<any[]> {
    try {
      const res = await apiClient.get('/api/v1/administrator/locations');
      return res.data?.data || [];
    } catch {
      return [];
    }
  },

  async getRoles(): Promise<any[]> {
    try {
      const res = await apiClient.get('/api/v1/administrator/roles');
      return res.data?.data || [];
    } catch {
      return [];
    }
  },

  async getAuditLogs(query?: Record<string, any>): Promise<any[]> {
    try {
      const res = await apiClient.get('/api/v1/administrator/audit-logs', { params: query });
      return res.data?.data || [];
    } catch {
      return [];
    }
  },
};

export default administrationApi;
