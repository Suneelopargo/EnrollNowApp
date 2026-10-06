// frontend/shared/api/participantApi.ts - Centralized Participant API
import { apiClient } from '../api-client';

export interface Participant {
  id?: string | number;
  participantId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  studyId?: string;
  status: string;
  enrolledAt?: string;
  [key: string]: any;
}

export const participantApi = {
  async getParticipants(): Promise<Participant[]> {
    const res = await apiClient.get('/api/v1/participants');
    return res.data?.data || [];
  },

  async getParticipant(id: string | number): Promise<Participant> {
    const res = await apiClient.get(`/api/v1/participants/${id}`);
    return res.data?.data;
  },

  async updateParticipantStatus(id: string | number, status: string): Promise<Participant> {
    const res = await apiClient.patch(`/api/v1/participants/${id}/status`, { status });
    return res.data?.data;
  },
};

export default participantApi;
