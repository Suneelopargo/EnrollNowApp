// frontend/shared/mock-api/mockAuthApi.ts - Mock Authentication Handler
import { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { mockStore } from './mockStore';
import { EXPIRED_TOKEN } from './mockData';
import { createMockSuccessResponse, createMockErrorResponse } from './mockResponse';

/**
 * Extracts Bearer token from request Authorization header.
 */
export function extractBearerToken(config: InternalAxiosRequestConfig): string | null {
  const headers = config.headers as any;
  let authHeader: string | undefined;

  if (headers) {
    if (typeof headers.get === 'function') {
      authHeader = headers.get('Authorization') || headers.get('authorization');
    }
    if (!authHeader) {
      authHeader = headers['Authorization'] || headers['authorization'];
    }
  }

  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return parts[0] || null;
}

export const mockAuthApi = {
  /**
   * Handles POST /api/v1/auth/login
   */
  handleLogin(config: InternalAxiosRequestConfig): AxiosResponse | AxiosError {
    let payload: any = {};
    try {
      payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
    } catch {
      payload = {};
    }

    const username = (payload.username || payload.usernameOrEmail || '').trim();
    const password = payload.password || '';

    const userRecord = mockStore.findUserByUsername(username);

    if (!userRecord || userRecord.password !== password) {
      return createMockErrorResponse(
        config,
        401,
        'Invalid username or password. Please verify your credentials.',
        'INVALID_CREDENTIALS'
      );
    }

    const responseData = {
      accessToken: userRecord.token,
      token: userRecord.token,
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: userRecord.user,
    };

    return createMockSuccessResponse(config, responseData, 200, 'Authentication successful');
  },

  /**
   * Handles GET /api/v1/auth/me
   */
  handleGetCurrentUser(config: InternalAxiosRequestConfig): AxiosResponse | AxiosError {
    const token = extractBearerToken(config);

    if (!token) {
      return createMockErrorResponse(
        config,
        401,
        'Authentication required: No bearer token provided.',
        'UNAUTHORIZED'
      );
    }

    if (token === EXPIRED_TOKEN) {
      return createMockErrorResponse(
        config,
        401,
        'Session expired: The provided authentication token has expired.',
        'TOKEN_EXPIRED'
      );
    }

    const userRecord = mockStore.findUserByToken(token);
    if (!userRecord) {
      return createMockErrorResponse(
        config,
        401,
        'Invalid session: Token is unrecognized or invalid.',
        'INVALID_TOKEN'
      );
    }

    return createMockSuccessResponse(config, userRecord.user, 200, 'User profile retrieved');
  },

  /**
   * Handles POST /api/v1/auth/logout
   */
  handleLogout(config: InternalAxiosRequestConfig): AxiosResponse | AxiosError {
    return createMockSuccessResponse(config, { loggedOut: true }, 200, 'Logged out successfully');
  },
};
