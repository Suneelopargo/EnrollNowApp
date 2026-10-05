// frontend/shared/mock-api/mockData.ts - Deterministic Mock Data for EnrollNow Platform
import { AuthUser } from '../contracts';

export interface MockUserRecord {
  user: AuthUser;
  password: string;
  token: string;
}

export const EXPIRED_TOKEN = 'mock-expired-token';

/**
 * Deterministic Mock Users for Local Development & Testing.
 * WARNING: For local mock development only; never use in production.
 */
export const MOCK_USERS: MockUserRecord[] = [
  {
    user: {
      id: 1,
      username: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@enrollnow.local',
      roles: ['ADMIN', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'],
    },
    password: 'Admin@123',
    token: 'mock-jwt-admin-1',
  },
  {
    user: {
      id: 2,
      username: 'user',
      firstName: 'Test',
      lastName: 'User',
      email: 'user@enrollnow.local',
      roles: ['USER', 'ROLE_USER'],
    },
    password: 'User@123',
    token: 'mock-jwt-user-2',
  },
];

/**
 * Mock Dashboard Overview Metrics
 */
export const MOCK_DASHBOARD_OVERVIEW = {
  totalStudies: 12,
  activeStudies: 8,
  totalParticipants: 2450,
  activeParticipants: 1875,
  enrolledParticipants: 1875,
  screeningParticipants: 320,
  pendingTasks: 23,
  recruitmentVelocity: '+14.2%',
  recentStudies: [
    {
      id: 'ST-001',
      studyId: 'ST-001',
      protocolNumber: 'EN-2026-001',
      title: 'Phase III Oncology Trial in Solid Tumors',
      phase: 'Phase III',
      therapeuticArea: 'Oncology',
      targetEnrollment: 500,
      enrolled: 450,
      status: 'ACTIVE',
    },
    {
      id: 'ST-002',
      studyId: 'ST-002',
      protocolNumber: 'EN-2026-002',
      title: 'Cardiovascular Risk Factor Longitudinal Study',
      phase: 'Phase II',
      therapeuticArea: 'Cardiology',
      targetEnrollment: 1200,
      enrolled: 1200,
      status: 'ACTIVE',
    },
    {
      id: 'ST-003',
      studyId: 'ST-003',
      protocolNumber: 'EN-2026-003',
      title: 'Neurological Early Biomarker Screening Protocol',
      phase: 'Phase I',
      therapeuticArea: 'Neurology',
      targetEnrollment: 400,
      enrolled: 225,
      status: 'RECRUITING',
    },
  ],
};

/**
 * Mock Studies List
 */
export const MOCK_STUDIES = [
  {
    id: 'ST-001',
    studyId: 'ST-001',
    protocolNumber: 'EN-2026-001',
    title: 'Phase III Oncology Trial in Solid Tumors',
    phase: 'Phase III',
    therapeuticArea: 'Oncology',
    targetEnrollment: 500,
    status: 'ACTIVE',
  },
  {
    id: 'ST-002',
    studyId: 'ST-002',
    protocolNumber: 'EN-2026-002',
    title: 'Cardiovascular Risk Factor Longitudinal Study',
    phase: 'Phase II',
    therapeuticArea: 'Cardiology',
    targetEnrollment: 1200,
    status: 'ACTIVE',
  },
  {
    id: 'ST-003',
    studyId: 'ST-003',
    protocolNumber: 'EN-2026-003',
    title: 'Neurological Early Biomarker Screening Protocol',
    phase: 'Phase I',
    therapeuticArea: 'Neurology',
    targetEnrollment: 400,
    status: 'RECRUITING',
  },
];

/**
 * Mock Participants List
 */
export const MOCK_PARTICIPANTS = [
  {
    id: 1,
    participantId: 'PT-1001',
    firstName: 'Eleanor',
    lastName: 'Vance',
    email: 'eleanor.vance@example.com',
    phone: '+1-555-0101',
    studyId: 'ST-001',
    status: 'ENROLLED',
    enrolledAt: '2026-01-15T09:30:00Z',
  },
  {
    id: 2,
    participantId: 'PT-1002',
    firstName: 'Marcus',
    lastName: 'Chen',
    email: 'marcus.chen@example.com',
    phone: '+1-555-0102',
    studyId: 'ST-001',
    status: 'SCREENING',
    enrolledAt: '2026-02-10T14:15:00Z',
  },
  {
    id: 3,
    participantId: 'PT-1003',
    firstName: 'Sophia',
    lastName: 'Rodriguez',
    email: 'sophia.r@example.com',
    phone: '+1-555-0103',
    studyId: 'ST-002',
    status: 'COMPLETED',
    enrolledAt: '2025-11-01T11:00:00Z',
  },
];

/**
 * Mock Sites & Organization
 */
export const MOCK_SITES = [
  {
    siteCode: 'SITE-01',
    name: 'Boston Medical Research Center',
    city: 'Boston',
    state: 'MA',
    country: 'USA',
    phone: '+1-617-555-0199',
    activeStudies: 6,
    status: 'ACTIVE',
  },
  {
    siteCode: 'SITE-02',
    name: 'Pacific Clinical Trials Institute',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    phone: '+1-415-555-0188',
    activeStudies: 4,
    status: 'ACTIVE',
  },
  {
    siteCode: 'SITE-03',
    name: 'Midwest Health Science Center',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    phone: '+1-312-555-0177',
    activeStudies: 2,
    status: 'ACTIVE',
  },
];

/**
 * Mock Administrator Dashboard & Users
 */
export const MOCK_ADMIN_DASHBOARD = {
  totalUsers: 48,
  activeUsers: 42,
  pendingApprovals: 3,
  systemHealth: 'HEALTHY',
  auditEventsToday: 154,
};

export const MOCK_ADMIN_USERS = [
  {
    id: 1,
    username: 'admin',
    firstName: 'System',
    lastName: 'Administrator',
    email: 'admin@enrollnow.local',
    roles: ['ADMIN', 'ROLE_SUPER_ADMIN'],
    status: 'ACTIVE',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    username: 'user',
    firstName: 'Test',
    lastName: 'User',
    email: 'user@enrollnow.local',
    roles: ['USER'],
    status: 'ACTIVE',
    createdAt: '2025-03-10T12:00:00Z',
  },
];

export const MOCK_ADMIN_ROLES = [
  { id: 1, code: 'ADMIN', name: 'System Administrator', description: 'Full system privileges' },
  { id: 2, code: 'INVESTIGATOR', name: 'Principal Investigator', description: 'Study oversight' },
  { id: 3, code: 'COORDINATOR', name: 'Study Coordinator', description: 'Participant management' },
  { id: 4, code: 'USER', name: 'Standard User', description: 'Standard platform read/write' },
];

export const MOCK_ADMIN_LOCATIONS = [
  { id: 1, name: 'Main Campus Hospital', city: 'Boston', state: 'MA' },
  { id: 2, name: 'West Coast Outpatient Wing', city: 'San Francisco', state: 'CA' },
];

export const MOCK_ADMIN_AUDIT_LOGS = [
  {
    id: 101,
    action: 'USER_LOGIN',
    actor: 'admin',
    timestamp: '2026-10-05T08:00:00Z',
    ipAddress: '127.0.0.1',
    status: 'SUCCESS',
  },
  {
    id: 102,
    action: 'STUDY_UPDATED',
    actor: 'admin',
    timestamp: '2026-10-05T09:12:00Z',
    ipAddress: '127.0.0.1',
    status: 'SUCCESS',
  },
];

/**
 * Mock Recruitment Campaigns
 */
export const MOCK_CAMPAIGNS = [
  {
    id: 1,
    campaignId: 'CMP-01',
    name: 'Digital Health Social Outreach',
    channel: 'Digital / Social',
    studyId: 'ST-001',
    leads: 1420,
    screened: 380,
    enrolled: 125,
    status: 'ACTIVE',
  },
  {
    id: 2,
    campaignId: 'CMP-02',
    name: 'Primary Care Physician Referral Network',
    channel: 'PCP Referrals',
    studyId: 'ST-002',
    leads: 620,
    screened: 240,
    enrolled: 180,
    status: 'ACTIVE',
  },
];

/**
 * Mock Surveys & eConsent
 */
export const MOCK_SURVEYS = [
  {
    id: 1,
    title: 'Baseline Health & Eligibility Survey',
    description: 'Initial intake questionnaire for participant pre-screening',
    status: 'PUBLISHED',
    version: 1,
  },
  {
    id: 2,
    title: 'Electronic Informed Consent (eConsent)',
    description: 'Protocol-mandated regulatory consent form',
    status: 'PUBLISHED',
    version: 2,
  },
];

export const MOCK_SURVEY_DASHBOARD = {
  totalSurveys: 2,
  completedResponses: 1840,
  averageCompletionTime: '6.4 mins',
  completionRate: '94.2%',
};

/**
 * Mock Operational Tasks
 */
export const MOCK_TASKS = [
  {
    taskId: 'TSK-101',
    title: 'Review Participant Lab Results - PT-1002',
    category: 'Clinical',
    studyId: 'ST-001',
    assignee: 'Dr. Sarah Connor',
    dueDate: '2026-10-08',
    priority: 'HIGH',
    status: 'PENDING',
  },
  {
    taskId: 'TSK-102',
    title: 'Schedule Week 4 Follow-up Call - PT-1001',
    category: 'Coordination',
    studyId: 'ST-001',
    assignee: 'Nurse John Miller',
    dueDate: '2026-10-09',
    priority: 'NORMAL',
    status: 'PENDING',
  },
];

/**
 * Mock Communications
 */
export const MOCK_COMMUNICATIONS = [
  {
    messageId: 'MSG-001',
    recipientName: 'Eleanor Vance',
    channel: 'SMS',
    studyId: 'ST-001',
    type: 'APPOINTMENT_REMINDER',
    sentAt: '2026-10-04T10:00:00Z',
    status: 'DELIVERED',
  },
  {
    messageId: 'MSG-002',
    recipientName: 'Marcus Chen',
    channel: 'EMAIL',
    studyId: 'ST-001',
    type: 'WELCOME_PACKET',
    sentAt: '2026-10-05T08:30:00Z',
    status: 'DELIVERED',
  },
];

/**
 * Mock Documents
 */
export const MOCK_DOCUMENTS = [
  {
    documentId: 'DOC-001',
    title: 'Clinical Protocol v3.2.pdf',
    type: 'PROTOCOL',
    studyId: 'ST-001',
    format: 'PDF',
    size: '3.8 MB',
    uploadedAt: '2026-01-10T11:00:00Z',
    status: 'APPROVED',
  },
  {
    documentId: 'DOC-002',
    title: 'Investigator Brochure 2026.pdf',
    type: 'BROCHURE',
    studyId: 'ST-001',
    format: 'PDF',
    size: '12.4 MB',
    uploadedAt: '2026-02-01T15:20:00Z',
    status: 'APPROVED',
  },
];
