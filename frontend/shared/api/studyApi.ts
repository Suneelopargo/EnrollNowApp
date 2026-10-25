// frontend/shared/api/studyApi.ts - Centralized Study Management API
import { apiClient } from '../api-client';
import type { AxiosRequestConfig } from 'axios';

export interface StudyAdmin {
  userId: string;
  name: string;
  email: string;
  initials: string;
  role?: string;
}

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
  startDate?: string;
  recruitmentStartDate?: string;
  endDate?: string;
  recruitmentEndDate?: string;
  admins?: StudyAdmin[];
  [key: string]: any;
}

export interface CopyStudyPayload {
  studyName: string;
  sourceStudyId: string;
}

export interface StudyNavigationPermissions {
  studyId: string;
  studyCode: string;
  studyName: string;
  studyRole: string;
  studyPermission: string;
  permissions: string[];
  archived: boolean;
  status: string;
  isParticipantUser?: boolean;
}

export interface ImportStudyResult {
  studyId: string;
  studyCode: string;
  name: string;
  message?: string;
  importedEntitiesSummary?: Record<string, number>;
  unsupportedFeatures?: string[];
}

export interface StudyApiRequestConfig extends AxiosRequestConfig {
  skipToast?: boolean;
  skipLoader?: boolean;
  silent?: boolean;
}

export interface GetStudiesParams {
  includeArchived?: boolean;
  status?: string;
  phase?: string;
  therapeuticArea?: string;
  search?: string;
  page?: number;
  size?: number;
  [key: string]: unknown;
}

export const studyApi = {
  async getStudies(paramsOrConfig?: GetStudiesParams | StudyApiRequestConfig): Promise<Study[]> {
    const isConfig = paramsOrConfig && ('params' in paramsOrConfig || 'headers' in paramsOrConfig || 'skipToast' in (paramsOrConfig as Record<string, unknown>));
    const config = isConfig ? (paramsOrConfig as StudyApiRequestConfig) : { params: paramsOrConfig };
    const res = await apiClient.get('/api/v1/studies', { skipToast: true, ...config } as any);
    return Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
  },

  async getStudy(id: string | number, config?: StudyApiRequestConfig): Promise<Study> {
    const res = await apiClient.get(`/api/v1/studies/${id}`, { skipToast: true, ...config } as any);
    return (res.data as any)?.data ?? res.data;
  },

  async getStudyPermissions(id: string | number, tenantId?: string, config?: StudyApiRequestConfig): Promise<StudyNavigationPermissions> {
    const url = tenantId ? `/api/v1/tenants/${tenantId}/studies/${id}/permissions` : `/api/v1/studies/${id}/permissions`;
    const res = await apiClient.get(url, { skipToast: true, ...config } as any);
    return (res.data as any)?.data ?? res.data;
  },

  async createStudy(study: Partial<Study>, config?: StudyApiRequestConfig): Promise<Study> {
    const res = await apiClient.post('/api/v1/studies', study, config);
    return (res.data as any)?.data ?? res.data;
  },

  async copyStudy(payload: CopyStudyPayload, config?: StudyApiRequestConfig): Promise<Study> {
    const res = await apiClient.post('/api/v1/studies/copy', payload, config);
    return (res.data as any)?.data ?? res.data;
  },

  async importStudy(studyName: string, file: File, config?: StudyApiRequestConfig): Promise<ImportStudyResult> {
    const formData = new FormData();
    formData.append('studyName', studyName);
    formData.append('file', file);
    const res = await apiClient.post('/api/v1/studies/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config,
    });
    return (res.data as any)?.data ?? res.data;
  },

  async importStudyJson(studyName: string, studyData: any, config?: StudyApiRequestConfig): Promise<ImportStudyResult> {
    const res = await apiClient.post(
      '/api/v1/studies/import',
      { studyName, studyData },
      config
    );
    return (res.data as any)?.data ?? res.data;
  },

  async updateStudy(id: string | number, study: Partial<Study>, config?: StudyApiRequestConfig): Promise<Study> {
    const res = await apiClient.put(`/api/v1/studies/${id}`, study, config);
    return (res.data as any)?.data ?? res.data;
  },

  async archiveStudy(id: string | number, config?: StudyApiRequestConfig): Promise<Study> {
    const res = await apiClient.post(`/api/v1/studies/${id}/archive`, {}, config);
    return (res.data as any)?.data ?? res.data;
  },

  async restoreStudy(id: string | number, config?: StudyApiRequestConfig): Promise<Study> {
    const res = await apiClient.post(`/api/v1/studies/${id}/restore`, {}, config);
    return (res.data as any)?.data ?? res.data;
  },

  async deleteStudy(id: string | number, config?: StudyApiRequestConfig): Promise<void> {
    await apiClient.delete(`/api/v1/studies/${id}`, config);
  },
};

export default studyApi;
