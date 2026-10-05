// frontend/shared/api/authApi.ts - Centralized Authentication API
import { apiClient } from '../api-client';
import { AuthUser } from '../contracts';

export interface LoginCredentials {
  username?: string;
  usernameOrEmail?: string;
  password?: string;
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
   * Note: The request interceptor will NOT send an Authorization header for unauthenticated requests.
   */
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> {
    const username = (credentials.username || credentials.usernameOrEmail || '').trim();
    const password = credentials.password || '';

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
   * Authorization header is injected automatically by the shared request interceptor.
   */
  async getCurrentUser(): Promise<AuthUser> {
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
