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
  MOCK_DASHBOARD_OVERVIEW,
  MOCK_CAMPAIGNS,
  MOCK_SURVEYS,
  MOCK_SURVEY_DASHBOARD,
  MOCK_TASKS,
  MOCK_COMMUNICATIONS,
  MOCK_DOCUMENTS,
  MockUserRecord,
} from './mockData';

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
  }

  // Users & Auth
  public getUsers(): MockUserRecord[] {
    return this.users;
  }

  public findUserByUsername(username: string): MockUserRecord | undefined {
    const normalized = (username || '').trim().toLowerCase();
    return this.users.find((u) => u.user.username.toLowerCase() === normalized || u.user.email.toLowerCase() === normalized);
  }

  public findUserByToken(token: string): MockUserRecord | undefined {
    return this.users.find((u) => u.token === token);
  }

  // Dashboard Overview
  public getDashboardOverview(): any {
    return {
      ...MOCK_DASHBOARD_OVERVIEW,
      totalStudies: this.studies.length,
      activeStudies: this.studies.filter((s) => s.status === 'ACTIVE').length,
      totalParticipants: this.participants.length + 2447,
    };
  }

  // Studies
  public getStudies(): any[] {
    return [...this.studies];
  }

  public findStudy(id: string | number): any {
    const sid = String(id);
    return this.studies.find((s) => String(s.id) === sid || s.studyId === sid);
  }

  public createStudy(data: any): any {
    const newStudy = {
      id: `ST-${String(this.studies.length + 1).padStart(3, '0')}`,
      studyId: `ST-${String(this.studies.length + 1).padStart(3, '0')}`,
      protocolNumber: `EN-2026-${String(this.studies.length + 1).padStart(3, '0')}`,
      status: 'ACTIVE',
      ...data,
    };
    this.studies.push(newStudy);
    return newStudy;
  }

  public updateStudy(id: string | number, data: any): any {
    const study = this.findStudy(id);
    if (!study) return null;
    Object.assign(study, data);
    return study;
  }

  // Participants
  public getParticipants(): any[] {
    return [...this.participants];
  }

  public findParticipant(id: string | number): any {
    const pid = String(id);
    return this.participants.find((p) => String(p.id) === pid || p.participantId === pid);
  }

  public updateParticipantStatus(id: string | number, status: string): any {
    const participant = this.findParticipant(id);
    if (!participant) return null;
    participant.status = status;
    return participant;
  }

  // Sites
  public getSites(): any[] {
    return [...this.sites];
  }

  public findSite(code: string): any {
    const normalized = (code || '').toLowerCase();
    return this.sites.find((s) => s.siteCode.toLowerCase() === normalized);
  }

  // Admin
  public getAdminDashboard(): any {
    return {
      ...MOCK_ADMIN_DASHBOARD,
      totalUsers: this.adminUsers.length + 46,
    };
  }

  public getAdminUsers(): any[] {
    return [...this.adminUsers];
  }

  public findAdminUser(id: number | string): any {
    return this.adminUsers.find((u) => String(u.id) === String(id));
  }

  public createAdminUser(data: any): any {
    const newUser = {
      id: this.adminUsers.length + 1,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      ...data,
    };
    this.adminUsers.push(newUser);
    return newUser;
  }

  public updateAdminUser(id: number | string, data: any): any {
    const user = this.findAdminUser(id);
    if (!user) return null;
    Object.assign(user, data);
    return user;
  }

  public getAdminRoles(): any[] {
    return MOCK_ADMIN_ROLES;
  }

  public getAdminLocations(): any[] {
    return MOCK_ADMIN_LOCATIONS;
  }

  public getAdminAuditLogs(): any[] {
    return MOCK_ADMIN_AUDIT_LOGS;
  }

  // Campaigns
  public getCampaigns(): any[] {
    return [...this.campaigns];
  }

  public findCampaign(id: string | number): any {
    return this.campaigns.find((c) => String(c.id) === String(id) || c.campaignId === String(id));
  }

  // Surveys
  public getSurveys(): any[] {
    return [...this.surveys];
  }

  public findSurvey(id: number | string): any {
    return this.surveys.find((s) => String(s.id) === String(id));
  }

  public getSurveyDashboard(): any {
    return MOCK_SURVEY_DASHBOARD;
  }

  // Tasks
  public getTasks(): any[] {
    return [...this.tasks];
  }

  public findTask(taskId: string): any {
    return this.tasks.find((t) => t.taskId === taskId);
  }

  public createTask(data: any): any {
    const newTask = {
      taskId: `TSK-${this.tasks.length + 101}`,
      status: 'PENDING',
      ...data,
    };
    this.tasks.push(newTask);
    return newTask;
  }

  public updateTaskStatus(taskId: string, status: string): any {
    const task = this.findTask(taskId);
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
