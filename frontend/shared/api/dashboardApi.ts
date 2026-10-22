// frontend/shared/api/dashboardApi.ts - Centralized Dashboard API
import { apiClient } from '../api-client';

export interface DashboardOverview {
  activeStudies?: number;
  totalStudies?: number;
  totalParticipants?: number;
  enrolledParticipants?: number;
  screeningParticipants?: number;
  recruitmentVelocity?: string;
  pendingTasks?: number;
  recentStudies?: any[];
  [key: string]: any;
}

export const dashboardApi = {
  async getOverview(config?: any): Promise<DashboardOverview> {
    const res = await apiClient.get('/api/v1/dashboard/overview', config);
    return res.data?.data ?? res.data;
  },
};

export default dashboardApi;
