// frontend/shared/api/securitySettingsApi.ts - Authoritative Site Security Settings API
import { apiClient } from '../api-client';
import { getTenantId } from '../api-config';
import { normalizePasswordPolicy, PasswordPolicy } from './authApi';

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

export interface ForceResetResult {
  totalAffected: number;
  emailsSent: number;
  emailsFailed: number;
  message: string;
}

export type UpdateSecuritySettingsPayload = Partial<SecuritySettingsResponse>;

export const securitySettingsApi = {
  getPasswordPolicy: async (tenantId?: string, token?: string): Promise<PasswordPolicy> => {
    const tid = tenantId || getTenantId();
    const url = tid
      ? `/api/v1/tenants/${tid}/auth/password-policy`
      : '/api/v1/security-settings/password-policy';
    const params = token ? { token } : undefined;
    const response = await apiClient.get<any>(url, { params, skipToast: true } as any);
    const data = (response.data as any)?.data ?? response.data;
    if (!data) {
      throw new Error('Failed to load password policy');
    }
    return normalizePasswordPolicy(data);
  },

  getSecuritySettings: async (tenantId?: string, config?: any): Promise<SecuritySettingsResponse> => {
    const tid = tenantId || getTenantId();
    const url = tid ? `/api/v1/tenants/${tid}/security-settings` : '/api/v1/security-settings';
    const response = config ? await apiClient.get<SecuritySettingsResponse>(url, config) : await apiClient.get<SecuritySettingsResponse>(url);
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

  forcePasswordReset: async (tenantId?: string): Promise<ForceResetResult> => {
    const tid = tenantId || getTenantId();
    const url = tid
      ? `/api/v1/tenants/${tid}/security-settings/force-password-reset`
      : '/api/v1/security-settings/force-password-reset';
    const response = await apiClient.post<ForceResetResult>(url, {});
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
