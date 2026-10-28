// frontend/microfrontends/dashboard/src/demo/dashboardDataAdapter.ts - Centralized Dashboard Data Provider & Demo Adapter
import { apiClient } from '../../../../shared/api-client';
import { studyApi } from '../../../../shared/api/studyApi';
import { participantApi } from '../../../../shared/api/participantApi';
import demoData from './dashboard-demo-data.json';

export type DashboardDataMode = 'demo' | 'live' | 'coming_soon' | 'error';

export interface DashboardDataResult {
  mode: DashboardDataMode;
  stats: any | null;
  studies: any[];
  participants: any[];
  errorMessage?: string;
  isDemoMode: boolean;
}

/**
 * Checks whether Dashboard Demo Mode is explicitly enabled.
 * Disabled by default in all environments including production.
 * Must be explicitly enabled via VITE_DASHBOARD_DEMO_MODE=true.
 */
export function isDashboardDemoMode(): boolean {
  try {
    const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: Record<string, unknown> }).env : undefined;
    if (metaEnv?.VITE_DASHBOARD_DEMO_MODE) {
      const val = String(metaEnv.VITE_DASHBOARD_DEMO_MODE).trim().toLowerCase();
      return val === 'true' || val === '1';
    }
  } catch {
    // import.meta not available
  }

  try {
    if (typeof process !== 'undefined' && process.env?.VITE_DASHBOARD_DEMO_MODE) {
      const val = String(process.env.VITE_DASHBOARD_DEMO_MODE).trim().toLowerCase();
      return val === 'true' || val === '1';
    }
  } catch {
    // process not available
  }

  const globalScope =
    typeof window !== 'undefined'
      ? (window as unknown as { __ENROLLNOW_DASHBOARD_DEMO_MODE__?: boolean })
      : typeof globalThis !== 'undefined'
      ? (globalThis as unknown as { __ENROLLNOW_DASHBOARD_DEMO_MODE__?: boolean })
      : undefined;

  if (globalScope?.__ENROLLNOW_DASHBOARD_DEMO_MODE__ !== undefined) {
    return Boolean(globalScope.__ENROLLNOW_DASHBOARD_DEMO_MODE__);
  }

  return false;
}

/**
 * Normalizes study object attributes across different backend schemas.
 */
export function normalizeStudy(study: any) {
  if (!study) {
    return {
      id: 'Unknown',
      title: 'Untitled study',
      phase: 'Unspecified',
      status: 'OTHER',
      enrolled: 0,
      targetEnrollment: 0,
    };
  }
  return {
    ...study,
    id: study.id ?? study.studyId ?? study.protocolId ?? study.protocolNumber ?? 'Unknown protocol',
    title: study.title ?? study.name ?? study.studyTitle ?? 'Untitled study',
    phase: study.phase ?? study.studyPhase ?? 'Unspecified',
    status: study.status ?? (study.archived ? 'COMPLETED' : 'ACTIVE'),
    enrolled: Number(study.enrolled ?? study.enrolledParticipants ?? study.participantsEnrolled ?? 0),
    targetEnrollment: Number(study.targetEnrollment ?? study.sampleSize ?? study.targetParticipants ?? study.target ?? 0),
  };
}

/**
 * Authoritative loader for Dashboard data.
 * Distinguishes:
 * 1. Demo Mode: Loads approved JSON demo dataset with an explicit demo flag.
 * 2. Real Mode: Fetches from live Spring Boot backend endpoints.
 * 3. Unimplemented / 501: Returns Coming Soon status.
 * 4. Error: Gracefully falls back to demonstration data without displaying error messages.
 */
export async function loadDashboardData(): Promise<DashboardDataResult> {
  // 1. Explicit Demo Mode
  if (isDashboardDemoMode()) {
    const rawStudies = Array.isArray(demoData.studies) ? demoData.studies : [];
    const normalizedStudies = rawStudies.map(normalizeStudy);
    return {
      mode: 'demo',
      isDemoMode: true,
      stats: demoData.overview,
      studies: normalizedStudies,
      participants: Array.isArray(demoData.participants) ? demoData.participants : [],
    };
  }

  // 2. Real Backend Mode
  try {
    const res = await apiClient.get('/api/v1/dashboard/overview', { skipToast: true } as any);

    // Check for explicit not-implemented status in response
    if (res.status === 501 || (res.data as any)?.status === 501) {
      return {
        mode: 'coming_soon',
        isDemoMode: false,
        stats: null,
        studies: [],
        participants: [],
      };
    }

    const overviewData = res.data?.data || res.data;
    if (!overviewData) {
      return {
        mode: 'live',
        isDemoMode: false,
        stats: null,
        studies: [],
        participants: [],
      };
    }

    const overviewStudies = overviewData.recentStudies || [];
    let resolvedStudies: any[] = overviewStudies.map(normalizeStudy);

    // Fetch tenant studies to complement overview if available
    try {
      const allStudies = await studyApi.getStudies({ skipToast: true } as any);

      if (Array.isArray(allStudies) && allStudies.length > 0) {
        const overviewById = new Map<string, any>();
        overviewStudies.map(normalizeStudy).forEach((study: any) => {
          [study.id, study.studyId, study.protocolNumber].forEach((id) => {
            if (id !== undefined && id !== null) overviewById.set(String(id), study);
          });
        });

        resolvedStudies = allStudies.map((rawStudy: any) => {
          const study = normalizeStudy(rawStudy);
          const overviewStudy = [study.id, study.studyId, study.protocolNumber]
            .map((id) => (id === undefined || id === null ? undefined : overviewById.get(String(id))))
            .find(Boolean);

          return normalizeStudy({
            ...overviewStudy,
            ...rawStudy,
            enrolled:
              rawStudy.enrolled ??
              rawStudy.enrolledParticipants ??
              rawStudy.participantsEnrolled ??
              overviewStudy?.enrolled ??
              0,
            targetEnrollment:
              rawStudy.targetEnrollment ??
              rawStudy.sampleSize ??
              rawStudy.targetParticipants ??
              rawStudy.target ??
              overviewStudy?.targetEnrollment ??
              0,
          });
        });
      }
    } catch {
      // Keep overviewStudies if /api/v1/studies request fails
    }

    // Fetch participants for drill-down
    let participants: any[] = [];
    try {
      participants = await participantApi.getParticipants({ skipToast: true } as any);
    } catch {
      participants = [];
    }

    return {
      mode: 'live',
      isDemoMode: false,
      stats: overviewData,
      studies: resolvedStudies,
      participants,
    };
  } catch (err: any) {
    const status = err?.status ?? err?.response?.status;
    if (status === 501) {
      return {
        mode: 'coming_soon',
        isDemoMode: false,
        stats: null,
        studies: [],
        participants: [],
      };
    }

    const errorMessage =
      err?.response?.data?.message ||
      err?.message ||
      'Unable to load dashboard data from the server.';
    return {
      mode: 'error',
      isDemoMode: false,
      stats: null,
      studies: [],
      participants: [],
      errorMessage,
    };
  }
}
