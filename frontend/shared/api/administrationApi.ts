// frontend/shared/api/administrationApi.ts - Centralized Administration API
import { apiClient } from '../api-client';

export const administrationApi = {
  async getDashboard(): Promise<any> {
    const res = await apiClient.get('/api/v1/administrator/dashboard');
    return res.data?.data;
  },

  async getUsers(query?: Record<string, any>): Promise<any> {
    const res = await apiClient.get('/api/v1/administrator/users', { params: query });
    return res.data?.data;
  },

  async getUser(id: number | string): Promise<any> {
    const res = await apiClient.get(`/api/v1/administrator/users/${id}`);
    return res.data?.data;
  },

  async createUser(payload: any): Promise<any> {
    const res = await apiClient.post('/api/v1/administrator/users', payload);
    return res.data?.data;
  },

  async updateUser(id: number | string, payload: any): Promise<any> {
    const res = await apiClient.put(`/api/v1/administrator/users/${id}`, payload);
    return res.data?.data;
  },

  async activateUser(id: number | string): Promise<any> {
    const res = await apiClient.post(`/api/v1/administrator/users/${id}/activate`);
    return res.data?.data;
  },

  async deactivateUser(id: number | string): Promise<any> {
    const res = await apiClient.post(`/api/v1/administrator/users/${id}/deactivate`);
    return res.data?.data;
  },

  async resetPassword(id: number | string, payload: any): Promise<any> {
    const res = await apiClient.post(`/api/v1/administrator/users/${id}/reset-password`, payload);
    return res.data?.data;
  },

  async getLocations(): Promise<any> {
    const res = await apiClient.get('/api/v1/administrator/locations');
    return res.data?.data;
  },

  async getUserLocations(userId: number | string): Promise<any> {
    const res = await apiClient.get(`/api/v1/administrator/users/${userId}/locations`);
    return res.data?.data;
  },

  async saveUserLocations(userId: number | string, locationIds: number[]): Promise<any> {
    const res = await apiClient.put(`/api/v1/administrator/users/${userId}/locations`, locationIds);
    return res.data?.data;
  },

  async getRoles(): Promise<any> {
    const res = await apiClient.get('/api/v1/administrator/roles');
    return res.data?.data;
  },

  async getAuditLogs(query?: Record<string, any>): Promise<any> {
    const res = await apiClient.get('/api/v1/administrator/audit-logs', { params: query });
    return res.data?.data;
  },
};

export default administrationApi;
