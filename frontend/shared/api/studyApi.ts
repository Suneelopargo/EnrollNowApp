// frontend/shared/api/studyApi.ts - Centralized Study Management API
import { apiClient } from '../api-client';

export interface Study {
  id?: string | number;
  studyId?: string;
  studyCode?: string;
  protocolId?: string;
  protocolNumber?: string;
  name?: string;
  title?: string;
  description?: string;
  phase?: string;
  therapeuticArea?: string;
  sampleSize?: number;
  targetParticipants?: number;
  targetEnrollment?: number;
  enrolled?: number;
  archived?: boolean;
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
    return (res.data as any)?.data ?? res.data;
  },

  async createStudy(study: Partial<Study>, config?: any): Promise<Study> {
    const res = await apiClient.post('/api/v1/studies', study, config);
    return (res.data as any)?.data ?? res.data;
  },

  async updateStudy(id: string | number, study: Partial<Study>, config?: any): Promise<Study> {
    const res = await apiClient.put(`/api/v1/studies/${id}`, study, config);
    return (res.data as any)?.data ?? res.data;
  },

  async deleteStudy(id: string | number, config?: any): Promise<void> {
    await apiClient.delete(`/api/v1/studies/${id}`, config);
  },
};

export default studyApi;
