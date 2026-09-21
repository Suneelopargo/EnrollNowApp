// frontend/shared/api-client/index.ts - Base Technical API Client
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { telemetry } from '../telemetry';

export interface CreateApiClientOptions {
  baseURL?: string;
  getToken?: () => string | null;
  getCorrelationId?: () => string;
  onUnauthorized?: () => void;
  onForbidden?: () => void;
}

export function createApiClient(options: CreateApiClientOptions = {}): AxiosInstance {
  const instance = axios.create({
    baseURL: options.baseURL || '',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = options.getToken ? options.getToken() : localStorage.getItem('enrollnow_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const correlationId = options.getCorrelationId ? options.getCorrelationId() : telemetry.getCorrelationId();
      if (config.headers && !config.headers['X-Correlation-Id']) {
        config.headers['X-Correlation-Id'] = correlationId;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const correlationId = telemetry.getCorrelationId();

      telemetry.track({
        eventType: 'API_ERROR',
        details: {
          url: error.config?.url,
          method: error.config?.method,
          status,
          message: error.response?.data?.message || error.message,
        },
      });

      if (status === 401 && options.onUnauthorized) {
        options.onUnauthorized();
      } else if (status === 403 && options.onForbidden) {
        options.onForbidden();
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

export const defaultApiClient = createApiClient();
export default defaultApiClient;
