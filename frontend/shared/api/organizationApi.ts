// frontend/shared/api/organizationApi.ts - Centralized Organization & Sites API
import { apiClient } from '../api-client';

export interface Site {
  id?: string | number;
  siteCode: string;
  name: string;
  city: string;
  state: string;
  country: string;
  phone?: string;
  activeStudies?: number;
  status: string;
  [key: string]: any;
}

export const organizationApi = {
  async getSites(config?: any): Promise<Site[]> {
    const res = await apiClient.get('/api/v1/sites', config);
    return Array.isArray(res.data) ? res.data : (res.data?.data || []);
  },

  async getSite(siteCode: string, config?: any): Promise<Site> {
    const res = await apiClient.get(`/api/v1/sites/${siteCode}`, config);
    return res.data?.data ?? res.data;
  },
};

export default organizationApi;
