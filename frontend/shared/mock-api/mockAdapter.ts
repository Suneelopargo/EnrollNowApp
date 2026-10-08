// frontend/shared/mock-api/mockAdapter.ts - Centralized Axios Adapter for Mock API
import { AxiosAdapter, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getMockErrorSimulation } from '../api-config';
import { mockAuthApi, extractBearerToken } from './mockAuthApi';
import { mockStore } from './mockStore';
import { EXPIRED_TOKEN } from './mockData';
import {
  createMockSuccessResponse,
  createMockErrorResponse,
  createMockNetworkError,
} from './mockResponse';

/**
 * Extracts normalized pathname from request URL.
 */
function normalizePath(url: string = ''): string {
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const parsed = new URL(url);
      return parsed.pathname;
    }
  } catch {
    // fallback to regex or string split
  }
  return url.split('?')[0];
}

/**
 * Parses request payload safely.
 */
function parsePayload(data: unknown): any {
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data;
}

export const mockAdapter: AxiosAdapter = async (
  config: InternalAxiosRequestConfig
): Promise<AxiosResponse> => {
  // 1. Check for simulated errors (e.g. VITE_API_MOCK_ERROR=500, 401, network)
  const simulatedError = getMockErrorSimulation();
  if (simulatedError) {
    if (simulatedError.toLowerCase() === 'network') {
      throw createMockNetworkError(config);
    }
    const statusCode = parseInt(simulatedError, 10);
    if (!isNaN(statusCode) && statusCode >= 400) {
      throw createMockErrorResponse(
        config,
        statusCode,
        `Simulated HTTP ${statusCode} Error from Mock Backend`,
        `SIMULATED_${statusCode}`
      );
    }
  }

  const method = (config.method || 'GET').toUpperCase();
  const path = normalizePath(config.url);

  // 2. Authentication Endpoints (Login is unauthenticated)
  if (path === '/api/v1/auth/login' && method === 'POST') {
    const res = mockAuthApi.handleLogin(config);
    if (res instanceof Error || 'isAxiosError' in res) {
      throw res;
    }
    return res;
  }

  if (path === '/api/v1/auth/me' && method === 'GET') {
    const res = mockAuthApi.handleGetCurrentUser(config);
    if (res instanceof Error || 'isAxiosError' in res) {
      throw res;
    }
    return res;
  }

  if (path === '/api/v1/auth/logout' && method === 'POST') {
    const res = mockAuthApi.handleLogout(config);
    if (res instanceof Error || 'isAxiosError' in res) {
      throw res;
    }
    return res;
  }

  // 3. For ALL other endpoints, enforce token authentication check
  const token = extractBearerToken(config);
  if (!token) {
    throw createMockErrorResponse(
      config,
      401,
      'Authentication required: Missing Authorization token.',
      'UNAUTHORIZED'
    );
  }

  if (token === EXPIRED_TOKEN) {
    throw createMockErrorResponse(
      config,
      401,
      'Session expired: The supplied token has expired.',
      'TOKEN_EXPIRED'
    );
  }

  const authenticatedUser = mockStore.findUserByToken(token);
  if (!authenticatedUser) {
    throw createMockErrorResponse(
      config,
      401,
      'Invalid session: Unrecognized or invalid authentication token.',
      'INVALID_TOKEN'
    );
  }

  // 4. Protected Domain Endpoints Routing
  const payload = parsePayload(config.data);

  // --- Dashboard ---
  if (path === '/api/v1/dashboard/overview' && method === 'GET') {
    return createMockSuccessResponse(config, mockStore.getDashboardOverview());
  }

  // --- Studies ---
  if (path === '/api/v1/studies') {
    if (method === 'GET') {
      return createMockSuccessResponse(config, mockStore.getStudies());
    }
    if (method === 'POST') {
      const created = mockStore.createStudy(payload);
      return createMockSuccessResponse(config, created, 201, 'Study created');
    }
  }

  const studyMatch = path.match(/^\/api\/v1\/studies\/([^/]+)$/);
  if (studyMatch) {
    const studyId = studyMatch[1];
    if (method === 'GET') {
      const study = mockStore.findStudy(studyId);
      if (!study) {
        throw createMockErrorResponse(config, 404, `Study ${studyId} not found`, 'NOT_FOUND');
      }
      return createMockSuccessResponse(config, study);
    }
    if (method === 'PUT') {
      const updated = mockStore.updateStudy(studyId, payload);
      if (!updated) {
        throw createMockErrorResponse(config, 404, `Study ${studyId} not found`, 'NOT_FOUND');
      }
      return createMockSuccessResponse(config, updated, 200, 'Study updated');
    }
  }

  // --- Participants ---
  if (path === '/api/v1/participants' && method === 'GET') {
    return createMockSuccessResponse(config, mockStore.getParticipants());
  }

  const participantMatch = path.match(/^\/api\/v1\/participants\/([^/]+)$/);
  if (participantMatch && method === 'GET') {
    const p = mockStore.findParticipant(participantMatch[1]);
    if (!p) {
      throw createMockErrorResponse(config, 404, 'Participant not found', 'NOT_FOUND');
    }
    return createMockSuccessResponse(config, p);
  }

  const participantStatusMatch = path.match(/^\/api\/v1\/participants\/([^/]+)\/status$/);
  if (participantStatusMatch && method === 'PATCH') {
    const updated = mockStore.updateParticipantStatus(participantStatusMatch[1], payload.status);
    if (!updated) {
      throw createMockErrorResponse(config, 404, 'Participant not found', 'NOT_FOUND');
    }
    return createMockSuccessResponse(config, updated, 200, 'Participant status updated');
  }

  // --- Sites & Organization ---
  if (path === '/api/v1/sites' && method === 'GET') {
    return createMockSuccessResponse(config, mockStore.getSites());
  }

  const siteMatch = path.match(/^\/api\/v1\/sites\/([^/]+)$/);
  if (siteMatch && method === 'GET') {
    const site = mockStore.findSite(siteMatch[1]);
    if (!site) {
      throw createMockErrorResponse(config, 404, 'Site not found', 'NOT_FOUND');
    }
    return createMockSuccessResponse(config, site);
  }

  // --- Administration ---
  if (path === '/api/v1/administrator/dashboard' && method === 'GET') {
    return createMockSuccessResponse(config, mockStore.getAdminDashboard());
  }

  if (path === '/api/v1/administrator/users') {
    if (method === 'GET') {
      return createMockSuccessResponse(config, mockStore.getAdminUsers());
    }
    if (method === 'POST') {
      const created = mockStore.createAdminUser(payload);
      return createMockSuccessResponse(config, created, 201, 'User created');
    }
  }

  const adminUserMatch = path.match(/^\/api\/v1\/administrator\/users\/([^/]+)$/);
  if (adminUserMatch) {
    const uid = adminUserMatch[1];
    if (method === 'GET') {
      const user = mockStore.findAdminUser(uid);
      if (!user) {
        throw createMockErrorResponse(config, 404, 'User not found', 'NOT_FOUND');
      }
      return createMockSuccessResponse(config, user);
    }
    if (method === 'PUT') {
      const updated = mockStore.updateAdminUser(uid, payload);
      if (!updated) {
        throw createMockErrorResponse(config, 404, 'User not found', 'NOT_FOUND');
      }
      return createMockSuccessResponse(config, updated, 200, 'User updated');
    }
  }

  if (path.match(/^\/api\/v1\/administrator\/users\/[^/]+\/activate$/) && method === 'POST') {
    return createMockSuccessResponse(config, { activated: true });
  }

  if (path.match(/^\/api\/v1\/administrator\/users\/[^/]+\/deactivate$/) && method === 'POST') {
    return createMockSuccessResponse(config, { deactivated: true });
  }

  if (path.match(/^\/api\/v1\/administrator\/users\/[^/]+\/reset-password$/) && method === 'POST') {
    return createMockSuccessResponse(config, { reset: true });
  }

  if (path.match(/^\/api\/v1\/administrator\/users\/[^/]+\/locations$/)) {
    if (method === 'GET') return createMockSuccessResponse(config, [1]);
    if (method === 'PUT') return createMockSuccessResponse(config, { saved: true });
  }

  if (path === '/api/v1/administrator/roles' && method === 'GET') {
    return createMockSuccessResponse(config, mockStore.getAdminRoles());
  }

  if (path === '/api/v1/administrator/locations' && method === 'GET') {
    return createMockSuccessResponse(config, mockStore.getAdminLocations());
  }

  if (path === '/api/v1/administrator/audit-logs' && method === 'GET') {
    return createMockSuccessResponse(config, mockStore.getAdminAuditLogs());
  }

  // --- Recruitment Campaigns ---
  if (path === '/api/v1/recruitment/campaigns' && method === 'GET') {
    return createMockSuccessResponse(config, mockStore.getCampaigns());
  }

  const campaignMatch = path.match(/^\/api\/v1\/recruitment\/campaigns\/([^/]+)$/);
  if (campaignMatch && method === 'GET') {
    const c = mockStore.findCampaign(campaignMatch[1]);
    if (!c) throw createMockErrorResponse(config, 404, 'Campaign not found', 'NOT_FOUND');
    return createMockSuccessResponse(config, c);
  }

  // --- Surveys ---
  if (path === '/api/v1/surveys/analytics/dashboard' && method === 'GET') {
    return createMockSuccessResponse(config, mockStore.getSurveyDashboard());
  }

  if (path === '/api/v1/surveys') {
    if (method === 'GET') return createMockSuccessResponse(config, mockStore.getSurveys());
    if (method === 'POST') return createMockSuccessResponse(config, { id: 99, ...payload }, 201);
  }

  const surveyMatch = path.match(/^\/api\/v1\/surveys\/([^/]+)$/);
  if (surveyMatch) {
    const sid = surveyMatch[1];
    if (method === 'GET') {
      const s = mockStore.findSurvey(sid);
      if (!s) throw createMockErrorResponse(config, 404, 'Survey not found', 'NOT_FOUND');
      return createMockSuccessResponse(config, s);
    }
    if (method === 'PUT') return createMockSuccessResponse(config, { id: sid, ...payload });
    if (method === 'DELETE') return createMockSuccessResponse(config, { deleted: true });
  }

  // --- Tasks ---
  if (path === '/api/v1/tasks') {
    if (method === 'GET') return createMockSuccessResponse(config, mockStore.getTasks());
    if (method === 'POST') {
      const task = mockStore.createTask(payload);
      return createMockSuccessResponse(config, task, 201);
    }
  }

  const taskMatch = path.match(/^\/api\/v1\/tasks\/([^/]+)$/);
  if (taskMatch && method === 'GET') {
    const t = mockStore.findTask(taskMatch[1]);
    if (!t) throw createMockErrorResponse(config, 404, 'Task not found', 'NOT_FOUND');
    return createMockSuccessResponse(config, t);
  }

  const taskStatusMatch = path.match(/^\/api\/v1\/tasks\/([^/]+)\/status$/);
  if (taskStatusMatch && method === 'PATCH') {
    const updated = mockStore.updateTaskStatus(taskStatusMatch[1], payload.status);
    if (!updated) throw createMockErrorResponse(config, 404, 'Task not found', 'NOT_FOUND');
    return createMockSuccessResponse(config, updated);
  }

  // --- Communications ---
  if (path === '/api/v1/communications') {
    if (method === 'GET') return createMockSuccessResponse(config, mockStore.getCommunications());
    if (method === 'POST') {
      const newMsg = { messageId: `MSG-${Date.now()}`, status: 'SENT', ...payload };
      return createMockSuccessResponse(config, newMsg, 201);
    }
  }

  // --- Documents ---
  if (path === '/api/v1/documents' && method === 'GET') {
    return createMockSuccessResponse(config, mockStore.getDocuments());
  }

  const docMatch = path.match(/^\/api\/v1\/documents\/([^/]+)$/);
  if (docMatch && method === 'GET') {
    const d = mockStore.findDocument(docMatch[1]);
    if (!d) throw createMockErrorResponse(config, 404, 'Document not found', 'NOT_FOUND');
    return createMockSuccessResponse(config, d);
  }

  if (path === '/api/v1/documents/upload' && method === 'POST') {
    const newDoc = {
      documentId: `DOC-${Date.now()}`,
      title: 'Uploaded-Document.pdf',
      type: 'PROTOCOL',
      format: 'PDF',
      size: '1.2 MB',
      uploadedAt: new Date().toISOString(),
      status: 'APPROVED',
    };
    return createMockSuccessResponse(config, newDoc, 201, 'Document uploaded');
  }

  if (path.match(/^\/api\/v1\/documents\/[^/]+\/download$/) && method === 'GET') {
    // Return empty mock Blob / ArrayBuffer
    const mockBlob = typeof Blob !== 'undefined' ? new Blob(['mock content'], { type: 'application/pdf' }) : {};
    return {
      data: mockBlob,
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/pdf',
        'x-correlation-id': (config.headers?.['X-Correlation-Id'] as string) || 'mock-cid',
      },
      config,
      request: {},
    };
  }

  // 5. Fallback for unmapped /api/v1 routes: return 200 with generic success or 404
  return createMockSuccessResponse(config, { path, method, mocked: true });
};
