// frontend/shared/api/authApi.ts - Centralized Authentication API
import { apiClient } from '../api-client';
import { getApiMode, getTenantId } from '../api-config';
import { AuthUser } from '../contracts';

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

      const user: AuthUser = {
        id: data.userId || data.id,
        username: data.email || username,
        email: data.email || username,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || username,
        roles: ['ROLE_SUPER_ADMIN', 'ROLE_SITE_ADMIN', 'ADMIN'],
        active: true,
        tenantId: data.tenantId || tenantId,
      };

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('enrollnow_tenant_id', data.tenantId || tenantId);
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
    const user = data.user || {
      id: 1,
      username,
      email: `${username}@enrollnow.local`,
      roles: ['ROLE_SUPER_ADMIN'],
    };

    if (!token) {
      throw new Error('Authentication failed: Missing access token in server response');
    }

    return { user, token };
  },

  /**
   * Retrieves current authenticated user details from session endpoint.
   */
  async getCurrentUser(): Promise<AuthUser> {
    const mode = getApiMode();

    if (mode === 'real') {
      const storedUserRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('enrollnow_user') : null;
      if (storedUserRaw) {
        try {
          const parsed = JSON.parse(storedUserRaw);
          const tenantId = parsed.tenantId || getTenantId();
          if (tenantId && parsed.id) {
            const res = await apiClient.get<any>(`/api/v1/tenants/${tenantId}/users/${parsed.id}`, {
              timeout: 8000,
            });
            if (res.data) {
              const u = res.data;
              return {
                ...parsed,
                id: u.id,
                email: u.primaryEmail || parsed.email,
                firstName: u.firstName,
                lastName: u.lastName,
                fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || parsed.username,
                active: u.status === 'ACTIVE',
              };
            }
          }
        } catch (err: any) {
          const status = err.status || err.response?.status;
          if (status === 401 || status === 403) {
            throw err;
          }
        }
        try {
          return JSON.parse(storedUserRaw);
        } catch {
          // ignore
        }
      }
    }

    const res = await apiClient.get<AuthApiResponse<AuthUser>>('/api/v1/auth/me', {
      timeout: 8000,
    });
    return res.data?.data;
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
