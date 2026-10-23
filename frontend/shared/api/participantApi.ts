// frontend/shared/api/participantApi.ts - Centralized Participant & Registry API
import { apiClient } from '../api-client';

export interface Participant {
  id?: string | number;
  participantId?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  studyId?: string;
  status: string;
  enrolledAt?: string;
  [key: string]: any;
}

export interface RegistrySearchParams {
  tenantId?: string;
  siteId?: string;
  search?: string;
  searchTerm?: string;
  contactFilter?: 'all' | 'yes' | 'no';
  availableFilter?: 'all' | 'yes' | 'no';
  studies?: string[];
  customFiltersJson?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface RegistryPagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SavedSearchPayload {
  id?: string;
  name: string;
  contactFilter?: 'all' | 'yes' | 'no';
  availableFilter?: 'all' | 'yes' | 'no';
  searchTerm?: string;
  selectedStudies?: string[];
  customFilters?: any[];
}

export interface CreateParticipantPayload {
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth?: string;
  sexAtBirth?: string;
  genderIdentity?: string;
  status?: string;
  primaryEmail?: string;
  secondaryEmail?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  contactForFutureStudies?: boolean;
  preferredContactMethod?: string;
  ethnicity?: string;
  race?: string;
  primaryLanguage?: string;
  familyRole?: string;
  guardianName?: string;
  tags?: string[];
  studyId?: string;
  familyId?: string;
  globalId?: string;
  timezone?: string;
  globalDateOfLastContact?: string;
  variables?: Array<{ id?: string; name: string; type?: string; value: string; lastUpdated?: string }>;
}

export interface AssignStudyPayload {
  participantId?: string;
  participantIds?: string[];
  studyId?: string;
  studyName?: string;
  status?: string;
  notes?: string;
}

export const participantApi = {
  async getParticipants(configOrParams?: any): Promise<any> {
    let params: any;
    let config: any = {};

    if (configOrParams) {
      if (typeof configOrParams === 'object' && 'params' in configOrParams) {
        params = configOrParams.params;
        const { params: _, ...rest } = configOrParams;
        config = rest;
      } else if (typeof configOrParams === 'object' && ('headers' in configOrParams || 'skipToast' in configOrParams)) {
        params = configOrParams.params;
        config = configOrParams;
      } else {
        params = configOrParams;
      }
    }

    const res = await apiClient.get('/api/v1/participants', { skipToast: true, ...config, params } as any);
    return res.data?.data ?? res.data;
  },

  async checkDuplicates(firstName: string, lastName: string, config?: any): Promise<Participant[]> {
    const res = await apiClient.get('/api/v1/participants/check-duplicate', {
      params: { firstName, lastName },
      skipToast: true,
      ...config,
    } as any);
    return res.data?.data ?? res.data ?? [];
  },

  async getParticipant(id: string | number, config?: any): Promise<Participant> {
    const res = await apiClient.get(`/api/v1/participants/${id}`, { skipToast: true, ...config } as any);
    return res.data?.data ?? res.data;
  },

  async createParticipant(payload: CreateParticipantPayload, config?: any): Promise<Participant> {
    const res = await apiClient.post('/api/v1/participants', payload, config);
    return res.data?.data ?? res.data;
  },

  async updateParticipant(id: string | number, payload: Partial<CreateParticipantPayload>, config?: any): Promise<Participant> {
    const res = await apiClient.put(`/api/v1/participants/${id}`, payload, config);
    return res.data?.data ?? res.data;
  },

  async updateParticipantStatus(id: string | number, status: string): Promise<Participant> {
    const res = await apiClient.patch(`/api/v1/participants/${id}/status`, { status });
    return res.data?.data ?? res.data;
  },

  async deleteParticipant(id: string | number): Promise<void> {
    await apiClient.delete(`/api/v1/participants/${id}`);
  },

  async assignStudy(payload: AssignStudyPayload): Promise<void> {
    await apiClient.post('/api/v1/participants/assign-study', payload);
  },

  async getSavedSearches(): Promise<SavedSearchPayload[]> {
    const res = await apiClient.get('/api/v1/registry/saved-searches', { skipToast: true } as any);
    return res.data?.data ?? res.data ?? [];
  },

  async createSavedSearch(payload: SavedSearchPayload): Promise<SavedSearchPayload> {
    const res = await apiClient.post('/api/v1/registry/saved-searches', payload);
    return res.data?.data ?? res.data;
  },

  async deleteSavedSearch(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/registry/saved-searches/${id}`);
  },

  async exportRegistry(params?: RegistrySearchParams): Promise<Blob> {
    const res = await apiClient.get('/api/v1/registry/export', {
      params,
      responseType: 'blob',
    });
    return res.data;
  },
};

export default participantApi;
