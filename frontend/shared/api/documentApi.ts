// frontend/shared/api/documentApi.ts - Centralized Document Repository API
import { apiClient } from '../api-client';

export interface DocumentItem {
  documentId: string;
  title: string;
  type: string;
  studyId?: string;
  format?: string;
  size?: string;
  uploadedAt?: string;
  status: string;
  [key: string]: any;
}

export const documentApi = {
  async getDocuments(): Promise<DocumentItem[]> {
    const res = await apiClient.get('/api/v1/documents');
    return res.data?.data || [];
  },

  async getDocument(id: string): Promise<DocumentItem> {
    const res = await apiClient.get(`/api/v1/documents/${id}`);
    return res.data?.data;
  },

  /**
   * Uploads a file using multipart/form-data FormData.
   * The shared request interceptor will preserve FormData and avoid overriding Content-Type.
   */
  async uploadDocument(formData: FormData): Promise<DocumentItem> {
    const res = await apiClient.post('/api/v1/documents/upload', formData);
    return res.data?.data;
  },

  /**
   * Downloads a binary file / document blob.
   */
  async downloadDocument(id: string): Promise<Blob> {
    const res = await apiClient.get(`/api/v1/documents/${id}/download`, {
      responseType: 'blob',
    });
    return res.data;
  },
};

export default documentApi;
