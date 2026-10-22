// frontend/shared/api/studyApi.ts - Centralized Study Management API
import { apiClient } from '../api-client';

export interface Study {
  id?: string | number;
  studyId?: string;
  protocolNumber?: string;
  title: string;
  phase?: string;
  therapeuticArea?: string;
  targetEnrollment?: number;
  status: string;
  [key: string]: any;
}

export const studyApi = {
  async getStudies(config?: any): Promise<Study[]> {
    const res = await apiClient.get('/api/v1/studies', { skipToast: true, ...config });
    return Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
  },

  async getStudy(id: string | number, config?: any): Promise<Study> {
    const res = await apiClient.get(`/api/v1/studies/${id}`, { skipToast: true, ...config });
    return res.data?.data;
  },

  async createStudy(study: Partial<Study>): Promise<Study> {
    const res = await apiClient.post('/api/v1/studies', study);
    return res.data?.data;
  },

  async updateStudy(id: string | number, study: Partial<Study>): Promise<Study> {
    const res = await apiClient.put(`/api/v1/studies/${id}`, study);
    return res.data?.data;
  },
};

export default studyApi;
