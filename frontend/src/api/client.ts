import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'corr-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT and Correlation ID
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('enrollnow_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.headers && !config.headers['X-Correlation-Id']) {
      config.headers['X-Correlation-Id'] = generateCorrelationId();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Expiration & Authorization Errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('enrollnow_token');
        localStorage.removeItem('enrollnow_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else if (error.response.status === 403) {
        console.warn('Access forbidden (403): insufficient role permissions');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
