// frontend/shared/api/accountApi.ts - Authoritative My Account API client
import { apiClient } from '../api-client';
import { getTenantId } from '../api-config';

export interface UserProfile {
  userId: string;
  tenantId: string;
  email: string;
  emailVerified: boolean;
  title: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  profilePhotoUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  timezone: string | null;
  ignoreTimezoneMismatch: boolean;
  passwordExpiringDays: number | null;
}

export interface UpdateUserProfilePayload {
  firstName?: string;
  lastName?: string;
  title?: string;
  phoneNumber?: string;
  timezone?: string;
  ignoreTimezoneMismatch?: boolean;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RequestEmailChangePayload {
  newEmail: string;
}

export interface EmailStatusResponse {
  primaryEmail: string;
  primaryEmailVerified: boolean;
  pendingEmail?: string | null;
  hasPendingChange: boolean;
}

export interface RecentLogin {
  loginAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface StudyNotificationPreference {
  studyId: string;
  studyName: string;
  studyRole: string;
  accessRole: string;
  dailyDigest: boolean;
  taskEmails: boolean;
  participantEmails: boolean;
  surveySubmissions: boolean;
}

export interface UpdateStudyPreferencePayload {
  dailyDigest?: boolean;
  taskEmails?: boolean;
  participantEmails?: boolean;
  surveySubmissions?: boolean;
}

export const accountApi = {
  getProfile: async (tenantId?: string): Promise<UserProfile> => {
    const tid = tenantId || getTenantId();
    const response = await apiClient.get<UserProfile>(`/api/v1/tenants/${tid}/account/profile`);
    return (response.data as any)?.data ?? response.data;
  },

  updateProfile: async (payload: UpdateUserProfilePayload, tenantId?: string): Promise<UserProfile> => {
    const tid = tenantId || getTenantId();
    const response = await apiClient.put<UserProfile>(`/api/v1/tenants/${tid}/account/profile`, payload);
    return (response.data as any)?.data ?? response.data;
  },

  changePassword: async (payload: ChangePasswordPayload, tenantId?: string): Promise<{ message: string }> => {
    const tid = tenantId || getTenantId();
    const response = await apiClient.post<{ message: string }>(`/api/v1/tenants/${tid}/account/password`, payload);
    return (response.data as any)?.data ?? response.data;
  },

  requestEmailChange: async (newEmail: string, tenantId?: string): Promise<{ message: string }> => {
    const tid = tenantId || getTenantId();
    const response = await apiClient.post<{ message: string }>(`/api/v1/tenants/${tid}/account/email/request-change`, { newEmail });
    return (response.data as any)?.data ?? response.data;
  },

  verifyEmail: async (token: string, tenantId?: string): Promise<{ message: string }> => {
    const tid = tenantId || getTenantId();
    const response = await apiClient.get<{ message: string }>(`/api/v1/tenants/${tid}/account/email/verify`, {
      params: { token },
    });
    return (response.data as any)?.data ?? response.data;
  },

  getEmailStatus: async (tenantId?: string): Promise<EmailStatusResponse> => {
    const tid = tenantId || getTenantId();
    const response = await apiClient.get<EmailStatusResponse>(`/api/v1/tenants/${tid}/account/email/status`);
    return (response.data as any)?.data ?? response.data;
  },

  getRecentLogins: async (tenantId?: string): Promise<RecentLogin[]> => {
    const tid = tenantId || getTenantId();
    const response = await apiClient.get<RecentLogin[]>(`/api/v1/tenants/${tid}/account/recent-logins`);
    const list = (response.data as any)?.data ?? response.data;
    return Array.isArray(list) ? list : [];
  },

  getStudyPreferences: async (tenantId?: string): Promise<StudyNotificationPreference[]> => {
    const tid = tenantId || getTenantId();
    const response = await apiClient.get<StudyNotificationPreference[]>(`/api/v1/tenants/${tid}/account/studies`);
    const list = (response.data as any)?.data ?? response.data;
    return Array.isArray(list) ? list : [];
  },

  updateStudyPreference: async (
    studyId: string,
    payload: UpdateStudyPreferencePayload,
    tenantId?: string
  ): Promise<StudyNotificationPreference> => {
    const tid = tenantId || getTenantId();
    const response = await apiClient.patch<StudyNotificationPreference>(
      `/api/v1/tenants/${tid}/account/studies/${studyId}/notifications`,
      payload
    );
    return (response.data as any)?.data ?? response.data;
  },

  uploadProfilePhoto: async (file: File | Blob, tenantId?: string): Promise<{ profilePhotoUrl: string }> => {
    const tid = tenantId || getTenantId();
    const formData = new FormData();
    formData.append('file', file, 'profile-photo.jpg');
    const response = await apiClient.post<{ profilePhotoUrl: string }>(
      `/api/v1/tenants/${tid}/account/profile-photo`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return (response.data as any)?.data ?? response.data;
  },

  sendDailyDigestNow: async (tenantId?: string): Promise<{ message: string }> => {
    const tid = tenantId || getTenantId();
    const response = await apiClient.post<{ message: string }>(`/api/v1/tenants/${tid}/account/send-daily-digest`);
    return (response.data as any)?.data ?? response.data;
  },
};
