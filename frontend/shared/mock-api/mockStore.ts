import approvedDemoDashboardData from '../../microfrontends/dashboard/src/demo/dashboard-demo-data.json';
// frontend/shared/mock-api/mockStore.ts - In-Memory State Store for Mock API
import {
  MOCK_USERS,
  MOCK_STUDIES,
  MOCK_PARTICIPANTS,
  MOCK_SITES,
  MOCK_ADMIN_DASHBOARD,
  MOCK_ADMIN_USERS,
  MOCK_ADMIN_ROLES,
  MOCK_ADMIN_LOCATIONS,
  MOCK_ADMIN_AUDIT_LOGS,
  MOCK_CAMPAIGNS,
  MOCK_SURVEYS,
  MOCK_SURVEY_DASHBOARD,
  MOCK_TASKS,
  MOCK_COMMUNICATIONS,
  MOCK_DOCUMENTS,
  MockUserRecord,
} from './mockData';

export const DEFAULT_MOCK_SECURITY_SETTINGS = {
  id: '33333333-3333-3333-3333-333333333333',
  tenantId: '11111111-1111-1111-1111-111111111111',
  maxFailedLoginAttempts: 10,
  preventConcurrentSessions: false,
  inactivityLogoutMinutes: 30,
  inactivityLockDays: 90,
  passwordExpiryDays: 300,
  passwordHistoryCount: 4,
  minimumPasswordLength: 10,
  minimumPasswordStrength: 'MODERATE',
  requireDigit: true,
  requireSymbol: true,
  requireMixedCase: true,
};

export const DEFAULT_MOCK_GENERAL_SETTINGS = {
  id: '44444444-4444-4444-4444-444444444444',
  tenantId: '11111111-1111-1111-1111-111111111111',
  defaultTextReply: 'This is an automated message. We can not receive replies to this number.',
};

class MockStore {
  private users: MockUserRecord[] = [];
  private studies: any[] = [];
  private participants: any[] = [];
  private sites: any[] = [];
  private adminUsers: any[] = [];
  private tasks: any[] = [];
  private surveys: any[] = [];
  private campaigns: any[] = [];
  private communications: any[] = [];
  private documents: any[] = [];
  private securitySettings: any = {};
  private generalSettings: any = {};

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.users = JSON.parse(JSON.stringify(MOCK_USERS));
    this.studies = JSON.parse(JSON.stringify(MOCK_STUDIES));
    this.participants = JSON.parse(JSON.stringify(MOCK_PARTICIPANTS));
    this.sites = JSON.parse(JSON.stringify(MOCK_SITES));
    this.adminUsers = JSON.parse(JSON.stringify(MOCK_ADMIN_USERS));
    this.tasks = JSON.parse(JSON.stringify(MOCK_TASKS));
    this.surveys = JSON.parse(JSON.stringify(MOCK_SURVEYS));
    this.campaigns = JSON.parse(JSON.stringify(MOCK_CAMPAIGNS));
    this.communications = JSON.parse(JSON.stringify(MOCK_COMMUNICATIONS));
    this.documents = JSON.parse(JSON.stringify(MOCK_DOCUMENTS));
    this.securitySettings = JSON.parse(JSON.stringify(DEFAULT_MOCK_SECURITY_SETTINGS));
    this.generalSettings = JSON.parse(JSON.stringify(DEFAULT_MOCK_GENERAL_SETTINGS));
  }

  // Security Settings
  public getSecuritySettings(): any {
    return { ...this.securitySettings };
  }

  public updateSecuritySettings(payload: any): any {
    this.securitySettings = {
      ...this.securitySettings,
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    return { ...this.securitySettings };
  }

  public resetSecuritySettings(): any {
    this.securitySettings = JSON.parse(JSON.stringify(DEFAULT_MOCK_SECURITY_SETTINGS));
    return { ...this.securitySettings };
  }

  // General Settings
  public getGeneralSettings(): any {
    return { ...this.generalSettings };
  }

  public updateGeneralSettings(payload: any): any {
    this.generalSettings = {
      ...this.generalSettings,
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    return { ...this.generalSettings };
  }

  // Users & Auth
  public getUsers(): MockUserRecord[] {
    return this.users;
  }

  public findUserByUsername(username: string): MockUserRecord | undefined {
    const normalized = (username || '').trim().toLowerCase();
    return this.users.find((u) => u.user.username.toLowerCase() === normalized || u.user.email.toLowerCase() === normalized);
  }

  public findUserById(id: string): MockUserRecord | undefined {
    return this.users.find((u) => u.user.id === id);
  }

  public findUserByEmail(email: string): MockUserRecord | undefined {
    const normalized = (email || '').trim().toLowerCase();
    return this.users.find((u) => u.user.email.toLowerCase() === normalized);
  }

  public findUserByToken(token: string): MockUserRecord | undefined {
    return this.users.find((u) => u.token === token);
  }

  // Studies
  public getStudies(): any[] {
    return [...this.studies];
  }

  public findStudy(id: string): any {
    return this.studies.find((s) => s.id === id);
  }

  public createStudy(study: any): any {
    const newStudy = {
      id: `study-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...study,
    };
    this.studies.unshift(newStudy);
    return newStudy;
  }

  public updateStudy(id: string, patch: any): any {
    const index = this.studies.findIndex((s) => s.id === id);
    if (index === -1) return null;
    this.studies[index] = {
      ...this.studies[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    return this.studies[index];
  }

  // Participants
  public getParticipants(): any[] {
    return [...this.participants];
  }

  public findParticipant(id: string | number): any {
    return this.participants.find((p) => String(p.id) === String(id));
  }

  public createParticipant(participant: any): any {
    const newP = {
      id: `p-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...participant,
    };
    this.participants.unshift(newP);
    return newP;
  }

  public updateParticipant(id: string | number, patch: any): any {
    const index = this.participants.findIndex((p) => String(p.id) === String(id));
    if (index === -1) return null;
    this.participants[index] = {
      ...this.participants[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    return this.participants[index];
  }

  public updateParticipantStatus(id: string | number, status: string): any {
    return this.updateParticipant(id, { status });
  }

  // Sites
  public getSites(): any[] {
    return [...this.sites];
  }

  public findSite(id: string | number): any {
    return this.sites.find((s) => String(s.id) === String(id));
  }

  // Admin
  public getAdminDashboard(): any {
    return { ...MOCK_ADMIN_DASHBOARD };
  }

  public getAdminUsers(): any[] {
    return [...this.adminUsers];
  }

  public findAdminUser(id: string): any {
    return this.adminUsers.find((u) => u.id === id);
  }

  public createAdminUser(user: any): any {
    const newAdmin = {
      id: `admin-${Date.now()}`,
      status: 'active',
      createdAt: new Date().toISOString(),
      ...user,
    };
    this.adminUsers.unshift(newAdmin);
    return newAdmin;
  }

  public updateAdminUser(id: string, patch: any): any {
    const index = this.adminUsers.findIndex((u) => u.id === id);
    if (index === -1) return null;
    this.adminUsers[index] = { ...this.adminUsers[index], ...patch };
    return this.adminUsers[index];
  }

  public getAdminRoles(): any[] {
    return [...MOCK_ADMIN_ROLES];
  }

  public getAdminLocations(): any[] {
    return [...MOCK_ADMIN_LOCATIONS];
  }

  public getAdminAuditLogs(): any[] {
    return [...MOCK_ADMIN_AUDIT_LOGS];
  }

  // Dashboard Overview
  public getDashboardOverview(): any {
    return { ...approvedDemoDashboardData.overview, recentStudies: approvedDemoDashboardData.studies };
  }

  // Campaigns
  public getCampaigns(): any[] {
    return [...this.campaigns];
  }

  public findCampaign(id: string): any {
    return this.campaigns.find((c) => c.campaignId === id);
  }

  // Surveys
  public getSurveys(): any[] {
    return [...this.surveys];
  }

  public getSurveyDashboard(): any {
    return { ...MOCK_SURVEY_DASHBOARD };
  }

  public findSurvey(id: string): any {
    return this.surveys.find((s) => s.id === id || s.surveyId === id);
  }

  // Tasks
  public getTasks(): any[] {
    return [...this.tasks];
  }

  public findTask(id: string): any {
    return this.tasks.find((t) => t.id === id);
  }

  public createTask(task: any): any {
    const newT = {
      id: `task-${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      ...task,
    };
    this.tasks.unshift(newT);
    return newT;
  }

  public updateTaskStatus(id: string, status: string): any {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return null;
    task.status = status;
    return task;
  }

  // Communications
  public getCommunications(): any[] {
    return [...this.communications];
  }

  // Documents
  public getDocuments(): any[] {
    return [...this.documents];
  }

  public findDocument(id: string): any {
    return this.documents.find((d) => d.documentId === id);
  }
}

export const mockStore = new MockStore();
export default mockStore;
