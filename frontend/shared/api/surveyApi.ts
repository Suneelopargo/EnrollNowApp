// frontend/shared/api/surveyApi.ts - Centralized Survey & eConsent API
import { apiClient } from '../api-client';

export interface SurveySummary {
  id: number;
  title: string;
  description?: string;
  status: string;
  version?: number;
  [key: string]: any;
}

export const surveyApi = {
  async getSurveys(params?: { search?: string; status?: string }): Promise<SurveySummary[]> {
    const res = await apiClient.get('/api/v1/surveys', { params });
    return res.data?.data || [];
  },

  async getSurvey(id: number): Promise<any> {
    const res = await apiClient.get(`/api/v1/surveys/${id}`);
    return res.data?.data;
  },

  async createSurvey(payload: any): Promise<any> {
    const res = await apiClient.post('/api/v1/surveys', payload);
    return res.data?.data;
  },

  async updateSurvey(id: number, payload: any): Promise<any> {
    const res = await apiClient.put(`/api/v1/surveys/${id}`, payload);
    return res.data?.data;
  },

  async deleteSurvey(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/surveys/${id}`);
  },

  async getDashboardData(): Promise<any> {
    const res = await apiClient.get('/api/v1/surveys/analytics/dashboard');
    return res.data?.data;
  },
};

export default surveyApi;
