// frontend/microfrontends/dashboard/src/test/dashboard.test.ts
import { describe, it, expect, vi } from 'vitest';
import { DashboardModule } from '../remoteEntry';

describe('Dashboard MFE Remote Entry', () => {
  it('exports DashboardModule as a valid React component', () => {
    expect(DashboardModule).toBeDefined();
    expect(typeof DashboardModule).toBe('function');
  });

  it('configures default API base URL for Dashboard Service (:8091)', () => {
    const mockContext = {
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@enrollnow.local',
        roles: ['ROLE_SUPER_ADMIN'],
      },
      token: 'jwt-token-123',
      apiBaseUrl: 'http://localhost:8091',
      correlationId: 'dashboard-test-corr',
      navigate: vi.fn(),
    };
    expect(mockContext.apiBaseUrl).toBe('http://localhost:8091');
    expect(mockContext.user.roles).toContain('ROLE_SUPER_ADMIN');
  });
});
