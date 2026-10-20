// frontend/shared/api/generalSettingsApi.ts - Authoritative Site General Settings API
import { apiClient } from '../api-client';
import { getTenantId } from '../api-config';

export interface GeneralSettingsResponse {
  id?: string;
  tenantId?: string;
  defaultTextReply: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface UpdateGeneralSettingsPayload {
  defaultTextReply: string;
}

export const generalSettingsApi = {
  getGeneralSettings: async (tenantId?: string): Promise<GeneralSettingsResponse> => {
    const tid = tenantId || getTenantId();
    const url = tid ? `/api/v1/tenants/${tid}/general-settings` : '/api/v1/general-settings';
    const response = await apiClient.get<GeneralSettingsResponse>(url);
    const data = (response.data as any)?.data ?? response.data;
    return data;
  },

  updateGeneralSettings: async (
    payload: UpdateGeneralSettingsPayload,
    tenantId?: string
  ): Promise<GeneralSettingsResponse> => {
    const tid = tenantId || getTenantId();
    const url = tid ? `/api/v1/tenants/${tid}/general-settings` : '/api/v1/general-settings';
    const response = await apiClient.put<GeneralSettingsResponse>(url, payload);
    const data = (response.data as any)?.data ?? response.data;
    return data;
  },
};
