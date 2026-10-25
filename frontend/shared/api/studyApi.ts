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

export interface StudyGrant {
  id?: string;
  grantNumber: string;
  agency: string;
}

export interface StudyDetails {
  id: string;
  tenantId?: string;
  studyCode: string;
  name: string;
  longName?: string;
  description?: string;
  irbId?: string;
  recruitmentStartDate?: string;
  recruitmentEndDate?: string;
  completionDate?: string;
  sampleSize?: number;
  locale?: string;
  allowParticipationInOtherStudies: boolean;
  studyUrlLabel?: string;
  studyUrl?: string;
  archived: boolean;
  canManage: boolean;
  customIdGenerationEnabled?: boolean;
  prefix?: string;
  grants: StudyGrant[];
}

export interface UpdateStudyDetailsPayload {
  name: string;
  longName?: string;
  description?: string;
  irbId?: string;
  recruitmentStartDate?: string;
  recruitmentEndDate?: string;
  completionDate?: string;
  allowParticipationInOtherStudies?: boolean;
  customIdGenerationEnabled?: boolean;
  prefix?: string;
  studyUrlLabel?: string;
  studyUrl?: string;
  grants: StudyGrant[];
}

/** Mirrors backend ParticipantColumnDto (legacy Ripple column object: { label, value, cId?, title? }). */
export interface ParticipantColumn {
  label: string;
  value: string;
  cId?: string | null;
  title?: string | null;
}

/** Mirrors backend LocaleOptionDto (legacy Ripple supportedLocales entry). */
export interface LocaleOption {
  value: string;
  label: string;
}

export interface StudyDisplaySettings {
  studyId: string;
  locale: string;
  showGlobalComments: boolean;
  defaultGlobalLogs: boolean;
  statusPageCombinedView: boolean;
  enrolledParticipantColumnsShowEvents: boolean;
  potentialParticipantColumns: ParticipantColumn[];
  enrolledParticipantColumns: ParticipantColumn[];
  availableColumnOptions: ParticipantColumn[];
  supportedLocales: LocaleOption[];
  canManage: boolean;
}

export interface UpdateStudyDisplaySettingsPayload {
  locale?: string;
  showGlobalComments?: boolean;
  defaultGlobalLogs?: boolean;
  statusPageCombinedView?: boolean;
  enrolledParticipantColumnsShowEvents?: boolean;
  potentialParticipantColumns?: ParticipantColumn[];
  enrolledParticipantColumns?: ParticipantColumn[];
}

export type BulkTaskTriggerAction = 'completed' | 'scheduled';

export interface BulkTaskTrigger {
  eventId: string;
  action: BulkTaskTriggerAction | string;
}

export interface BulkTask {
  _id: string;
  studyId?: string;
  bulkTaskGroupId: string;
  name: string;
  description?: string;
  assignedTo: string[];
  assignedToInitials?: string;
  rank: number;
}

export interface BulkTaskGroup {
  _id: string;
  studyId?: string;
  name: string;
  description?: string;
  triggerActive: boolean;
  trigger?: BulkTaskTrigger | null;
  tasks: BulkTask[];
}

export interface StudyEventOption {
  _id: string;
  name: string;
}

export interface BulkTaskTeamMember {
  userId: string;
  name: string;
  email?: string;
  initials?: string;
  role?: string;
}

/** Mirrors backend StudyBulkTasksResponse. Every Bulk Tasks mutation returns this refreshed snapshot. */
export interface StudyBulkTasksData {
  studyId: string;
  canManage: boolean;
  bulkTaskGroups: BulkTaskGroup[];
  bulkTasks: BulkTask[];
  events: StudyEventOption[];
  teamMembers: BulkTaskTeamMember[];
}

export interface SaveBulkTaskGroupPayload {
  name: string;
  description?: string;
  triggerActive?: boolean;
  trigger?: BulkTaskTrigger | null;
}

export interface SaveBulkTaskPayload {
  name: string;
  description?: string;
  assignedTo?: string[];
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

  async getStudyDetails(id: string | number, config?: StudyApiRequestConfig): Promise<StudyDetails> {
    const res = await apiClient.get(`/api/v1/studies/${id}/details`, { skipToast: true, ...config } as any);
    return (res.data as any)?.data ?? res.data;
  },

  async updateStudyDetails(id: string | number, payload: UpdateStudyDetailsPayload, config?: StudyApiRequestConfig): Promise<StudyDetails> {
    const res = await apiClient.put(`/api/v1/studies/${id}/details`, payload, config);
    return (res.data as any)?.data ?? res.data;
  },

  async exportStudy(id: string | number, config?: StudyApiRequestConfig): Promise<Record<string, unknown>> {
    const res = await apiClient.get(`/api/v1/studies/${id}/export`, config);
    return (res.data as any)?.data ?? res.data;
  },

  async importStudyComponents(id: string | number, components: any, config?: StudyApiRequestConfig): Promise<Record<string, unknown>> {
    const res = await apiClient.post(`/api/v1/studies/${id}/import-components`, components, config);
    return (res.data as any)?.data ?? res.data;
  },

  async getStudyDisplaySettings(id: string | number, config?: StudyApiRequestConfig): Promise<StudyDisplaySettings> {
    const res = await apiClient.get(`/api/v1/studies/${id}/display-settings`, { skipToast: true, ...config } as any);
    return (res.data as any)?.data ?? res.data;
  },

  async updateStudyDisplaySettings(
    id: string | number,
    payload: UpdateStudyDisplaySettingsPayload,
    config?: StudyApiRequestConfig
  ): Promise<StudyDisplaySettings> {
    const res = await apiClient.put(`/api/v1/studies/${id}/display-settings`, payload, config);
    return (res.data as any)?.data ?? res.data;
  },

  async getStudyBulkTasks(id: string | number, config?: StudyApiRequestConfig): Promise<StudyBulkTasksData> {
    const res = await apiClient.get(`/api/v1/studies/${id}/bulk-tasks`, { skipToast: true, ...config } as any);
    return (res.data as any)?.data ?? res.data;
  },

  async createBulkTaskGroup(
    studyId: string | number,
    payload: SaveBulkTaskGroupPayload,
    config?: StudyApiRequestConfig
  ): Promise<StudyBulkTasksData> {
    const res = await apiClient.post(`/api/v1/studies/${studyId}/bulk-task-groups`, payload, config);
    return (res.data as any)?.data ?? res.data;
  },

  async updateBulkTaskGroup(
    studyId: string | number,
    groupId: string,
    payload: SaveBulkTaskGroupPayload,
    config?: StudyApiRequestConfig
  ): Promise<StudyBulkTasksData> {
    const res = await apiClient.put(`/api/v1/studies/${studyId}/bulk-task-groups/${groupId}`, payload, config);
    return (res.data as any)?.data ?? res.data;
  },

  async deleteBulkTaskGroup(
    studyId: string | number,
    groupId: string,
    config?: StudyApiRequestConfig
  ): Promise<StudyBulkTasksData> {
    const res = await apiClient.delete(`/api/v1/studies/${studyId}/bulk-task-groups/${groupId}`, config);
    return (res.data as any)?.data ?? res.data;
  },

  async createBulkTask(
    studyId: string | number,
    groupId: string,
    payload: SaveBulkTaskPayload,
    config?: StudyApiRequestConfig
  ): Promise<StudyBulkTasksData> {
    const res = await apiClient.post(`/api/v1/studies/${studyId}/bulk-task-groups/${groupId}/tasks`, payload, config);
    return (res.data as any)?.data ?? res.data;
  },

  async updateBulkTask(
    studyId: string | number,
    taskId: string,
    payload: SaveBulkTaskPayload,
    config?: StudyApiRequestConfig
  ): Promise<StudyBulkTasksData> {
    const res = await apiClient.put(`/api/v1/studies/${studyId}/bulk-tasks/${taskId}`, payload, config);
    return (res.data as any)?.data ?? res.data;
  },

  async deleteBulkTask(
    studyId: string | number,
    taskId: string,
    config?: StudyApiRequestConfig
  ): Promise<StudyBulkTasksData> {
    const res = await apiClient.delete(`/api/v1/studies/${studyId}/bulk-tasks/${taskId}`, config);
    return (res.data as any)?.data ?? res.data;
  },

  async reorderBulkTasks(
    studyId: string | number,
    groupId: string,
    taskIds: string[],
    config?: StudyApiRequestConfig
  ): Promise<StudyBulkTasksData> {
    const res = await apiClient.put(
      `/api/v1/studies/${studyId}/bulk-task-groups/${groupId}/tasks/order`,
      { taskIds },
      config
    );
    return (res.data as any)?.data ?? res.data;
  },

  async deleteStudy(id: string | number, config?: StudyApiRequestConfig): Promise<void> {
    await apiClient.delete(`/api/v1/studies/${id}`, config);
  },
};

export default studyApi;
