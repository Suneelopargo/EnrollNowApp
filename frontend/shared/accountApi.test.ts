// frontend/shared/accountApi.test.ts - Unit tests for accountApi
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

import { accountApi } from './api/accountApi';
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

describe('accountApi', () => {
  const mockTenantId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.setItem('enrollnow_tenant_id', mockTenantId);
  });

  it('fetches profile for current tenant', async () => {
    const mockProfile = {
      userId: 'user-123',
      tenantId: mockTenantId,
      email: 'user@example.com',
      emailVerified: true,
      firstName: 'Alice',
      lastName: 'Smith',
      title: 'Dr.',
      phoneNumber: '555-1234',
      profilePhotoUrl: null,
      createdAt: '2026-01-01T00:00:00Z',
      lastLoginAt: '2026-11-06T10:00:00Z',
      timezone: 'America/New_York',
      ignoreTimezoneMismatch: false,
      passwordExpiringDays: 30,
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockProfile } as any);

    const result = await accountApi.getProfile();
    expect(apiClient.get).toHaveBeenCalledWith(`/api/v1/tenants/${mockTenantId}/account/profile`);
    expect(result.email).toBe('user@example.com');
    expect(result.firstName).toBe('Alice');
  });

  it('updates profile fields', async () => {
    const payload = { firstName: 'Bob', lastName: 'Jones', timezone: 'UTC' };
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: { ...payload, userId: 'user-123' } } as any);

    const result = await accountApi.updateProfile(payload);
    expect(apiClient.put).toHaveBeenCalledWith(`/api/v1/tenants/${mockTenantId}/account/profile`, payload);
    expect(result.firstName).toBe('Bob');
  });

  it('changes password', async () => {
    const payload = { currentPassword: 'Old', newPassword: 'New', confirmPassword: 'New' };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { message: 'Password changed successfully' } } as any);

    const result = await accountApi.changePassword(payload);
    expect(apiClient.post).toHaveBeenCalledWith(`/api/v1/tenants/${mockTenantId}/account/password`, payload);
    expect(result.message).toBe('Password changed successfully');
  });

  it('requests email change', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { message: 'Verification email sent' } } as any);

    const result = await accountApi.requestEmailChange('new@example.com');
    expect(apiClient.post).toHaveBeenCalledWith(
      `/api/v1/tenants/${mockTenantId}/account/email/request-change`,
      { newEmail: 'new@example.com' }
    );
    expect(result.message).toBe('Verification email sent');
  });

  it('fetches recent logins', async () => {
    const mockLogins = [{ loginAt: '2026-11-06T10:00:00Z', ipAddress: '127.0.0.1', userAgent: 'Chrome' }];
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockLogins } as any);

    const result = await accountApi.getRecentLogins();
    expect(apiClient.get).toHaveBeenCalledWith(`/api/v1/tenants/${mockTenantId}/account/recent-logins`);
    expect(result).toHaveLength(1);
    expect(result[0].ipAddress).toBe('127.0.0.1');
  });

  it('fetches and updates study preferences', async () => {
    const mockStudies = [
      {
        studyId: 'study-1',
        studyName: 'Study 1',
        studyRole: 'LEADER',
        accessRole: 'STUDY_LEADER',
        dailyDigest: true,
        taskEmails: true,
        participantEmails: false,
        surveySubmissions: true,
      },
    ];
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockStudies } as any);

    const studies = await accountApi.getStudyPreferences();
    expect(apiClient.get).toHaveBeenCalledWith(`/api/v1/tenants/${mockTenantId}/account/studies`);
    expect(studies).toHaveLength(1);

    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { ...mockStudies[0], dailyDigest: false } } as any);
    const updated = await accountApi.updateStudyPreference('study-1', { dailyDigest: false });
    expect(apiClient.patch).toHaveBeenCalledWith(
      `/api/v1/tenants/${mockTenantId}/account/studies/study-1/notifications`,
      { dailyDigest: false }
    );
    expect(updated.dailyDigest).toBe(false);
  });
});
