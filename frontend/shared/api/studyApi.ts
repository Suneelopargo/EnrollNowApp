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
  async getStudies(): Promise<Study[]> {
    const res = await apiClient.get('/api/v1/studies');
    return res.data?.data || [];
  },

  async getStudy(id: string | number): Promise<Study> {
    const res = await apiClient.get(`/api/v1/studies/${id}`);
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
