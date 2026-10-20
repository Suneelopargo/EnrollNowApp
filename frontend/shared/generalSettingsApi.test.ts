// frontend/shared/generalSettingsApi.test.ts - Unit tests for generalSettingsApi
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

import { generalSettingsApi } from './api/generalSettingsApi';
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

describe('generalSettingsApi', () => {
  const mockTenantId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.setItem('enrollnow_tenant_id', mockTenantId);
  });

  it('fetches general settings for current tenant', async () => {
    const mockData = {
      id: 'gen-1',
      tenantId: mockTenantId,
      defaultTextReply: 'This is an automated message. We can not receive replies to this number.',
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData } as any);

    const result = await generalSettingsApi.getGeneralSettings();

    expect(apiClient.get).toHaveBeenCalledWith(`/api/v1/tenants/${mockTenantId}/general-settings`);
    expect(result).toEqual(mockData);
  });

  it('updates general settings with payload', async () => {
    const payload = {
      defaultTextReply: 'Updated custom message reply.',
    };
    const responseData = { ...payload, id: 'gen-1' };

    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: responseData } as any);

    const result = await generalSettingsApi.updateGeneralSettings(payload);

    expect(apiClient.put).toHaveBeenCalledWith(
      `/api/v1/tenants/${mockTenantId}/general-settings`,
      payload
    );
    expect(result).toEqual(responseData);
  });

  it('calls explicit tenant URL when tenant is specified', async () => {
    const customTenant = 'custom-tenant-uuid';
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { defaultTextReply: 'Test' } } as any);

    await generalSettingsApi.getGeneralSettings(customTenant);

    expect(apiClient.get).toHaveBeenCalledWith(`/api/v1/tenants/${customTenant}/general-settings`);
  });
});
