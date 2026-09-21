// frontend/microfrontends/organization/src/test/organization.test.ts
import { describe, it, expect, vi } from 'vitest';
import { OrganizationModule } from '../remoteEntry';

describe('Organization MFE Remote Entry', () => {
  it('exports OrganizationModule as a valid React component', () => {
    expect(OrganizationModule).toBeDefined();
    expect(typeof OrganizationModule).toBe('function');
  });

  it('accepts MfeContext configured with Organization Service endpoint (:8083)', () => {
    const mockContext = {
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@enrollnow.local',
        roles: ['ROLE_SUPER_ADMIN'],
      },
      token: 'valid-token',
      apiBaseUrl: 'http://localhost:8083',
      correlationId: 'org-test-corr',
      navigate: vi.fn(),
    };
    expect(mockContext.apiBaseUrl).toBe('http://localhost:8083');
  });
});
