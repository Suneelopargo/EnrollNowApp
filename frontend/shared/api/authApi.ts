// frontend/shared/api/authApi.ts - Centralized Authentication API
import { apiClient } from '../api-client';
import { getApiMode, getTenantId } from '../api-config';
import { AuthUser, SiteRoleAssignmentSummary } from '../contracts';
import { normalizeSiteRoleCode, toSitePermissionLabel } from './administrationApi';

export interface LoginCredentials {
  username?: string;
  usernameOrEmail?: string;
  password?: string;
  tenantId?: string;
}

export interface LoginResponseData {
  token?: string;
  accessToken?: string;
  user?: AuthUser;
}

export interface AuthApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  correlationId?: string;
}

export interface ActivateAccountRequest {
  tenantId?: string;
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ActivateAccountResponse {
  message?: string;
  error?: string;
}

export interface ForgotPasswordRequest {
  tenantId?: string;
  email: string;
}

export interface ForgotPasswordResponse {
  message?: string;
  resetToken?: string;
}

export interface ResetPasswordRequest {
  tenantId?: string;
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message?: string;
}

const CANONICAL_ROLE_PERMISSIONS: Record<string, string[]> = {
  SITE_ADMIN: [
    'REGISTRY_VIEW',
    'REGISTRY_MANAGE',
    'SITE_ADMIN_ACCESS',
    'SITE_STUDIES_VIEW',
    'SITE_STUDIES_CREATE',
    'SITE_ALL_STUDIES_MANAGE',
    'SITE_USERS_VIEW',
    'SITE_USERS_MANAGE',
    'SITE_ADMIN_USERS_MANAGE',
    'SITE_IMPORT_EXPORT',
    'SITE_AUDIT_LOG_VIEW',
    'SITE_SECURITY_MANAGE',
    'SITE_SETTINGS_VIEW',
    'SITE_SETTINGS_MANAGE',
  ],
  SITE_MANAGER: [
    'REGISTRY_VIEW',
    'REGISTRY_MANAGE',
    'SITE_ADMIN_ACCESS',
    'SITE_STUDIES_VIEW',
    'SITE_STUDIES_CREATE',
    'SITE_USERS_VIEW',
    'SITE_USERS_MANAGE',
    'SITE_IMPORT_EXPORT',
    'SITE_SETTINGS_VIEW',
  ],
  SITE_REGISTRY: [
    'REGISTRY_VIEW',
    'REGISTRY_MANAGE',
  ],
};

export function deriveUserAccessFlags(rawUser: Partial<AuthUser> & Record<string, any>): AuthUser {
  const rawRoles: string[] = Array.isArray(rawUser.roles)
    ? rawUser.roles.filter(Boolean).map((r: string) => String(r).trim())
    : [];
  const upperRoles = rawRoles.map((r) => r.toUpperCase());

  let effectiveSiteRole: 'SITE_ADMIN' | 'SITE_MANAGER' | 'SITE_REGISTRY' | 'NONE' = 'NONE';
  if (rawUser.siteRole) {
    effectiveSiteRole = normalizeSiteRoleCode(rawUser.siteRole);
  } else if (rawUser.sitePermission) {
    effectiveSiteRole = normalizeSiteRoleCode(rawUser.sitePermission);
  } else if (
    upperRoles.includes('SITE_ADMIN') ||
    upperRoles.includes('ROLE_SITE_ADMIN') ||
    upperRoles.includes('ROLE_SUPER_ADMIN') ||
    upperRoles.includes('SUPER_ADMIN') ||
    upperRoles.includes('ROLE_ADMIN') ||
    upperRoles.includes('ADMIN')
  ) {
    effectiveSiteRole = 'SITE_ADMIN';
  } else if (
    upperRoles.includes('SITE_MANAGER') ||
    upperRoles.includes('ROLE_SITE_MANAGER')
  ) {
    effectiveSiteRole = 'SITE_MANAGER';
  } else if (
    upperRoles.includes('SITE_REGISTRY') ||
    upperRoles.includes('ROLE_SITE_REGISTRY')
  ) {
    effectiveSiteRole = 'SITE_REGISTRY';
  }

  const roleSet = new Set<string>(rawRoles);
  if (effectiveSiteRole !== 'NONE') {
    roleSet.add(effectiveSiteRole);
    roleSet.add(`ROLE_${effectiveSiteRole}`);
  }

  const rawPermissions: string[] = Array.isArray(rawUser.permissions)
    ? rawUser.permissions.filter(Boolean).map((p: string) => String(p).trim().toUpperCase())
    : [];
  const permSet = new Set<string>(rawPermissions);

  const canonicalPerms = CANONICAL_ROLE_PERMISSIONS[effectiveSiteRole] || [];
  for (const p of canonicalPerms) {
    permSet.add(p);
  }

  const canAccessRegistry =
    typeof rawUser.canAccessRegistry === 'boolean'
      ? rawUser.canAccessRegistry
      : effectiveSiteRole === 'SITE_ADMIN' ||
        effectiveSiteRole === 'SITE_MANAGER' ||
        effectiveSiteRole === 'SITE_REGISTRY' ||
        permSet.has('REGISTRY_VIEW');

  const canAccessSiteAdmin =
    typeof rawUser.canAccessSiteAdmin === 'boolean'
      ? rawUser.canAccessSiteAdmin
      : effectiveSiteRole === 'SITE_ADMIN' ||
        effectiveSiteRole === 'SITE_MANAGER' ||
        permSet.has('SITE_ADMIN_ACCESS');

  const canManageSiteAdmins =
    typeof rawUser.canManageSiteAdmins === 'boolean'
      ? rawUser.canManageSiteAdmins
      : effectiveSiteRole === 'SITE_ADMIN' ||
        permSet.has('SITE_ADMIN_USERS_MANAGE');

  if (canAccessRegistry) {
    permSet.add('REGISTRY_VIEW');
  }
  if (canAccessSiteAdmin) {
    permSet.add('SITE_ADMIN_ACCESS');
  }
  if (canManageSiteAdmins) {
    permSet.add('SITE_ADMIN_USERS_MANAGE');
  }

  const siteAssignments: SiteRoleAssignmentSummary[] = Array.isArray(rawUser.siteAssignments)
    ? rawUser.siteAssignments
    : [];

  return {
    ...rawUser,
    id: rawUser.id ?? rawUser.userId ?? '',
    username: rawUser.username || rawUser.email || rawUser.primaryEmail || '',
    email: rawUser.email || rawUser.primaryEmail || rawUser.username || '',
    firstName: rawUser.firstName,
    lastName: rawUser.lastName,
    fullName:
      rawUser.fullName ||
      `${rawUser.firstName || ''} ${rawUser.lastName || ''}`.trim() ||
      rawUser.username ||
      rawUser.email ||
      '',
    roles: Array.from(roleSet),
    permissions: Array.from(permSet),
    siteId: rawUser.siteId ?? null,
    siteRole: effectiveSiteRole,
    sitePermissionLabel:
      rawUser.sitePermissionLabel || toSitePermissionLabel(effectiveSiteRole),
    siteAssignments,
    canAccessRegistry,
    canAccessSiteAdmin,
    canManageSiteAdmins,
    active: typeof rawUser.active === 'boolean' ? rawUser.active : rawUser.status !== 'DISABLED',
    tenantId: rawUser.tenantId,
  };
}

export function userHasRole(user: AuthUser | null | undefined, role: string): boolean {
  if (!user || !role) return false;
  const target = role.trim().toUpperCase();
  const normalizedTarget = target.startsWith('ROLE_') ? target.slice(5) : target;

  const userRoles = (user.roles || []).map((r) => r.trim().toUpperCase());
  if (
    userRoles.includes(target) ||
    userRoles.includes(normalizedTarget) ||
    userRoles.includes(`ROLE_${normalizedTarget}`)
  ) {
    return true;
  }

  if (user.siteRole && user.siteRole.toUpperCase() === normalizedTarget) {
    return true;
  }

  return false;
}

export function userHasPermission(user: AuthUser | null | undefined, permission: string): boolean {
  if (!user || !permission) return false;
  const target = permission.trim().toUpperCase();

  if (Array.isArray(user.permissions) && user.permissions.some((p) => p.toUpperCase() === target)) {
    return true;
  }

  if (target === 'REGISTRY_VIEW') {
    return userHasRegistryAccess(user);
  }
  if (target === 'SITE_ADMIN_ACCESS') {
    return userHasSiteAdminAccess(user);
  }
  if (target === 'SITE_ADMIN_USERS_MANAGE') {
    return userIsFullSiteAdmin(user);
  }

  return userHasRole(user, target);
}

export function userHasRegistryAccess(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (typeof user.canAccessRegistry === 'boolean') {
    return user.canAccessRegistry;
  }
  return (
    userHasRole(user, 'SITE_ADMIN') ||
    userHasRole(user, 'SITE_MANAGER') ||
    userHasRole(user, 'SITE_REGISTRY') ||
    userHasRole(user, 'ROLE_SUPER_ADMIN') ||
    Boolean(user.permissions?.some((p) => p.toUpperCase() === 'REGISTRY_VIEW'))
  );
}

export function userHasSiteAdminAccess(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (typeof user.canAccessSiteAdmin === 'boolean') {
    return user.canAccessSiteAdmin;
  }
  return (
    userHasRole(user, 'SITE_ADMIN') ||
    userHasRole(user, 'SITE_MANAGER') ||
    userHasRole(user, 'ROLE_SUPER_ADMIN') ||
    userHasRole(user, 'ADMIN') ||
    Boolean(user.permissions?.some((p) => p.toUpperCase() === 'SITE_ADMIN_ACCESS'))
  );
}

export function userIsFullSiteAdmin(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (typeof user.canManageSiteAdmins === 'boolean') {
    return user.canManageSiteAdmins;
  }
  return (
    userHasRole(user, 'SITE_ADMIN') ||
    userHasRole(user, 'ROLE_SUPER_ADMIN') ||
    userHasRole(user, 'ADMIN') ||
    Boolean(user.permissions?.some((p) => p.toUpperCase() === 'SITE_ADMIN_USERS_MANAGE'))
  );
}

export const authApi = {
  /**
   * Performs user login using credentials.
   * In real mode: calls documented POST /api/v1/tenants/{tenantId}/auth/login
   * In mock mode: calls /api/v1/auth/login handled by mockAdapter
   */
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> {
    const username = (credentials.username || credentials.usernameOrEmail || '').trim();
    const password = credentials.password || '';

    const mode = getApiMode();

    if (mode === 'real') {
      const tenantId = credentials.tenantId || getTenantId() || '11111111-1111-1111-1111-111111111111';
      const payload = {
        email: username,
        password,
      };

      const res = await apiClient.post<any>(`/api/v1/tenants/${tenantId}/auth/login`, payload);
      const data = res.data?.data || res.data;

      const token = data?.accessToken || data?.token;
      if (!token) {
        throw new Error('Authentication failed: Missing access token in server response');
      }

      const resolvedTenantId = data.tenantId || tenantId;
      const userId = data.userId || data.id;

      let profileData: Record<string, any> = { ...data };

      // If login response did not include effective roles/siteRole, attempt to load user profile
      if (!Array.isArray(data.roles) && !data.siteRole && userId && typeof apiClient.get === 'function') {
        try {
          const profileRes = await apiClient.get<any>(
            `/api/v1/tenants/${resolvedTenantId}/users/${userId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 8000,
            } as any
          );
          if (profileRes?.data) {
            profileData = { ...profileData, ...profileRes.data };
          }
        } catch {
          // Proceed with login payload if secondary profile fetch is unavailable
        }
      }

      const user = deriveUserAccessFlags({
        id: userId,
        username: profileData.email || profileData.primaryEmail || username,
        email: profileData.email || profileData.primaryEmail || username,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        fullName: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || username,
        roles: Array.isArray(profileData.roles) ? profileData.roles : [],
        permissions: Array.isArray(profileData.permissions) ? profileData.permissions : [],
        siteId: profileData.siteId ?? null,
        siteRole: profileData.siteRole ?? profileData.sitePermission ?? 'NONE',
        sitePermissionLabel: profileData.sitePermissionLabel,
        siteAssignments: profileData.siteAssignments,
        canAccessRegistry: profileData.canAccessRegistry,
        canAccessSiteAdmin: profileData.canAccessSiteAdmin,
        canManageSiteAdmins: profileData.canManageSiteAdmins,
        active: true,
        tenantId: resolvedTenantId,
      });

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('enrollnow_tenant_id', resolvedTenantId);
      }

      return { user, token };
    }

    const payload = {
      usernameOrEmail: username,
      username,
      password,
    };

    const res = await apiClient.post<AuthApiResponse<LoginResponseData>>('/api/v1/auth/login', payload);

    if (!res.data || !res.data.data) {
      throw new Error('Authentication failed: Malformed response from Identity Service');
    }

    const data = res.data.data;
    const token = data.accessToken || data.token;
    const rawUser = data.user || {
      id: 1,
      username,
      email: `${username}@enrollnow.local`,
      roles: ['ROLE_SUPER_ADMIN'],
    };

    if (!token) {
      throw new Error('Authentication failed: Missing access token in server response');
    }

    const user = deriveUserAccessFlags(rawUser);
    return { user, token };
  },

  /**
   * Retrieves current authenticated user details from session endpoint.
   */
  async getCurrentUser(siteId?: string): Promise<AuthUser> {
    const mode = getApiMode();

    if (mode === 'real') {
      const storedUserRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('enrollnow_user') : null;
      if (storedUserRaw) {
        try {
          const parsed = JSON.parse(storedUserRaw);
          const tenantId = parsed.tenantId || getTenantId();
          const effectiveSiteId = siteId !== undefined ? siteId : parsed.siteId;
          if (tenantId && parsed.id) {
            const res = await apiClient.get<any>(`/api/v1/tenants/${tenantId}/users/${parsed.id}`, {
              params: effectiveSiteId ? { siteId: effectiveSiteId } : undefined,
              timeout: 8000,
            });
            if (res.data) {
              const u = res.data?.data || res.data;
              return deriveUserAccessFlags({
                ...parsed,
                id: u.id ?? parsed.id,
                username: u.primaryEmail || u.email || parsed.username,
                email: u.primaryEmail || u.email || parsed.email,
                firstName: u.firstName ?? parsed.firstName,
                lastName: u.lastName ?? parsed.lastName,
                fullName:
                  `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
                  parsed.fullName ||
                  parsed.username,
                roles: Array.isArray(u.roles) ? u.roles : (parsed.roles || []),
                permissions: Array.isArray(u.permissions) ? u.permissions : (parsed.permissions || []),
                siteId: 'siteId' in u ? u.siteId : parsed.siteId,
                siteRole: u.siteRole ?? u.sitePermission ?? parsed.siteRole ?? 'NONE',
                sitePermissionLabel: u.sitePermissionLabel ?? parsed.sitePermissionLabel,
                siteAssignments: Array.isArray(u.siteAssignments)
                  ? u.siteAssignments
                  : (parsed.siteAssignments || []),
                canAccessRegistry:
                  typeof u.canAccessRegistry === 'boolean' ? u.canAccessRegistry : undefined,
                canAccessSiteAdmin:
                  typeof u.canAccessSiteAdmin === 'boolean' ? u.canAccessSiteAdmin : undefined,
                canManageSiteAdmins:
                  typeof u.canManageSiteAdmins === 'boolean' ? u.canManageSiteAdmins : undefined,
                active: u.status ? u.status === 'ACTIVE' : parsed.active,
                tenantId: u.tenantId || tenantId,
              });
            }
          }
        } catch (err: any) {
          const status = err.status || err.response?.status;
          if (status === 401 || status === 403) {
            throw err;
          }
        }
        try {
          return deriveUserAccessFlags(JSON.parse(storedUserRaw));
        } catch {
          // ignore
        }
      }
    }

    const res = await apiClient.get<AuthApiResponse<AuthUser>>('/api/v1/auth/me', {
      timeout: 8000,
    });
    return deriveUserAccessFlags(res.data?.data || {});
  },

  /**
   * Performs lightweight passive session status check to detect server revocation (e.g. concurrent login elsewhere).
   * Uses X-Passive-Check: true so backend inactivity timer is not artificially reset.
   */
  async verifySessionStatus(): Promise<{ active: boolean; reason?: string; message?: string }> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('enrollnow_token') : null;
    if (!token) {
      return { active: false, reason: 'NO_TOKEN' };
    }

    const tenantId = getTenantId() || '11111111-1111-1111-1111-111111111111';
    try {
      const res = await apiClient.get<any>(`/api/v1/tenants/${tenantId}/auth/session-status`, {
        headers: {
          'X-Passive-Check': 'true',
          'X-Skip-Toast': 'true',
          'X-Skip-Loader': 'true',
        },
        skipLoader: true,
        silent: true,
        skipToast: true,
        timeout: 5000,
      } as any);

      return {
        active: Boolean(res?.data?.active !== false),
      };
    } catch (err: any) {
      const status = err.status || err.response?.status;
      if (status === 401 || status === 403) {
        const raw = err.raw || err.response?.data;
        const reason = raw?.reason || (raw?.message?.includes('another browser') ? 'NEW_LOGIN' : 'UNAUTHORIZED');
        return {
          active: false,
          reason,
          message: raw?.message,
        };
      }
      // Transient network errors do not immediately invalidate session
      return { active: true };
    }
  },

  /**
   * Activates a new user account with initial password.
   * Calls POST /api/v1/tenants/{tenantId}/auth/activate
   */
  async activateAccount(payload: ActivateAccountRequest): Promise<ActivateAccountResponse> {
    const tenantId = payload.tenantId || getTenantId() || '11111111-1111-1111-1111-111111111111';
    const body = {
      token: payload.token,
      password: payload.password,
      confirmPassword: payload.confirmPassword,
    };
    const res = await apiClient.post<ActivateAccountResponse>(
      `/api/v1/tenants/${tenantId}/auth/activate`,
      body,
      { skipToast: true } as any
    );
    return res.data;
  },

  /**
   * Validates an activation token before showing setup form.
   * Calls GET /api/v1/tenants/{tenantId}/auth/activate/validate
   */
  async validateActivationToken(payload: { tenantId?: string; token: string }): Promise<{ valid: boolean }> {
    const tenantId = payload.tenantId || getTenantId() || '11111111-1111-1111-1111-111111111111';
    const res = await apiClient.get<{ valid: boolean }>(
      `/api/v1/tenants/${tenantId}/auth/activate/validate`,
      {
        params: { token: payload.token },
        skipToast: true,
      } as any
    );
    return res.data;
  },

  /**
   * Requests password reset email instructions for an account.
   * Calls POST /api/v1/tenants/{tenantId}/auth/forgot-password
   */
  async forgotPassword(payload: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    const tenantId = payload.tenantId || getTenantId() || '11111111-1111-1111-1111-111111111111';
    const body = {
      email: payload.email.trim(),
    };
    const res = await apiClient.post<ForgotPasswordResponse>(
      `/api/v1/tenants/${tenantId}/auth/forgot-password`,
      body,
      { skipToast: true } as any
    );
    return res.data;
  },

  /**
   * Resets password using token received via email.
   * Calls POST /api/v1/tenants/{tenantId}/auth/reset-password
   */
  async resetPassword(payload: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const tenantId = payload.tenantId || getTenantId() || '11111111-1111-1111-1111-111111111111';
    const body = {
      token: payload.token,
      newPassword: payload.newPassword,
    };
    const res = await apiClient.post<ResetPasswordResponse>(
      `/api/v1/tenants/${tenantId}/auth/reset-password`,
      body,
      { skipToast: true } as any
    );
    return res.data;
  },

  /**
   * Logs out the user by clearing session state and dispatching global auth event.
   */
  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('enrollnow_token');
      localStorage.removeItem('enrollnow_user');
      localStorage.removeItem('enrollnow_tenant_id');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('enrollnow_auth_change', {
          detail: { logout: true },
        })
      );
    }
  },
};

export default authApi;
