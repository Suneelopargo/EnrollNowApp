// frontend/shared/api/participantApi.ts - Centralized Participant & Registry API
import { apiClient } from '../api-client';

export interface DemographicOptions {
  ethnicity: string[];
  race: string[];
}
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
  duplicatesOnly?: boolean;
  exportFields?: string[];
  timezone?: string;
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

export interface ContactLogItem {
  id: string;
  tenantId?: string;
  participantId: string;
  studyId?: string;
  studyName?: string;
  dateTimeOfContact: string;
  formattedDateTime?: string;
  contactType: string;
  contactMethod?: string;
  contactedBy: string;
  contactedByName?: string;
  spokeTo?: string;
  regarding?: string;
  outcome: string;
  comments?: string;
  sticky: boolean;
  notify: boolean;
  global: boolean;
  lastContact: boolean;
  createdAt?: string;
  createdBy?: string;
  createdByName?: string;
  createdByInitials?: string;
  updatedAt?: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedByInitials?: string;
  editable?: boolean;
  pinnable?: boolean;
}

export interface CreateContactLogPayload {
  dateTimeOfContact: string;
  contactType: string;
  contactMethod?: string;
  contactedBy: string;
  spokeTo?: string;
  regarding?: string;
  outcome: string;
  comments?: string;
  sticky?: boolean;
  notify?: boolean;
  global?: boolean;
  lastContact?: boolean;
  studyId?: string;
}

export interface UpdateContactLogPayload {
  dateTimeOfContact?: string;
  contactType?: string;
  contactMethod?: string;
  contactedBy?: string;
  spokeTo?: string;
  regarding?: string;
  outcome?: string;
  comments?: string;
  sticky?: boolean;
  notify?: boolean;
  global?: boolean;
  lastContact?: boolean;
}

export interface ContactOutcomeOption {
  id: string;
  outcome: string;
  active?: boolean;
}

export interface ContactTypeOption {
  label: string;
  value: string;
}

export interface ConsentTypeOption {
  label: string;
  value: string;
}

export interface ConsentLogItem {
  id: string;
  tenantId?: string;
  participantId: string;
  studyId?: string;
  studyName?: string;
  consentDate: string;
  formattedConsentDate?: string;
  consentType: string;
  consentTitle: string;
  consentedBy?: string;
  version?: string;
  expiration?: string;
  formattedExpiration?: string;
  fileAttached?: boolean;
  fileId?: string;
  fileName?: string;
  fileSizeBytes?: number;
  fileContentType?: string;
  downloadUrl?: string;
  comments?: string;
  sticky?: boolean;
  notify?: boolean;
  global?: boolean;
  lastContact?: boolean;
  createdAt?: string;
  createdBy?: string;
  createdByName?: string;
  createdByInitials?: string;
  updatedAt?: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedByInitials?: string;
  editable?: boolean;
  pinnable?: boolean;
}

export interface CreateConsentLogPayload {
  studyId?: string;
  studyIdentifier?: string;
  consentDate: string;
  consentType: string;
  consentTitle: string;
  consentedBy?: string;
  version?: string;
  expiration?: string;
  comments?: string;
  sticky?: boolean;
  notify?: boolean;
  global?: boolean;
  lastContact?: boolean;
}

export interface UpdateConsentLogPayload {
  consentDate?: string;
  consentType?: string;
  consentTitle?: string;
  consentedBy?: string;
  version?: string;
  expiration?: string;
  comments?: string;
  sticky?: boolean;
  notify?: boolean;
  global?: boolean;
  lastContact?: boolean;
  removeAttachment?: boolean;
}

export interface ContactMethodOption {
  label: string;
  value: string;
  isPreferred?: boolean;
}

export interface ContactTeamMember {
  id: string;
  name: string;
  email?: string;
}

export interface ParticipantCommentItem {
  id: string;
  participantId: string;
  studyId?: string;
  studyName?: string;
  text: string;
  pinned: boolean;
  global: boolean;
  authorId?: string;
  authorName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunicationRecipientItem {
  id?: string;
  recipientType: 'TO' | 'CC' | 'BCC';
  recipientName?: string;
  recipientValue: string;
}

export interface CommunicationItem {
  id: string;
  participantId: string;
  studyId?: string;
  studyName?: string;
  global?: boolean;
  channel: 'EMAIL' | 'SMS' | 'PHONE' | 'OTHER';
  direction: 'OUTBOUND' | 'INBOUND';
  subject?: string;
  body: string;
  status: string;
  sentAt?: string;
  pinned: boolean;
  senderName?: string;
  recipients: CommunicationRecipientItem[];
}

export interface ParticipantContactDetail {
  id: string;
  participantId: string;
  contactType: string;
  contactValue: string;
  label?: string;
  contactName?: string;
  relationship?: string;
  canLeaveMessage: boolean;
  notes?: string;
  primaryContact: boolean;
  isPreferred: boolean;
  active: boolean;
  createdAt: string;
}

export interface ParticipantAddressDetail {
  id: string;
  participantId: string;
  addressType: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateRegion?: string;
  postalCode?: string;
  countryCode?: string;
  primaryAddress: boolean;
  active: boolean;
  createdAt: string;
}

export interface ConsentItem {
  id: string;
  participantId: string;
  studyId: string;
  studyName?: string;
  consentVersionId: string;
  consentVersionTitle?: string;
  versionNumber?: string;
  status: string; // CONSENTED, PENDING, DECLINED, WITHDRAWN
  consentedAt?: string;
  consentedByUserName?: string;
  consentMethod?: string;
  withdrawalReason?: string;
  createdAt: string;
}

export interface ConsentOptionItem {
  studyId: string;
  studyName: string;
  consentVersionId: string;
  consentVersionTitle: string;
  versionNumber: string;
}

export interface SurveyAssignmentItem {
  id: string;
  participantId: string;
  studyId?: string;
  studyName?: string;
  surveyVersionId: string;
  surveyCode?: string;
  surveyName?: string;
  status: string;
  assignedAt: string;
  dueAt?: string;
  completedAt?: string;
}

export interface SurveyOptionItem {
  surveyDefinitionId: string;
  code: string;
  name: string;
  description?: string;
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
      skipToast: true,
      ...config,
      params: {
        firstName,
        lastName,
        ...config?.params,
      },
    } as any);
    return res.data?.data ?? res.data ?? [];
  },

  async getParticipantTags(search?: string, limit: number = 20, config?: any): Promise<string[]> {
    const res = await apiClient.get('/api/v1/registry/participant-tags', {
      skipToast: true,
      ...config,
      params: {
        search: search?.trim() || undefined,
        limit,
        ...config?.params,
      },
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

  async getDemographicOptions(config?: any): Promise<DemographicOptions> {
    const res = await apiClient.get('/api/v1/registry/demographic-options', {
      skipToast: true,
      ...config,
    } as any);
    const data = res.data?.data ?? res.data ?? {};
    return {
      ethnicity: Array.isArray(data.ethnicity) ? data.ethnicity : [],
      race: Array.isArray(data.race) ? data.race : [],
    };
  },

  async getTimezones(options?: { tenantId?: string; siteId?: string }): Promise<string[]> {
    const res = await apiClient.get<string[] | { data: string[] }>('/api/v1/registry/timezone-options', {
      params: options,
      skipToast: true,
    } as any);
    const data = (res.data as any)?.data ?? res.data ?? [];
    return Array.isArray(data) ? data : [];
  },

  async getTimezoneOptions(options?: { tenantId?: string; siteId?: string }): Promise<string[]> {
    return this.getTimezones(options);
  },
  async getFilterMetadata(studyId?: string): Promise<any[]> {
    const res = await apiClient.get('/api/v1/registry/filter-metadata', {
      params: studyId ? { studyId } : undefined,
      skipToast: true,
    } as any);
    return res.data?.data ?? res.data ?? [];
  },

  async exportRegistry(params?: RegistrySearchParams): Promise<Blob> {
    try {
      const res = await apiClient.post('/api/v1/registry/export', params ?? {}, {
        responseType: 'blob',
        skipToast: true,
      } as any);
      return res.data;
    } catch (error: any) {
      const responseData = error?.response?.data;
      if (typeof Blob !== 'undefined' && responseData instanceof Blob) {
        const body = await responseData.text();
        let message = body;
        try {
          const payload = JSON.parse(body);
          message = payload?.error?.message || payload?.message || payload?.detail || body;
        } catch {
          // Keep a plain-text backend error when the response is not JSON.
        }
        if (!message || message.trimStart().startsWith('<')) message = 'The registry export request failed. Please try again.';
        throw new Error(message);
      }
      throw error;
    }
  },

  async getContactLogs(participantId: string, options?: { studyId?: string; tenantId?: string; siteId?: string }): Promise<ContactLogItem[]> {
    const res = await apiClient.get(`/api/v1/participants/${participantId}/contact-logs`, {
      params: options,
      skipToast: true,
    } as any);
    return res.data?.data ?? res.data ?? [];
  },

  async getContactLog(participantId: string, logId: string, options?: { tenantId?: string; siteId?: string }): Promise<ContactLogItem> {
    const res = await apiClient.get(`/api/v1/participants/${participantId}/contact-logs/${logId}`, {
      params: options,
      skipToast: true,
    } as any);
    return res.data?.data ?? res.data;
  },

  async getContactTypeOptions(options?: { studyId?: string; tenantId?: string }): Promise<ContactTypeOption[]> {
    const res = await apiClient.get('/api/v1/participants/contact-types', {
      params: options,
      skipToast: true,
    } as any);
    return res.data?.data ?? res.data ?? [];
  },

  async getContactOutcomes(options?: { tenantId?: string }): Promise<ContactOutcomeOption[]> {
    const res = await apiClient.get('/api/v1/participants/contact-outcomes', {
      params: options,
      skipToast: true,
    } as any);
    return res.data?.data ?? res.data ?? [];
  },

  async getParticipantContactMethods(participantId: string, options?: { studyId?: string; tenantId?: string }): Promise<ContactMethodOption[]> {
    const res = await apiClient.get(`/api/v1/participants/${participantId}/contact-methods`, {
      params: options,
      skipToast: true,
    } as any);
    return res.data?.data ?? res.data ?? [];
  },

  async getContactTeamMembers(options?: { studyId?: string; tenantId?: string }): Promise<ContactTeamMember[]> {
    const res = await apiClient.get('/api/v1/participants/contact-team-members', {
      params: options,
      skipToast: true,
    } as any);
    return res.data?.data ?? res.data ?? [];
  },

  async createContactLog(participantId: string, payload: CreateContactLogPayload, options?: { tenantId?: string; siteId?: string }): Promise<ContactLogItem> {
    const res = await apiClient.post(`/api/v1/participants/${participantId}/contact-logs`, payload, {
      params: options,
    });
    return res.data?.data ?? res.data;
  },

  async updateContactLog(participantId: string, logId: string, payload: UpdateContactLogPayload, options?: { tenantId?: string; siteId?: string }): Promise<ContactLogItem> {
    const res = await apiClient.put(`/api/v1/participants/${participantId}/contact-logs/${logId}`, payload, {
      params: options,
    });
    return res.data?.data ?? res.data;
  },

  async pinContactLog(participantId: string, logId: string, sticky: boolean, options?: { tenantId?: string; siteId?: string }): Promise<ContactLogItem> {
    const res = await apiClient.patch(`/api/v1/participants/${participantId}/contact-logs/${logId}/pin`, { sticky }, {
      params: options,
    });
    return res.data?.data ?? res.data;
  },

  async deleteContactLog(participantId: string, logId: string, options?: { tenantId?: string; siteId?: string }): Promise<void> {
    await apiClient.delete(`/api/v1/participants/${participantId}/contact-logs/${logId}`, {
      params: options,
    });
  },

  // 1. Comments
  async getComments(participantId: string, options?: { tenantId?: string; siteId?: string }): Promise<ParticipantCommentItem[]> {
    const res = await apiClient.get(`/api/v1/participants/${participantId}/comments`, { params: options, skipToast: true } as any);
    return res.data?.data ?? res.data ?? [];
  },

  async createComment(
    participantId: string,
    payload: { text: string; pinned?: boolean; global?: boolean; studyId?: string; authorName?: string },
    options?: { tenantId?: string; siteId?: string }
  ): Promise<ParticipantCommentItem> {
    const res = await apiClient.post(`/api/v1/participants/${participantId}/comments`, payload, { params: options });
    return res.data?.data ?? res.data;
  },

  async updateComment(participantId: string, commentId: string, payload: { text: string; pinned?: boolean }, options?: { tenantId?: string; siteId?: string }): Promise<ParticipantCommentItem> {
    const res = await apiClient.put(`/api/v1/participants/${participantId}/comments/${commentId}`, payload, { params: options });
    return res.data?.data ?? res.data;
  },

  async pinComment(participantId: string, commentId: string, sticky: boolean, options?: { tenantId?: string; siteId?: string }): Promise<ParticipantCommentItem> {
    const res = await apiClient.patch(`/api/v1/participants/${participantId}/comments/${commentId}/pin`, { sticky }, { params: options });
    return res.data?.data ?? res.data;
  },

  async deleteComment(participantId: string, commentId: string, options?: { tenantId?: string; siteId?: string }): Promise<void> {
    await apiClient.delete(`/api/v1/participants/${participantId}/comments/${commentId}`, { params: options });
  },

  // 2. Communications (Email & SMS)
  async getEmails(participantId: string, options?: { tenantId?: string; siteId?: string }): Promise<CommunicationItem[]> {
    const res = await apiClient.get(`/api/v1/participants/${participantId}/emails`, { params: options, skipToast: true } as any);
    return res.data?.data ?? res.data ?? [];
  },

  async sendEmail(participantId: string, payload: { to: string[]; cc?: string[]; bcc?: string[]; subject: string; body: string; replyTo?: string; senderName?: string; pinned?: boolean; studyId?: string }, options?: { tenantId?: string; siteId?: string }): Promise<CommunicationItem> {
    const res = await apiClient.post(`/api/v1/participants/${participantId}/emails`, payload, { params: options });
    return res.data?.data ?? res.data;
  },

  async pinEmail(participantId: string, emailId: string, sticky: boolean, options?: { tenantId?: string; siteId?: string }): Promise<CommunicationItem> {
    const res = await apiClient.patch(`/api/v1/participants/${participantId}/emails/${emailId}/pin`, { sticky }, { params: options });
    return res.data?.data ?? res.data;
  },

  async getEmailRecipients(participantId: string, options?: { tenantId?: string; siteId?: string }): Promise<string[]> {
    const res = await apiClient.get(`/api/v1/participants/${participantId}/email-recipients`, { params: options, skipToast: true } as any);
    return res.data?.data ?? res.data ?? [];
  },

  async getSms(participantId: string, options?: { tenantId?: string; siteId?: string }): Promise<CommunicationItem[]> {
    const res = await apiClient.get(`/api/v1/participants/${participantId}/sms`, { params: options, skipToast: true } as any);
    return res.data?.data ?? res.data ?? [];
  },

  async sendSms(participantId: string, payload: { toPhone?: string; toPhones?: string[]; body: string; pinned?: boolean; studyId?: string }, options?: { tenantId?: string; siteId?: string }): Promise<CommunicationItem> {
    const res = await apiClient.post(`/api/v1/participants/${participantId}/sms`, payload, { params: options });
    return res.data?.data ?? res.data;
  },

  async pinSms(participantId: string, smsId: string, sticky: boolean, options?: { tenantId?: string; siteId?: string }): Promise<CommunicationItem> {
    const res = await apiClient.patch(`/api/v1/participants/${participantId}/sms/${smsId}/pin`, { sticky }, { params: options });
    return res.data?.data ?? res.data;
  },

  async getSmsRecipients(participantId: string, options?: { tenantId?: string; siteId?: string }): Promise<string[]> {
    const res = await apiClient.get(`/api/v1/participants/${participantId}/sms-recipients`, { params: options, skipToast: true } as any);
    return res.data?.data ?? res.data ?? [];
  },

  // 3. Contact Management
  async getContacts(participantId: string, options?: { tenantId?: string; siteId?: string }): Promise<ParticipantContactDetail[]> {
    const res = await apiClient.get(`/api/v1/participants/${participantId}/contacts`, { params: options, skipToast: true } as any);
    return res.data?.data ?? res.data ?? [];
  },

  async createContact(participantId: string, payload: Partial<ParticipantContactDetail>, options?: { tenantId?: string; siteId?: string }): Promise<ParticipantContactDetail> {
    const res = await apiClient.post(`/api/v1/participants/${participantId}/contacts`, payload, { params: options });
    return res.data?.data ?? res.data;
  },

  async deleteContact(participantId: string, contactId: string, options?: { tenantId?: string; siteId?: string }): Promise<void> {
    await apiClient.delete(`/api/v1/participants/${participantId}/contacts/${contactId}`, { params: options });
  },

  async getAddresses(participantId: string, options?: { tenantId?: string; siteId?: string }): Promise<ParticipantAddressDetail[]> {
    const res = await apiClient.get(`/api/v1/participants/${participantId}/addresses`, { params: options, skipToast: true } as any);
    return res.data?.data ?? res.data ?? [];
  },

  async createAddress(participantId: string, payload: Partial<ParticipantAddressDetail>, options?: { tenantId?: string; siteId?: string }): Promise<ParticipantAddressDetail> {
    const res = await apiClient.post(`/api/v1/participants/${participantId}/addresses`, payload, { params: options });
    return res.data?.data ?? res.data;
  },

  async deleteAddress(participantId: string, addressId: string, options?: { tenantId?: string; siteId?: string }): Promise<void> {
    await apiClient.delete(`/api/v1/participants/${participantId}/addresses/${addressId}`, { params: options });
  },

  // 4. Consent
  async getConsents(participantId: string, options?: { tenantId?: string; siteId?: string }): Promise<ConsentItem[]> {
    const res = await apiClient.get(`/api/v1/participants/${participantId}/consents`, { params: options, skipToast: true } as any);
    return res.data?.data ?? res.data ?? [];
  },

  async recordConsent(participantId: string, payload: { studyId: string; consentVersionId: string; status?: string; consentDate?: string; consentMethod?: string; withdrawalReason?: string }, options?: { tenantId?: string; siteId?: string }): Promise<ConsentItem> {
    const res = await apiClient.post(`/api/v1/participants/${participantId}/consents`, payload, { params: options });
    return res.data?.data ?? res.data;
  },

  async getConsentOptions(participantId: string, options?: { tenantId?: string; siteId?: string }): Promise<ConsentOptionItem[]> {
    const res = await apiClient.get(`/api/v1/participants/${participantId}/consent-options`, { params: options, skipToast: true } as any);
    return res.data?.data ?? res.data ?? [];
  },

  // 4b. Administrative Consent Logs
  async getConsentLogs(participantId: string, options?: { studyId?: string; tenantId?: string; siteId?: string }): Promise<ConsentLogItem[]> {
    const res = await apiClient.get(`/api/v1/participants/${participantId}/consent-logs`, { params: options, skipToast: true } as any);
    return res.data?.data ?? res.data ?? [];
  },

  async getConsentLog(participantId: string, logId: string, options?: { tenantId?: string; siteId?: string }): Promise<ConsentLogItem> {
    const res = await apiClient.get(`/api/v1/participants/${participantId}/consent-logs/${logId}`, { params: options, skipToast: true } as any);
    return res.data?.data ?? res.data;
  },

  async getConsentTypeOptions(options?: { studyId?: string; tenantId?: string }): Promise<ConsentTypeOption[]> {
    const res = await apiClient.get('/api/v1/participants/consent-types', { params: options, skipToast: true } as any);
    return res.data?.data ?? res.data ?? [];
  },

  async createConsentLog(participantId: string, payload: CreateConsentLogPayload, file?: File | null, options?: { tenantId?: string; siteId?: string }): Promise<ConsentLogItem> {
    if (file) {
      const formData = new FormData();
      formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
      formData.append('file', file);
      const res = await apiClient.post(`/api/v1/participants/${participantId}/consent-logs`, formData, {
        params: options,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data?.data ?? res.data;
    }
    const res = await apiClient.post(`/api/v1/participants/${participantId}/consent-logs`, payload, { params: options });
    return res.data?.data ?? res.data;
  },

  async updateConsentLog(participantId: string, logId: string, payload: UpdateConsentLogPayload, file?: File | null, options?: { tenantId?: string; siteId?: string }): Promise<ConsentLogItem> {
    if (file) {
      const formData = new FormData();
      formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
      formData.append('file', file);
      const res = await apiClient.put(`/api/v1/participants/${participantId}/consent-logs/${logId}`, formData, {
        params: options,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data?.data ?? res.data;
    }
    const res = await apiClient.put(`/api/v1/participants/${participantId}/consent-logs/${logId}`, payload, { params: options });
    return res.data?.data ?? res.data;
  },

  async pinConsentLog(participantId: string, logId: string, sticky: boolean, options?: { tenantId?: string; siteId?: string }): Promise<ConsentLogItem> {
    const res = await apiClient.patch(`/api/v1/participants/${participantId}/consent-logs/${logId}/pin`, { sticky }, { params: options });
    return res.data?.data ?? res.data;
  },

  async deleteConsentLog(participantId: string, logId: string, options?: { tenantId?: string; siteId?: string }): Promise<void> {
    await apiClient.delete(`/api/v1/participants/${participantId}/consent-logs/${logId}`, { params: options });
  },

  getConsentAttachmentUrl(participantId: string, logId: string, options?: { tenantId?: string; siteId?: string }): string {
    const params = new URLSearchParams();
    if (options?.tenantId) params.append('tenantId', options.tenantId);
    if (options?.siteId) params.append('siteId', options.siteId);
    const qs = params.toString();
    return `/api/v1/participants/${participantId}/consent-logs/${logId}/attachment${qs ? '?' + qs : ''}`;
  },

  // 5. Forms
  async getForms(participantId: string, options?: { tenantId?: string; siteId?: string }): Promise<SurveyAssignmentItem[]> {
    const res = await apiClient.get(`/api/v1/participants/${participantId}/forms`, { params: options, skipToast: true } as any);
    return res.data?.data ?? res.data ?? [];
  },

  async assignForm(participantId: string, payload: { surveyDefinitionId: string; studyId?: string; dueAt?: string }, options?: { tenantId?: string; siteId?: string }): Promise<SurveyAssignmentItem> {
    const res = await apiClient.post(`/api/v1/participants/${participantId}/forms/assign`, payload, { params: options });
    return res.data?.data ?? res.data;
  },

  async updateFormStatus(participantId: string, assignmentId: string, status: string, options?: { tenantId?: string; siteId?: string }): Promise<SurveyAssignmentItem> {
    const res = await apiClient.patch(`/api/v1/participants/${participantId}/forms/${assignmentId}/status`, null, {
      params: { ...options, status },
    });
    return res.data?.data ?? res.data;
  },

  async getAvailableForms(participantId: string, options?: { tenantId?: string; siteId?: string }): Promise<SurveyOptionItem[]> {
    const res = await apiClient.get(`/api/v1/participants/${participantId}/available-forms`, { params: options, skipToast: true } as any);
    return res.data?.data ?? res.data ?? [];
  },
};

export default participantApi;
