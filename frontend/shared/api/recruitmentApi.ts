// frontend/shared/api/recruitmentApi.ts - Centralized Recruitment Campaigns API
import { apiClient } from '../api-client';

export interface RecruitmentCampaign {
  id?: string | number;
  campaignId?: string;
  name: string;
  channel?: string;
  studyId?: string;
  leads?: number;
  screened?: number;
  enrolled?: number;
  status: string;
  [key: string]: any;
}

export const recruitmentApi = {
  async getCampaigns(): Promise<RecruitmentCampaign[]> {
    const res = await apiClient.get('/api/v1/recruitment/campaigns');
    return res.data?.data || [];
  },

  async getCampaign(id: string | number): Promise<RecruitmentCampaign> {
    const res = await apiClient.get(`/api/v1/recruitment/campaigns/${id}`);
    return res.data?.data;
  },
};

export default recruitmentApi;
