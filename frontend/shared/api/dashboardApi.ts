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
  async getOverview(): Promise<DashboardOverview> {
    const res = await apiClient.get('/api/v1/dashboard/overview');
    return res.data?.data;
  },
};

export default dashboardApi;
