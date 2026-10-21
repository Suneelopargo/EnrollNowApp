// frontend/shared/securitySettingsApi.test.ts - Unit tests for securitySettingsApi
import { describe, it, expect, vi, beforeEach } from 'vitest';

const storage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, val: string) => { storage[key] = String(val); },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

import { securitySettingsApi } from './api/securitySettingsApi';
import { apiClient } from './api-client';

vi.mock('./api-client', () => {
  const mockClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return {
    apiClient: mockClient,
    defaultApiClient: mockClient,
    default: mockClient,
  };
});

describe('securitySettingsApi', () => {
  const mockTenantId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.setItem('enrollnow_tenant_id', mockTenantId);
  });

  it('fetches security settings for current tenant', async () => {
    const mockData = {
      maxFailedLoginAttempts: 10,
      preventConcurrentSessions: false,
      inactivityLogoutMinutes: 30,
      inactivityLockDays: 90,
      passwordExpiryDays: 300,
      passwordHistoryCount: 4,
      minimumPasswordLength: 10,
      minimumPasswordStrength: 'MODERATE',
      requireDigit: true,
      requireSymbol: true,
      requireMixedCase: true,
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData } as any);

    const result = await securitySettingsApi.getSecuritySettings();

    expect(apiClient.get).toHaveBeenCalledWith(`/api/v1/tenants/${mockTenantId}/security-settings`);
    expect(result).toEqual(mockData);
  });

  it('updates security settings with payload', async () => {
    const payload = {
      maxFailedLoginAttempts: 5,
      inactivityLogoutMinutes: 15,
      minimumPasswordLength: 12,
    };
    const responseData = { ...payload, id: 'settings-1' };

    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: responseData } as any);

    const result = await securitySettingsApi.updateSecuritySettings(payload);

    expect(apiClient.put).toHaveBeenCalledWith(
      `/api/v1/tenants/${mockTenantId}/security-settings`,
      payload
    );
    expect(result).toEqual(responseData);
  });

  it('resets security settings to defaults', async () => {
    const defaultData = {
      maxFailedLoginAttempts: 10,
      minimumPasswordLength: 10,
    };

    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: defaultData } as any);

    const result = await securitySettingsApi.resetToDefaultSecuritySettings();

    expect(apiClient.post).toHaveBeenCalledWith(
      `/api/v1/tenants/${mockTenantId}/security-settings/reset-defaults`,
      {}
    );
    expect(result).toEqual(defaultData);
  });

  it('calls explicit tenant URL when tenant is specified', async () => {
    const customTenant = 'custom-tenant-uuid';
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { maxFailedLoginAttempts: 10 } } as any);

    await securitySettingsApi.getSecuritySettings(customTenant);

    expect(apiClient.get).toHaveBeenCalledWith(`/api/v1/tenants/${customTenant}/security-settings`);
  });
});
