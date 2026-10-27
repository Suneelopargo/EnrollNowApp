// frontend/shared/api/studyApi.ts - Centralized Study Management API
import { apiClient } from '../api-client';
import type { AxiosRequestConfig } from 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipToast?: boolean;
    skipLoader?: boolean;
    silent?: boolean;
  }
}

export interface ApiResponseEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: {
    code?: string;
    message?: string;
    details?: string[];
  };
}

function unwrapResponse<T>(responseData: ApiResponseEnvelope<T> | T): T {
  if (responseData && typeof responseData === 'object' && 'data' in responseData) {
    const envelope = responseData as ApiResponseEnvelope<T>;
    if (envelope.data !== undefined) {
      return envelope.data;
    }
  }
  return responseData as T;
}

function unwrapArrayResponse<T>(responseData: ApiResponseEnvelope<T[]> | T[]): T[] {
  if (Array.isArray(responseData)) {
    return responseData;
  }
  if (responseData && typeof responseData === 'object' && 'data' in responseData) {
    const envelope = responseData as ApiResponseEnvelope<T[]>;
    if (Array.isArray(envelope.data)) {
      return envelope.data;
    }
  }
  return [];
}

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
  [key: string]: unknown;
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

export interface StudyScheduledActionDetails {
  actionTriggerStudyId?: string;
  actionType?: 'email' | 'text' | string;
  actionTriggerType?: 'event' | 'variable' | 'customVariable' | string;
  actionTriggerId?: string;
  triggerName?: string;
}

export interface StudyScheduledActionSchedule {
  relativeInterval: number;
  relativeUnit: 'hours' | 'days' | 'weeks' | 'months' | string;
  relativeBeforeOrAfter: 'before' | 'after' | string;
  dateType?: 'scheduled' | 'actual' | string;
}

export interface StudyScheduledAction {
  action?: StudyScheduledActionDetails;
  schedule?: StudyScheduledActionSchedule;
}

export interface StudyEmailTemplate {
  _id: string;
  studyId?: string;
  name: string;
  description?: string;
  subject: string;
  message: string;
  design?: string;
  messageIsHtml?: boolean;
  replyTo?: string;
  senderName?: string;
  attachmentFileIds?: string[];
  archived: boolean;
  rank: number;
  scheduledAction?: StudyScheduledAction | null;
}

export interface StudyTextTemplate {
  _id: string;
  studyId?: string;
  name: string;
  description?: string;
  message: string;
  archived: boolean;
  rank: number;
  scheduledAction?: StudyScheduledAction | null;
}

export interface StudyEmailTextSettingsData {
  studyId: string;
  canManage: boolean;
  textMessagingEnabled: boolean;
  emailTemplates: StudyEmailTemplate[];
  textTemplates: StudyTextTemplate[];
  events: StudyEventOption[];
}

export interface SaveEmailTemplatePayload {
  name: string;
  subject: string;
  description?: string;
  message: string;
  design?: string;
  messageIsHtml?: boolean;
  replyTo?: string;
  senderName?: string;
  attachmentFileIds?: string[];
  scheduledAction?: StudyScheduledAction | null;
}

export interface SaveTextTemplatePayload {
  name: string;
  description?: string;
  message: string;
  scheduledAction?: StudyScheduledAction | null;
}

export interface StudyMilestone {
  id?: string;
  milestoneDate: string;
  participantTarget: number;
  description?: string;
}

export interface AgeRange {
  min?: number | null;
  max?: number | null;
}

export interface GenderGroup {
  id?: string;
  gender: string;
  participants?: number | null;
}

export interface DemographicGroup {
  id?: string;
  defaultCategoryName: string; // 'age' | 'sex' | 'ethnicity' | 'race'
  label: string;
  sampleSize: string;
  ageRange?: AgeRange | null;
  genderGroups?: GenderGroup[];
}

export interface VariableOption {
  label: string;
  value: string;
  order?: number;
}

export interface StudyCustomVariable {
  id?: string;
  name: string;
  variableType: string; // 'single' | 'multi' | 'short' | 'long' | 'number' | 'date' | 'dateTime'
  options?: VariableOption[];
  isGlobal?: boolean;
  isBlind?: boolean;
  rank?: number;
}

export interface StudyVariableGroup {
  id?: string;
  name: string;
  variableIds?: string[];
  members?: string[];
  rank?: number;
}

export interface StudyLayoutItem {
  id?: string;
  type: 'variable' | 'group';
  refId: string;
  rank?: number;
}

export interface ContactTaxonomy {
  id?: string;
  name: string;
  type: string; // 'relationship' | 'outcome'
}

export interface StudyRequirementsData {
  studyId: string;
  sampleSize: number | null;
  milestones: StudyMilestone[];
  studyGroups: DemographicGroup[];
  customVariables: StudyCustomVariable[];
  variableGroups: StudyVariableGroup[];
  customVariableLayout: StudyLayoutItem[];
  contactRelationships: ContactTaxonomy[];
  contactOutcomes: ContactTaxonomy[];
  globalVariables: StudyCustomVariable[];
  canManage?: boolean;
}

export interface UpdateStudyRequirementsPayload {
  sampleSize?: number | null;
  studyGroups?: DemographicGroup[];
  customVariables?: StudyCustomVariable[];
  variableGroups?: StudyVariableGroup[];
  customVariableLayout?: StudyLayoutItem[];
  contactRelationships?: ContactTaxonomy[];
  contactOutcomes?: ContactTaxonomy[];
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
    const res = await apiClient.get<ApiResponseEnvelope<Study[]> | Study[]>('/api/v1/studies', { skipToast: true, ...config });
    return unwrapArrayResponse(res.data);
  },

  async getStudy(id: string | number, config?: StudyApiRequestConfig): Promise<Study> {
    const res = await apiClient.get<ApiResponseEnvelope<Study> | Study>(`/api/v1/studies/${id}`, { skipToast: true, ...config });
    return unwrapResponse(res.data);
  },

  async getStudyPermissions(id: string | number, tenantId?: string, config?: StudyApiRequestConfig): Promise<StudyNavigationPermissions> {
    const url = tenantId ? `/api/v1/tenants/${tenantId}/studies/${id}/permissions` : `/api/v1/studies/${id}/permissions`;
    const res = await apiClient.get<ApiResponseEnvelope<StudyNavigationPermissions> | StudyNavigationPermissions>(url, { skipToast: true, ...config });
    return unwrapResponse(res.data);
  },

  async createStudy(study: Partial<Study>, config?: StudyApiRequestConfig): Promise<Study> {
    const res = await apiClient.post<ApiResponseEnvelope<Study> | Study>('/api/v1/studies', study, config);
    return unwrapResponse(res.data);
  },

  async copyStudy(payload: CopyStudyPayload, config?: StudyApiRequestConfig): Promise<Study> {
    const res = await apiClient.post<ApiResponseEnvelope<Study> | Study>('/api/v1/studies/copy', payload, config);
    return unwrapResponse(res.data);
  },

  async importStudy(studyName: string, file: File, config?: StudyApiRequestConfig): Promise<ImportStudyResult> {
    const formData = new FormData();
    formData.append('studyName', studyName);
    formData.append('file', file);
    const res = await apiClient.post<ApiResponseEnvelope<ImportStudyResult> | ImportStudyResult>('/api/v1/studies/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config,
    });
    return unwrapResponse(res.data);
  },

  async importStudyJson(studyName: string, studyData: unknown, config?: StudyApiRequestConfig): Promise<ImportStudyResult> {
    const res = await apiClient.post<ApiResponseEnvelope<ImportStudyResult> | ImportStudyResult>(
      '/api/v1/studies/import',
      { studyName, studyData },
      config
    );
    return unwrapResponse(res.data);
  },

  async updateStudy(id: string | number, study: Partial<Study>, config?: StudyApiRequestConfig): Promise<Study> {
    const res = await apiClient.put<ApiResponseEnvelope<Study> | Study>(`/api/v1/studies/${id}`, study, config);
    return unwrapResponse(res.data);
  },

  async archiveStudy(id: string | number, config?: StudyApiRequestConfig): Promise<Study> {
    const res = await apiClient.post<ApiResponseEnvelope<Study> | Study>(`/api/v1/studies/${id}/archive`, {}, config);
    return unwrapResponse(res.data);
  },

  async restoreStudy(id: string | number, config?: StudyApiRequestConfig): Promise<Study> {
    const res = await apiClient.post<ApiResponseEnvelope<Study> | Study>(`/api/v1/studies/${id}/restore`, {}, config);
    return unwrapResponse(res.data);
  },

  async getStudyDetails(id: string | number, config?: StudyApiRequestConfig): Promise<StudyDetails> {
    const res = await apiClient.get<ApiResponseEnvelope<StudyDetails> | StudyDetails>(`/api/v1/studies/${id}/details`, { skipToast: true, ...config });
    return unwrapResponse(res.data);
  },

  async updateStudyDetails(id: string | number, payload: UpdateStudyDetailsPayload, config?: StudyApiRequestConfig): Promise<StudyDetails> {
    const res = await apiClient.put<ApiResponseEnvelope<StudyDetails> | StudyDetails>(`/api/v1/studies/${id}/details`, payload, config);
    return unwrapResponse(res.data);
  },

  async exportStudy(id: string | number, config?: StudyApiRequestConfig): Promise<Record<string, unknown>> {
    const res = await apiClient.get<ApiResponseEnvelope<Record<string, unknown>> | Record<string, unknown>>(`/api/v1/studies/${id}/export`, config);
    return unwrapResponse(res.data);
  },

  async importStudyComponents(id: string | number, components: Record<string, unknown>, config?: StudyApiRequestConfig): Promise<Record<string, unknown>> {
    const res = await apiClient.post<ApiResponseEnvelope<Record<string, unknown>> | Record<string, unknown>>(`/api/v1/studies/${id}/import-components`, components, config);
    return unwrapResponse(res.data);
  },

  async getStudyDisplaySettings(id: string | number, config?: StudyApiRequestConfig): Promise<StudyDisplaySettings> {
    const res = await apiClient.get<ApiResponseEnvelope<StudyDisplaySettings> | StudyDisplaySettings>(`/api/v1/studies/${id}/display-settings`, { skipToast: true, ...config });
    return unwrapResponse(res.data);
  },

  async updateStudyDisplaySettings(
    id: string | number,
    payload: UpdateStudyDisplaySettingsPayload,
    config?: StudyApiRequestConfig
  ): Promise<StudyDisplaySettings> {
    const res = await apiClient.put<ApiResponseEnvelope<StudyDisplaySettings> | StudyDisplaySettings>(`/api/v1/studies/${id}/display-settings`, payload, config);
    return unwrapResponse(res.data);
  },

  async getStudyBulkTasks(id: string | number, config?: StudyApiRequestConfig): Promise<StudyBulkTasksData> {
    const res = await apiClient.get<ApiResponseEnvelope<StudyBulkTasksData> | StudyBulkTasksData>(`/api/v1/studies/${id}/bulk-tasks`, { skipToast: true, ...config });
    return unwrapResponse(res.data);
  },

  async createBulkTaskGroup(
    studyId: string | number,
    payload: SaveBulkTaskGroupPayload,
    config?: StudyApiRequestConfig
  ): Promise<StudyBulkTasksData> {
    const res = await apiClient.post<ApiResponseEnvelope<StudyBulkTasksData> | StudyBulkTasksData>(`/api/v1/studies/${studyId}/bulk-task-groups`, payload, config);
    return unwrapResponse(res.data);
  },

  async updateBulkTaskGroup(
    studyId: string | number,
    groupId: string,
    payload: SaveBulkTaskGroupPayload,
    config?: StudyApiRequestConfig
  ): Promise<StudyBulkTasksData> {
    const res = await apiClient.put<ApiResponseEnvelope<StudyBulkTasksData> | StudyBulkTasksData>(`/api/v1/studies/${studyId}/bulk-task-groups/${groupId}`, payload, config);
    return unwrapResponse(res.data);
  },

  async deleteBulkTaskGroup(
    studyId: string | number,
    groupId: string,
    config?: StudyApiRequestConfig
  ): Promise<StudyBulkTasksData> {
    const res = await apiClient.delete<ApiResponseEnvelope<StudyBulkTasksData> | StudyBulkTasksData>(`/api/v1/studies/${studyId}/bulk-task-groups/${groupId}`, config);
    return unwrapResponse(res.data);
  },

  async createBulkTask(
    studyId: string | number,
    groupId: string,
    payload: SaveBulkTaskPayload,
    config?: StudyApiRequestConfig
  ): Promise<StudyBulkTasksData> {
    const res = await apiClient.post<ApiResponseEnvelope<StudyBulkTasksData> | StudyBulkTasksData>(`/api/v1/studies/${studyId}/bulk-task-groups/${groupId}/tasks`, payload, config);
    return unwrapResponse(res.data);
  },

  async updateBulkTask(
    studyId: string | number,
    taskId: string,
    payload: SaveBulkTaskPayload,
    config?: StudyApiRequestConfig
  ): Promise<StudyBulkTasksData> {
    const res = await apiClient.put<ApiResponseEnvelope<StudyBulkTasksData> | StudyBulkTasksData>(`/api/v1/studies/${studyId}/bulk-tasks/${taskId}`, payload, config);
    return unwrapResponse(res.data);
  },

  async deleteBulkTask(
    studyId: string | number,
    taskId: string,
    config?: StudyApiRequestConfig
  ): Promise<StudyBulkTasksData> {
    const res = await apiClient.delete<ApiResponseEnvelope<StudyBulkTasksData> | StudyBulkTasksData>(`/api/v1/studies/${studyId}/bulk-tasks/${taskId}`, config);
    return unwrapResponse(res.data);
  },

  async reorderBulkTasks(
    studyId: string | number,
    groupId: string,
    taskIds: string[],
    config?: StudyApiRequestConfig
  ): Promise<StudyBulkTasksData> {
    const res = await apiClient.put<ApiResponseEnvelope<StudyBulkTasksData> | StudyBulkTasksData>(
      `/api/v1/studies/${studyId}/bulk-task-groups/${groupId}/tasks/order`,
      { taskIds },
      config
    );
    return unwrapResponse(res.data);
  },

  async getStudyEmailTextSettings(id: string | number, config?: StudyApiRequestConfig): Promise<StudyEmailTextSettingsData> {
    const res = await apiClient.get<ApiResponseEnvelope<StudyEmailTextSettingsData> | StudyEmailTextSettingsData>(`/api/v1/studies/${id}/email-text-settings`, { skipToast: true, ...config });
    return unwrapResponse(res.data);
  },

  async createEmailTemplate(
    studyId: string | number,
    payload: SaveEmailTemplatePayload,
    config?: StudyApiRequestConfig
  ): Promise<StudyEmailTextSettingsData> {
    const res = await apiClient.post<ApiResponseEnvelope<StudyEmailTextSettingsData> | StudyEmailTextSettingsData>(`/api/v1/studies/${studyId}/email-templates`, payload, config);
    return unwrapResponse(res.data);
  },

  async updateEmailTemplate(
    studyId: string | number,
    templateId: string,
    payload: SaveEmailTemplatePayload,
    config?: StudyApiRequestConfig
  ): Promise<StudyEmailTextSettingsData> {
    const res = await apiClient.put<ApiResponseEnvelope<StudyEmailTextSettingsData> | StudyEmailTextSettingsData>(`/api/v1/studies/${studyId}/email-templates/${templateId}`, payload, config);
    return unwrapResponse(res.data);
  },

  async copyEmailTemplate(
    studyId: string | number,
    templateId: string,
    config?: StudyApiRequestConfig
  ): Promise<StudyEmailTextSettingsData> {
    const res = await apiClient.post<ApiResponseEnvelope<StudyEmailTextSettingsData> | StudyEmailTextSettingsData>(`/api/v1/studies/${studyId}/email-templates/${templateId}/copy`, {}, config);
    return unwrapResponse(res.data);
  },

  async archiveEmailTemplate(
    studyId: string | number,
    templateId: string,
    config?: StudyApiRequestConfig
  ): Promise<StudyEmailTextSettingsData> {
    const res = await apiClient.put<ApiResponseEnvelope<StudyEmailTextSettingsData> | StudyEmailTextSettingsData>(`/api/v1/studies/${studyId}/email-templates/${templateId}/archive`, {}, config);
    return unwrapResponse(res.data);
  },

  async restoreEmailTemplate(
    studyId: string | number,
    templateId: string,
    config?: StudyApiRequestConfig
  ): Promise<StudyEmailTextSettingsData> {
    const res = await apiClient.put<ApiResponseEnvelope<StudyEmailTextSettingsData> | StudyEmailTextSettingsData>(`/api/v1/studies/${studyId}/email-templates/${templateId}/restore`, {}, config);
    return unwrapResponse(res.data);
  },

  async deleteEmailTemplate(
    studyId: string | number,
    templateId: string,
    config?: StudyApiRequestConfig
  ): Promise<StudyEmailTextSettingsData> {
    const res = await apiClient.delete<ApiResponseEnvelope<StudyEmailTextSettingsData> | StudyEmailTextSettingsData>(`/api/v1/studies/${studyId}/email-templates/${templateId}`, config);
    return unwrapResponse(res.data);
  },

  async reorderEmailTemplates(
    studyId: string | number,
    templateIds: string[],
    config?: StudyApiRequestConfig
  ): Promise<StudyEmailTextSettingsData> {
    const res = await apiClient.put<ApiResponseEnvelope<StudyEmailTextSettingsData> | StudyEmailTextSettingsData>(
      `/api/v1/studies/${studyId}/email-templates/order`,
      { templateIds },
      config
    );
    return unwrapResponse(res.data);
  },

  async createTextTemplate(
    studyId: string | number,
    payload: SaveTextTemplatePayload,
    config?: StudyApiRequestConfig
  ): Promise<StudyEmailTextSettingsData> {
    const res = await apiClient.post<ApiResponseEnvelope<StudyEmailTextSettingsData> | StudyEmailTextSettingsData>(`/api/v1/studies/${studyId}/text-templates`, payload, config);
    return unwrapResponse(res.data);
  },

  async updateTextTemplate(
    studyId: string | number,
    templateId: string,
    payload: SaveTextTemplatePayload,
    config?: StudyApiRequestConfig
  ): Promise<StudyEmailTextSettingsData> {
    const res = await apiClient.put<ApiResponseEnvelope<StudyEmailTextSettingsData> | StudyEmailTextSettingsData>(`/api/v1/studies/${studyId}/text-templates/${templateId}`, payload, config);
    return unwrapResponse(res.data);
  },

  async copyTextTemplate(
    studyId: string | number,
    templateId: string,
    config?: StudyApiRequestConfig
  ): Promise<StudyEmailTextSettingsData> {
    const res = await apiClient.post<ApiResponseEnvelope<StudyEmailTextSettingsData> | StudyEmailTextSettingsData>(`/api/v1/studies/${studyId}/text-templates/${templateId}/copy`, {}, config);
    return unwrapResponse(res.data);
  },

  async archiveTextTemplate(
    studyId: string | number,
    templateId: string,
    config?: StudyApiRequestConfig
  ): Promise<StudyEmailTextSettingsData> {
    const res = await apiClient.put<ApiResponseEnvelope<StudyEmailTextSettingsData> | StudyEmailTextSettingsData>(`/api/v1/studies/${studyId}/text-templates/${templateId}/archive`, {}, config);
    return unwrapResponse(res.data);
  },

  async restoreTextTemplate(
    studyId: string | number,
    templateId: string,
    config?: StudyApiRequestConfig
  ): Promise<StudyEmailTextSettingsData> {
    const res = await apiClient.put<ApiResponseEnvelope<StudyEmailTextSettingsData> | StudyEmailTextSettingsData>(`/api/v1/studies/${studyId}/text-templates/${templateId}/restore`, {}, config);
    return unwrapResponse(res.data);
  },

  async deleteTextTemplate(
    studyId: string | number,
    templateId: string,
    config?: StudyApiRequestConfig
  ): Promise<StudyEmailTextSettingsData> {
    const res = await apiClient.delete<ApiResponseEnvelope<StudyEmailTextSettingsData> | StudyEmailTextSettingsData>(`/api/v1/studies/${studyId}/text-templates/${templateId}`, config);
    return unwrapResponse(res.data);
  },

  async reorderTextTemplates(
    studyId: string | number,
    templateIds: string[],
    config?: StudyApiRequestConfig
  ): Promise<StudyEmailTextSettingsData> {
    const res = await apiClient.put<ApiResponseEnvelope<StudyEmailTextSettingsData> | StudyEmailTextSettingsData>(
      `/api/v1/studies/${studyId}/text-templates/order`,
      { templateIds },
      config
    );
    return unwrapResponse(res.data);
  },

  async getStudyRequirements(id: string | number, config?: StudyApiRequestConfig): Promise<StudyRequirementsData> {
    const res = await apiClient.get<ApiResponseEnvelope<StudyRequirementsData> | StudyRequirementsData>(`/api/v1/studies/${id}/requirements`, { skipToast: true, ...config });
    return unwrapResponse(res.data);
  },

  async updateStudyRequirements(
    id: string | number,
    payload: UpdateStudyRequirementsPayload,
    config?: StudyApiRequestConfig
  ): Promise<StudyRequirementsData> {
    const res = await apiClient.put<ApiResponseEnvelope<StudyRequirementsData> | StudyRequirementsData>(`/api/v1/studies/${id}/requirements`, payload, config);
    return unwrapResponse(res.data);
  },

  async addStudyMilestone(
    id: string | number,
    milestone: StudyMilestone,
    config?: StudyApiRequestConfig
  ): Promise<StudyMilestone> {
    const res = await apiClient.post<ApiResponseEnvelope<StudyMilestone> | StudyMilestone>(`/api/v1/studies/${id}/milestones`, milestone, config);
    return unwrapResponse(res.data);
  },

  async updateStudyMilestone(
    id: string | number,
    milestoneId: string,
    milestone: StudyMilestone,
    config?: StudyApiRequestConfig
  ): Promise<StudyMilestone> {
    const res = await apiClient.put<ApiResponseEnvelope<StudyMilestone> | StudyMilestone>(`/api/v1/studies/${id}/milestones/${milestoneId}`, milestone, config);
    return unwrapResponse(res.data);
  },

  async deleteStudyMilestone(
    id: string | number,
    milestoneId: string,
    config?: StudyApiRequestConfig
  ): Promise<void> {
    await apiClient.delete(`/api/v1/studies/${id}/milestones/${milestoneId}`, config);
  },

  async getGlobalCustomVariables(
    id: string | number,
    config?: StudyApiRequestConfig
  ): Promise<StudyCustomVariable[]> {
    const res = await apiClient.get<ApiResponseEnvelope<StudyCustomVariable[]> | StudyCustomVariable[]>(`/api/v1/studies/${id}/global-variables`, { skipToast: true, ...config });
    return unwrapResponse(res.data);
  },

  async addGlobalVariableToStudy(
    id: string | number,
    variableId: string,
    config?: StudyApiRequestConfig
  ): Promise<StudyCustomVariable> {
    const res = await apiClient.post<ApiResponseEnvelope<StudyCustomVariable> | StudyCustomVariable>(`/api/v1/studies/${id}/global-variables/${variableId}`, {}, config);
    return unwrapResponse(res.data);
  },

  async deleteStudy(id: string | number, config?: StudyApiRequestConfig): Promise<void> {
    await apiClient.delete(`/api/v1/studies/${id}`, config);
  },
};

export default studyApi;
