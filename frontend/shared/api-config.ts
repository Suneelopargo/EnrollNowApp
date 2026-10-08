// frontend/shared/api-config.ts - Authoritative Centralized API Configuration for EnrollNow
import { getCachedRuntimeConfig } from './runtime-config';

export const DEFAULT_BACKEND_PORT = 8080;
export const DEFAULT_API_BASE_URL = `http://localhost:${DEFAULT_BACKEND_PORT}`;

/**
 * Normalizes a URL by removing trailing slashes and trimming surrounding whitespace.
 */
export function normalizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/\/+$/, '');
}

/**
 * Validates whether the given URL string is syntactically acceptable as an API base URL.
 * Supports absolute HTTP/HTTPS URLs as well as relative paths (e.g. for proxy setups).
 */
export function isValidUrl(url: unknown): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length === 0) return false;

  // Accept valid relative root paths e.g. "/api"
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true;
  }

  // Accept absolute URLs with http or https protocol
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Resolves the single authoritative API base URL for the entire application.
 * Reads environment variables first, falls back to runtime configuration,
 * and defaults to http://localhost:8080.
 *
 * Trailing slashes are strictly normalized and invalid values are rejected.
 */
export function getApiBaseUrl(): string {
  // 1. Check build-time / runtime environment variable VITE_API_BASE_URL
  let envBaseUrl: string | undefined;

  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) {
      envBaseUrl = (import.meta as any).env.VITE_API_BASE_URL;
    }
  } catch {
    // import.meta may not be available in non-ESM test environments
  }

  if (!envBaseUrl) {
    try {
      if (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) {
        envBaseUrl = process.env.VITE_API_BASE_URL;
      }
    } catch {
      // process may not be available in browser
    }
  }

  if (envBaseUrl && isValidUrl(envBaseUrl)) {
    return normalizeUrl(envBaseUrl);
  }

  // 2. Check dynamic browser runtime config injected via HTML (e.g., container deployments)
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (win.__RUNTIME_CONFIG__?.apiBaseUrl && isValidUrl(win.__RUNTIME_CONFIG__.apiBaseUrl)) {
      return normalizeUrl(win.__RUNTIME_CONFIG__.apiBaseUrl);
    }
  }

  // 3. Check cached runtime configuration
  try {
    const runtimeConfig = getCachedRuntimeConfig();
    if (runtimeConfig?.shell?.apiGatewayUrl && isValidUrl(runtimeConfig.shell.apiGatewayUrl)) {
      return normalizeUrl(runtimeConfig.shell.apiGatewayUrl);
    }
  } catch {
    // runtime config resolution fallback
  }

  // 4. Default fallback: http://localhost:8080
  return DEFAULT_API_BASE_URL;
}

export const API_BASE_URL = DEFAULT_API_BASE_URL;

export type ApiMode = 'mock' | 'real';

let activeApiMode: ApiMode | null = null;
let activeMockErrorSimulation: string | null = null;

/**
 * Resolves the operational API mode ('mock' or 'real').
 * Defaults to 'mock' for local development until real Spring Boot backend is live.
 */
export function getApiMode(): ApiMode {
  if (activeApiMode) {
    return activeApiMode;
  }

  let envMode: string | undefined;
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_MODE) {
      envMode = (import.meta as any).env.VITE_API_MODE;
    }
  } catch {
    // import.meta not available
  }

  if (!envMode) {
    try {
      if (typeof process !== 'undefined' && process.env?.VITE_API_MODE) {
        envMode = process.env.VITE_API_MODE;
      }
    } catch {
      // process not available
    }
  }

  if (envMode) {
    const normalized = envMode.trim().toLowerCase();
    if (normalized === 'real') return 'real';
    if (normalized === 'mock') return 'mock';
  }

  // Dynamic window runtime config fallback
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (win.__RUNTIME_CONFIG__?.apiMode) {
      const mode = String(win.__RUNTIME_CONFIG__.apiMode).toLowerCase();
      if (mode === 'real') return 'real';
      if (mode === 'mock') return 'mock';
    }
  }

  return 'mock';
}

/**
 * Programmatically override the API mode (useful for testing or dev switches).
 */
export function setApiMode(mode: ApiMode | null): void {
  activeApiMode = mode;
}

/**
 * Retrieves the simulated error code (e.g. '401', '403', '500', '503', 'network') if configured.
 */
export function getMockErrorSimulation(): string | null {
  if (activeMockErrorSimulation !== null) {
    return activeMockErrorSimulation;
  }

  let envError: string | undefined;
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_MOCK_ERROR) {
      envError = (import.meta as any).env.VITE_API_MOCK_ERROR;
    }
  } catch {
    // import.meta not available
  }

  if (!envError) {
    try {
      if (typeof process !== 'undefined' && process.env?.VITE_API_MOCK_ERROR) {
        envError = process.env.VITE_API_MOCK_ERROR;
      }
    } catch {
      // process not available
    }
  }

  return envError && envError.trim().length > 0 ? envError.trim() : null;
}

/**
 * Programmatically configure simulated error responses in mock mode.
 */
export function setMockErrorSimulation(errorCode: string | number | null): void {
  activeMockErrorSimulation = errorCode !== null ? String(errorCode).trim() : null;
}
