// frontend/shell/src/remotes/RemoteRegistry.ts - Authoritative Remote Micro-Frontend Registry
import { RemoteDefinition } from '../../../shared/contracts';
import { getCachedRuntimeConfig } from '../../../shared/runtime-config';

export const DEFAULT_BACKEND_URLS: Record<string, string> = {
  identity: 'http://localhost:8081',
  administration: 'http://localhost:8082',
  organization: 'http://localhost:8083',
  study: 'http://localhost:8084',
  participant: 'http://localhost:8085',
  recruitment: 'http://localhost:8086',
  survey: 'http://localhost:8087',
  task: 'http://localhost:8088',
  communication: 'http://localhost:8089',
  document: 'http://localhost:8090',
  dashboard: 'http://localhost:8091',
};

export const BASE_REMOTE_DEFINITIONS: Record<string, Omit<RemoteDefinition, 'remoteUrl' | 'enabled'>> = {
  identity: {
    id: 'identity',
    name: 'Identity & Authentication MFE',
    route: '/login',
    exposedModule: 'IdentityModule',
    version: '1.0.0',
    description: 'User login, token refresh, and identity profile management',
  },
  administration: {
    id: 'administration',
    name: 'Administration & RBAC MFE',
    route: '/admin',
    exposedModule: 'AdministrationModule',
    requiredPermissions: ['ROLE_SUPER_ADMIN', 'ROLE_SITE_ADMIN', 'ROLE_ADMIN'],
    version: '1.0.0',
    description: 'System user management, RBAC matrix, and audit ledger viewer',
  },
  dashboard: {
    id: 'dashboard',
    name: 'Clinical Operations Dashboard MFE',
    route: '/dashboard',
    exposedModule: 'DashboardModule',
    version: '1.0.0',
    description: 'Executive clinical trials overview and recruitment velocity metrics',
  },
  organization: {
    id: 'organization',
    name: 'Organization & Sites MFE',
    route: '/organization',
    exposedModule: 'OrganizationModule',
    version: '1.0.0',
    description: 'Clinical research sites and network facility directory',
  },
  study: {
    id: 'study',
    name: 'Study Management MFE',
    route: '/studies',
    exposedModule: 'StudyModule',
    version: '1.0.0',
    description: 'Clinical trial protocols, therapeutic areas, and target accrual',
  },
  participant: {
    id: 'participant',
    name: 'Participant Queue MFE',
    route: '/participants',
    exposedModule: 'ParticipantModule',
    version: '1.0.0',
    description: 'Participant registry intake, pre-screening eligibility, and eConsent',
  },
  recruitment: {
    id: 'recruitment',
    name: 'Recruitment Campaigns MFE',
    route: '/recruitment',
    exposedModule: 'RecruitmentModule',
    version: '1.0.0',
    description: 'Multi-channel participant acquisition velocity and referral tracking',
  },
  survey: {
    id: 'survey',
    name: 'Survey Studio & eConsent MFE',
    route: '/surveys',
    exposedModule: 'SurveyModule',
    version: '1.0.0',
    description: 'Validated pre-screening questionnaires and electronic consent forms',
  },
  task: {
    id: 'task',
    name: 'Tasks & Operations MFE',
    route: '/tasks',
    exposedModule: 'TaskModule',
    version: '1.0.0',
    description: 'Operational coordinator action items and milestone follow-ups',
  },
  communication: {
    id: 'communication',
    name: 'Participant Outreach MFE',
    route: '/communications',
    exposedModule: 'CommunicationModule',
    version: '1.0.0',
    description: 'Automated SMS/Email reminders and participant engagement log',
  },
  document: {
    id: 'document',
    name: 'Document Repository MFE',
    route: '/documents',
    exposedModule: 'DocumentModule',
    version: '1.0.0',
    description: 'Versioned clinical trial protocols, IRB approvals, and regulatory packets',
  },
};

export function getRemoteDefinition(remoteId: string): RemoteDefinition | null {
  const base = BASE_REMOTE_DEFINITIONS[remoteId];
  if (!base) return null;

  const runtimeConfig = getCachedRuntimeConfig();
  const remoteConfig = runtimeConfig.remotes[remoteId];

  return {
    ...base,
    remoteUrl:
      remoteConfig?.url ||
      `http://localhost:${3000 + Object.keys(BASE_REMOTE_DEFINITIONS).indexOf(remoteId) + 1}/remoteEntry.js`,
    apiBaseUrl: remoteConfig?.apiBaseUrl || DEFAULT_BACKEND_URLS[remoteId] || 'http://localhost:8081',
    enabled: remoteConfig ? remoteConfig.enabled : true,
    version: remoteConfig?.version || base.version,
  };
}

export function getAllRemoteDefinitions(): RemoteDefinition[] {
  return Object.keys(BASE_REMOTE_DEFINITIONS).map((id) => getRemoteDefinition(id)!);
}
