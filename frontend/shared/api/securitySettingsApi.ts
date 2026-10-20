// frontend/shared/api/securitySettingsApi.ts - Authoritative Site Security Settings API
import { apiClient } from '../api-client';
import { getTenantId } from '../api-config';

export interface SecuritySettingsResponse {
  id?: string;
  tenantId?: string;
  maxFailedLoginAttempts: number;
  preventConcurrentSessions: boolean;
  inactivityLogoutMinutes: number;
  inactivityLockDays: number;
  passwordExpiryDays: number;
  passwordHistoryCount: number;
  minimumPasswordLength: number;
  minimumPasswordStrength: 'WEAK' | 'MODERATE' | 'STRONG' | string;
  requireDigit: boolean;
  requireSymbol: boolean;
  requireMixedCase: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export type UpdateSecuritySettingsPayload = Partial<SecuritySettingsResponse>;

export const securitySettingsApi = {
  getSecuritySettings: async (tenantId?: string): Promise<SecuritySettingsResponse> => {
    const tid = tenantId || getTenantId();
    const url = tid ? `/api/v1/tenants/${tid}/security-settings` : '/api/v1/security-settings';
    const response = await apiClient.get<SecuritySettingsResponse>(url);
    const data = (response.data as any)?.data ?? response.data;
    return data;
  },

  updateSecuritySettings: async (
    payload: UpdateSecuritySettingsPayload,
    tenantId?: string
  ): Promise<SecuritySettingsResponse> => {
    const tid = tenantId || getTenantId();
    const url = tid ? `/api/v1/tenants/${tid}/security-settings` : '/api/v1/security-settings';
    const response = await apiClient.put<SecuritySettingsResponse>(url, payload);
    const data = (response.data as any)?.data ?? response.data;
    return data;
  },

  resetToDefaultSecuritySettings: async (tenantId?: string): Promise<SecuritySettingsResponse> => {
    const tid = tenantId || getTenantId();
    const url = tid
      ? `/api/v1/tenants/${tid}/security-settings/reset-defaults`
      : '/api/v1/security-settings/reset-defaults';
    const response = await apiClient.post<SecuritySettingsResponse>(url, {});
    const data = (response.data as any)?.data ?? response.data;
    return data;
  },
};
