// frontend/shared/api/organizationApi.ts - Centralized Organization & Sites API
import { apiClient } from '../api-client';

export interface Site {
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
  async getSites(): Promise<Site[]> {
    const res = await apiClient.get('/api/v1/sites');
    return res.data?.data || [];
  },

  async getSite(siteCode: string): Promise<Site> {
    const res = await apiClient.get(`/api/v1/sites/${siteCode}`);
    return res.data?.data;
  },
};

export default organizationApi;
