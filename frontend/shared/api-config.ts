// frontend/shared/api-config.ts - Centralized API Configuration for EnrollNow
import { getCachedRuntimeConfig } from './runtime-config';

export const DEFAULT_BACKEND_PORT = 8080;
export const DEFAULT_API_BASE_URL = `http://localhost:${DEFAULT_BACKEND_PORT}`;

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (win.__RUNTIME_CONFIG__?.apiBaseUrl) {
      return win.__RUNTIME_CONFIG__.apiBaseUrl;
    }
  }

  const runtimeConfig = getCachedRuntimeConfig();
  if (runtimeConfig.shell?.apiGatewayUrl) {
    return runtimeConfig.shell.apiGatewayUrl;
  }

  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  return DEFAULT_API_BASE_URL;
}

export const API_BASE_URL = DEFAULT_API_BASE_URL;
