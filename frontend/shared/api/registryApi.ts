// frontend/shared/api/registryApi.ts - Centralized Spring Boot Registry API Client
import { apiClient } from '../api-client';

export interface StudyInfo {
  studyId: string;
  studyName: string;
  statusId?: string;
  statusName?: string;
  statusIndicatesInactive?: boolean;
  studyArchived?: boolean;
  allowParticipationInOtherStudies?: boolean;
}

export interface ParticipantVariable {
  id?: string;
  variableId?: string;
  name: string;
  value: string;
  lastUpdated?: string;
}

export interface RegistryFilterRequest {
  field: string;
  operator?: string;
  values?: string[];
  value?: string;
  minValue?: string;
  maxValue?: string;
}

export interface RegistrySearchRequest {
  searchText?: string;
  filters?: RegistryFilterRequest[];
  contactForFutureStudies?: string;
  participantAvailability?: string;
  duplicatesOnly?: boolean;
  page?: number;
  size?: number;
  sortField?: string;
  sortDirection?: string;
}

export interface RegistryParticipantResponse {
  id: string;
  globalId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name?: string;
  sex?: string;
  birthday?: string;
  age?: number;
  ethnicity?: string;
  race?: string;
  familyId?: string;
  timezone?: string;
  contactForFutureStudies?: boolean;
  availableToAddStudy?: boolean;
  globalLastContactDate?: string;
  insertedAt?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  phone?: string;
  tags?: string[];
  studies?: StudyInfo[];
  variables?: ParticipantVariable[];
}

export interface RegistrySearchResponse {
  content: RegistryParticipantResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface StudyOption {
  id: string;
  name: string;
}

export interface StatusOption {
  id: string;
  name: string;
  studyId?: string;
}

export interface CustomVariableOption {
  id: string;
  name: string;
  type?: string;
  options?: string[];
}

export interface RegistryFilterOptionsResponse {
  tags: string[];
  states: string[];
  cities: string[];
  zipcodes: string[];
  genders: string[];
  races: string[];
  ethnicities: string[];
  studies: StudyOption[];
  statuses: StatusOption[];
  customVariables: CustomVariableOption[];
}

export interface SavedRegistrySearchRequest {
  name: string;
  search: RegistrySearchRequest;
}

export interface SavedRegistrySearchResponse {
  id: string;
  name: string;
  search: RegistrySearchRequest;
  insertedAt?: string;
}

export interface CreateRegistryParticipantRequest {
  globalId?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
}

export interface UpdateRegistryParticipantRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  globalId?: string;
  sex?: string;
  birthday?: string;
  ethnicity?: string;
  race?: string;
  familyId?: string;
  timezone?: string;
  contactForFutureStudies?: boolean;
  tags?: string[];
  city?: string;
  state?: string;
  zipcode?: string;
  phone?: string;
}

export interface AddParticipantToStudyRequest {
  studyId: string;
  statusId?: string;
  statusName?: string;
}

export interface RegistryExportRequest {
  search: RegistrySearchRequest;
  fields?: string[];
  format?: string;
}

export interface RegistryExportResponse {
  status: string;
  participantCount: number;
  message: string;
}

export interface ParticipantLogResponse {
  id: string;
  type?: string;
  message?: string;
  userId?: string;
  userName?: string;
  timestamp?: string;
  status?: string;
  fileUrl?: string;
}

export interface ParticipantLogsResponse {
  globalLastContactDate?: string;
  logType?: string;
  logs: ParticipantLogResponse[];
}

export interface SurveySubmissionResponse {
  id: string;
  participantId: string;
  surveyId: string;
  studyId: string;
  surveyName?: string;
  status?: string;
  submittedAt?: string;
  submittedBy?: string;
}

export const registryApi = {
  async searchRegistryParticipants(request: RegistrySearchRequest): Promise<RegistrySearchResponse> {
    const res = await apiClient.post('/api/v1/registry/search', request);
    return res.data?.data;
  },

  async getRegistryFilterOptions(): Promise<RegistryFilterOptionsResponse> {
    const res = await apiClient.get('/api/v1/registry/filter-options');
    return res.data?.data;
  },

  async getRegistryParticipant(participantId: string): Promise<RegistryParticipantResponse> {
    const res = await apiClient.get(`/api/v1/registry/participants/${participantId}`);
    return res.data?.data;
  },

  async getRegistryParticipantLogs(participantId: string, type: string): Promise<ParticipantLogsResponse> {
    const res = await apiClient.get(`/api/v1/registry/participants/${participantId}/logs`, {
      params: { type },
    });
    return res.data?.data;
  },

  async getRegistrySurveySubmissions(participantId: string): Promise<SurveySubmissionResponse[]> {
    const res = await apiClient.get(`/api/v1/registry/participants/${participantId}/survey-submissions`);
    return res.data?.data || [];
  },

  async getSavedRegistrySearches(): Promise<SavedRegistrySearchResponse[]> {
    const res = await apiClient.get('/api/v1/registry/saved-searches');
    return res.data?.data || [];
  },

  async saveRegistrySearch(request: SavedRegistrySearchRequest): Promise<SavedRegistrySearchResponse> {
    const res = await apiClient.post('/api/v1/registry/saved-searches', request);
    return res.data?.data;
  },

  async deleteSavedSearch(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/registry/saved-searches/${id}`);
  },

  async createRegistryParticipant(request: CreateRegistryParticipantRequest): Promise<RegistryParticipantResponse> {
    const res = await apiClient.post('/api/v1/registry/participants', request);
    return res.data?.data;
  },

  async updateRegistryParticipant(
    participantId: string,
    request: UpdateRegistryParticipantRequest
  ): Promise<RegistryParticipantResponse> {
    const res = await apiClient.put(`/api/v1/registry/participants/${participantId}`, request);
    return res.data?.data;
  },

  async deleteRegistryParticipant(participantId: string): Promise<void> {
    await apiClient.delete(`/api/v1/registry/participants/${participantId}`);
  },

  async addRegistryParticipantToStudy(
    participantId: string,
    request: AddParticipantToStudyRequest
  ): Promise<RegistryParticipantResponse> {
    const res = await apiClient.post(`/api/v1/registry/participants/${participantId}/studies`, request);
    return res.data?.data;
  },

  async exportRegistryParticipants(request: RegistryExportRequest): Promise<RegistryExportResponse> {
    const res = await apiClient.post('/api/v1/registry/export', request);
    return res.data?.data;
  },
};

export default registryApi;
