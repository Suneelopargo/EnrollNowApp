// frontend/microfrontends/dashboard/src/test/dashboardDataAdapter.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isDashboardDemoMode,
  loadDashboardData,
  normalizeStudy,
} from '../demo/dashboardDataAdapter';
import { apiClient } from '../../../../shared/api-client';
import demoData from '../demo/dashboard-demo-data.json';

const getGlobalScope = () =>
  typeof window !== 'undefined'
    ? (window as any)
    : typeof globalThis !== 'undefined'
    ? (globalThis as any)
    : ({} as any);

describe('Dashboard Demo Data Provider & Adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete getGlobalScope().__ENROLLNOW_DASHBOARD_DEMO_MODE__;
  });

  afterEach(() => {
    delete getGlobalScope().__ENROLLNOW_DASHBOARD_DEMO_MODE__;
  });

  it('defaults to Demo Mode OFF (disabled in production)', () => {
    expect(isDashboardDemoMode()).toBe(false);
  });

  it('respects window/runtime toggle for demo mode', () => {
    getGlobalScope().__ENROLLNOW_DASHBOARD_DEMO_MODE__ = true;
    expect(isDashboardDemoMode()).toBe(true);

    getGlobalScope().__ENROLLNOW_DASHBOARD_DEMO_MODE__ = false;
    expect(isDashboardDemoMode()).toBe(false);
  });

  it('loads approved JSON file when demo mode is active', async () => {
    getGlobalScope().__ENROLLNOW_DASHBOARD_DEMO_MODE__ = true;

    const result = await loadDashboardData();
    expect(result.mode).toBe('demo');
    expect(result.isDemoMode).toBe(true);
    expect(result.stats).toEqual(demoData.overview);
    expect(result.studies.length).toBe(demoData.studies.length);
    expect(result.participants.length).toBe(demoData.participants.length);
  });

  it('calls real backend API when demo mode is false', async () => {
    getGlobalScope().__ENROLLNOW_DASHBOARD_DEMO_MODE__ = false;

    const mockOverview = {
      totalStudies: 2,
      activeStudies: 1,
      totalParticipants: 50,
      enrolledParticipants: 30,
      recentStudies: [
        { id: 'S-01', studyCode: 'S-01', name: 'Real Study 1', sampleSize: 100, archived: false },
      ],
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/dashboard/overview')) {
        return { data: { data: mockOverview } } as any;
      }
      if (url.includes('/studies')) {
        return { data: [] } as any;
      }
      if (url.includes('/participants')) {
        return { data: { data: [] } } as any;
      }
      return { data: null } as any;
    });

    const result = await loadDashboardData();
    expect(result.mode).toBe('live');
    expect(result.isDemoMode).toBe(false);
    expect(result.stats).toEqual(mockOverview);
    expect(result.studies.length).toBe(1);
    expect(result.studies[0].title).toBe('Real Study 1');
    getSpy.mockRestore();
  });

  it('returns Coming Soon state when backend responds with HTTP 501', async () => {
    getGlobalScope().__ENROLLNOW_DASHBOARD_DEMO_MODE__ = false;

    const getSpy = vi.spyOn(apiClient, 'get').mockRejectedValue({
      status: 501,
      response: { status: 501 },
      message: 'Not Implemented',
    });

    const result = await loadDashboardData();
    expect(result.mode).toBe('coming_soon');
    expect(result.isDemoMode).toBe(false);
    expect(result.stats).toBeNull();
    getSpy.mockRestore();
  });

  it('returns error state without fabricating demo data on API failure', async () => {
    getGlobalScope().__ENROLLNOW_DASHBOARD_DEMO_MODE__ = false;

    const getSpy = vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Connection refused'));

    const result = await loadDashboardData();
    expect(result.mode).toBe('error');
    expect(result.isDemoMode).toBe(false);
    expect(result.errorMessage).toContain('Connection refused');
    expect(result.stats).toBeNull();
    expect(result.studies).toEqual([]);
    expect(result.participants).toEqual([]);
    getSpy.mockRestore();
  });

  it('normalizeStudy safely handles null/missing fields', () => {
    const normalized = normalizeStudy(null);
    expect(normalized.id).toBe('Unknown');
    expect(normalized.title).toBe('Untitled study');
    expect(normalized.enrolled).toBe(0);
    expect(normalized.targetEnrollment).toBe(0);
  });
});
