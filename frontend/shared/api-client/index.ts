// frontend/shared/api-client/index.ts - Authoritative Centralized API Client & Interceptors
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, AxiosAdapter } from 'axios';
import { getApiBaseUrl, getApiMode, ApiMode } from '../api-config';
import { telemetry } from '../telemetry';
import { mockAdapter } from '../mock-api/mockAdapter';

export interface ApiHeaderContext {
  getToken?: () => string | null;
  getTenantId?: () => string | null;
  getOrganizationId?: () => string | null;
  getCorrelationId?: () => string;
  [key: string]: any;
}

export interface NormalizedApiError {
  status?: number;
  message: string;
  code?: string;
  details?: string[];
  correlationId?: string;
  raw?: any;
}

export class EnrollNowApiError extends Error {
  public status?: number;
  public code?: string;
  public details?: string[];
  public correlationId?: string;
  public raw?: any;

  constructor(normalized: NormalizedApiError) {
    super(normalized.message);
    this.name = 'EnrollNowApiError';
    this.status = normalized.status;
    this.code = normalized.code;
    this.details = normalized.details;
    this.correlationId = normalized.correlationId;
    this.raw = normalized.raw;
    Object.setPrototypeOf(this, EnrollNowApiError.prototype);
  }
}

export interface CreateApiClientOptions {
  baseURL?: string;
  timeout?: number;
  mode?: ApiMode;
  adapter?: AxiosAdapter;
  getToken?: () => string | null;
  getCorrelationId?: () => string;
  onUnauthorized?: () => void;
  onForbidden?: () => void;
  headerContext?: ApiHeaderContext;
}

let activeHeaderProvider: ApiHeaderContext = {};
const unauthorizedCallbacks = new Set<() => void>();

/**
 * Register a dynamic header provider for tenant, organization, or custom header resolution.
 */
export function setHeaderProvider(provider: ApiHeaderContext): void {
  activeHeaderProvider = { ...activeHeaderProvider, ...provider };
}

/**
 * Retrieve the current dynamic header provider.
 */
export function getHeaderProvider(): ApiHeaderContext {
  return activeHeaderProvider;
}

/**
 * Register an unauthorized (401) listener callback.
 */
export function onUnauthorized(callback: () => void): () => void {
  unauthorizedCallbacks.add(callback);
  return () => {
    unauthorizedCallbacks.delete(callback);
  };
}

/**
 * Centralized token retrieval.
 * First checks active header provider, then falls back to localStorage 'enrollnow_token'.
 */
export function getAccessToken(): string | null {
  if (activeHeaderProvider.getToken) {
    const token = activeHeaderProvider.getToken();
    if (token && token.trim().length > 0) return token.trim();
  }
  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('enrollnow_token');
    if (token && token.trim().length > 0) return token.trim();
  }
  return null;
}

/**
 * Determines whether a payload is binary / multipart data.
 */
function isMultipartOrBinaryData(data: unknown): boolean {
  if (!data) return false;
  if (typeof FormData !== 'undefined' && data instanceof FormData) return true;
  if (typeof Blob !== 'undefined' && data instanceof Blob) return true;
  if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) return true;
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer?.(data)) return true;
  return false;
}

/**
 * Normalizes backend error responses into a consistent frontend model.
 * Preserves ApiResponse<T> and ApiError structure from Spring Boot backend.
 */
export function normalizeApiError(error: any): NormalizedApiError {
  const status = error.response?.status;
  const data = error.response?.data;
  const correlationId =
    error.response?.headers?.['x-correlation-id'] ||
    data?.correlationId ||
    telemetry.getCorrelationId();

  let message = 'An unexpected error occurred. Please try again.';
  let code = 'UNKNOWN_ERROR';
  let details: string[] | undefined;

  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    code = 'TIMEOUT';
    message = 'Request timeout: The server took too long to respond.';
  } else if (!error.response) {
    code = 'NETWORK_ERROR';
    message = 'Network error: Unable to connect to the backend server. Please verify your connection.';
  } else if (data) {
    if (data.error && typeof data.error === 'object') {
      code = data.error.code || code;
      message = data.error.message || data.message || message;
      if (Array.isArray(data.error.details)) {
        details = data.error.details;
      }
    } else if (typeof data.message === 'string') {
      message = data.message;
      code = data.code || `HTTP_${status}`;
    } else if (typeof data === 'string') {
      message = data;
    }
  } else if (error.message) {
    message = error.message;
  }

  // Handle standard HTTP status codes
  switch (status) {
    case 401:
      code = code === 'UNKNOWN_ERROR' ? 'UNAUTHORIZED' : code;
      message = message || 'Session expired or unauthorized. Please log in again.';
      break;
    case 403:
      code = code === 'UNKNOWN_ERROR' ? 'FORBIDDEN' : code;
      message = message || 'Access denied: You do not have permission to perform this action.';
      break;
    case 404:
      code = code === 'UNKNOWN_ERROR' ? 'NOT_FOUND' : code;
      message = message || 'The requested resource was not found.';
      break;
    case 409:
      code = code === 'UNKNOWN_ERROR' ? 'CONFLICT' : code;
      message = message || 'A data conflict occurred. Please refresh and try again.';
      break;
    case 422:
      code = code === 'UNKNOWN_ERROR' ? 'VALIDATION_ERROR' : code;
      message = message || 'Validation failed for one or more fields.';
      break;
    case 429:
      code = code === 'UNKNOWN_ERROR' ? 'RATE_LIMITED' : code;
      message = message || 'Too many requests. Please slow down and try again shortly.';
      break;
    case 500:
      code = code === 'UNKNOWN_ERROR' ? 'INTERNAL_SERVER_ERROR' : code;
      message = message || 'Internal server error occurred on the backend service.';
      break;
    case 502:
    case 503:
    case 504:
      code = code === 'UNKNOWN_ERROR' ? 'SERVICE_UNAVAILABLE' : code;
      message = message || 'Backend service is temporarily unavailable. Please try again later.';
      break;
  }

  return {
    status,
    message,
    code,
    details,
    correlationId,
    raw: data,
  };
}

/**
 * Clears current session tokens and notifies listeners without redirect loops.
 */
export function handleSessionExpired(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('enrollnow_token');
    localStorage.removeItem('enrollnow_user');
  }

  unauthorizedCallbacks.forEach((cb) => {
    try {
      cb();
    } catch {
      // Ignore individual callback failures
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('enrollnow_auth_change', {
        detail: { logout: true, reason: 'SESSION_EXPIRED' },
      })
    );
  }
}

/**
 * Configure standard request and response interceptors on an Axios instance.
 */
export function attachInterceptors(instance: AxiosInstance, options: CreateApiClientOptions = {}): void {
  // REQUEST INTERCEPTOR
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // 1. Common Accept header
      if (!config.headers.Accept) {
        config.headers.Accept = 'application/json';
      }

      // 2. Correlation ID injection
      const correlationId =
        (options.getCorrelationId ? options.getCorrelationId() : null) ||
        (activeHeaderProvider.getCorrelationId ? activeHeaderProvider.getCorrelationId() : null) ||
        telemetry.getCorrelationId();

      if (!config.headers['X-Correlation-Id']) {
        config.headers['X-Correlation-Id'] = correlationId;
      }

      // 3. Dynamic context headers (Tenant, Org, etc.)
      const tenantId = activeHeaderProvider.getTenantId ? activeHeaderProvider.getTenantId() : null;
      if (tenantId && !config.headers['X-Tenant-Id']) {
        config.headers['X-Tenant-Id'] = tenantId;
      }

      const orgId = activeHeaderProvider.getOrganizationId ? activeHeaderProvider.getOrganizationId() : null;
      if (orgId && !config.headers['X-Organization-Id']) {
        config.headers['X-Organization-Id'] = orgId;
      }

      // 4. Automatic JWT Token injection
      const token = options.getToken ? options.getToken() : getAccessToken();
      if (token && token !== 'null' && token !== 'undefined' && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 5. Content-Type Handling: do NOT overwrite FormData / multipart boundaries
      if (isMultipartOrBinaryData(config.data)) {
        // Let the browser/Axios compute multipart/form-data boundary automatically
        delete config.headers['Content-Type'];
      } else if (config.data && !config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // RESPONSE INTERCEPTOR
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
      const normalized = normalizeApiError(error);
      const url = error.config?.url || '';
      const isLoginRequest = url.includes('/api/v1/auth/login');

      // Telemetry error tracking
      telemetry.track({
        eventType: 'API_ERROR',
        details: {
          url: error.config?.url,
          method: error.config?.method,
          status: normalized.status,
          code: normalized.code,
          message: normalized.message,
          correlationId: normalized.correlationId,
        },
      });

      // Centralized 401 Unauthorized handling
      if (normalized.status === 401) {
        if (options.onUnauthorized) {
          options.onUnauthorized();
        }

        // Only expire session if it was an authenticated request, not failed credentials on login
        if (!isLoginRequest) {
          handleSessionExpired();
        }
      } else if (normalized.status === 403 && options.onForbidden) {
        options.onForbidden();
      }

      const apiError = new EnrollNowApiError(normalized);
      // Attach normalized info onto error object for backwards compatibility
      error.normalized = normalized;
      error.apiError = apiError;

      return Promise.reject(apiError);
    }
  );
}

function resolveRealAdapter(fallback?: AxiosAdapter): AxiosAdapter {
  if (fallback) return fallback;
  if (typeof (axios as any).getAdapter === 'function') {
    try {
      return (axios as any).getAdapter(axios.defaults.adapter);
    } catch {
      // fallback
    }
  }
  return axios.defaults.adapter as any;
}

/**
 * Creates a configured Axios client instance.
 * Automatically wires mockAdapter when in 'mock' mode, while preserving
 * standard request and response interceptors.
 */
export function createApiClient(options: CreateApiClientOptions = {}): AxiosInstance {
  const realHttpAdapter = resolveRealAdapter(options.adapter);

  const dynamicAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    const currentMode = options.mode || getApiMode();
    if (currentMode === 'mock') {
      return mockAdapter(config);
    }
    return realHttpAdapter(config);
  };

  const instance = axios.create({
    baseURL: options.baseURL !== undefined ? options.baseURL : getApiBaseUrl(),
    timeout: options.timeout || 15000,
    adapter: dynamicAdapter,
  });

  attachInterceptors(instance, options);
  return instance;
}

/**
 * Authoritative Central Axios Client singleton for EnrollNow
 */
export const apiClient: AxiosInstance = createApiClient();
export const defaultApiClient: AxiosInstance = apiClient;
export default apiClient;
