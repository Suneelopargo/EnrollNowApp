// frontend/shared/api/communicationApi.ts - Centralized Participant Outreach & Communication API
import { apiClient } from '../api-client';

export interface CommunicationMessage {
  messageId: string;
  recipientName: string;
  channel: 'SMS' | 'EMAIL' | string;
  studyId?: string;
  type?: string;
  sentAt?: string;
  status: string;
  [key: string]: any;
}

export const communicationApi = {
  async getCommunications(): Promise<CommunicationMessage[]> {
    const res = await apiClient.get('/api/v1/communications');
    return res.data?.data || [];
  },

  async sendMessage(payload: Partial<CommunicationMessage>): Promise<CommunicationMessage> {
    const res = await apiClient.post('/api/v1/communications', payload);
    return res.data?.data;
  },
};

export default communicationApi;
