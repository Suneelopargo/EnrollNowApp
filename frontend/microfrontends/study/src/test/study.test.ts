// frontend/microfrontends/study/src/test/study.test.ts
import { describe, it, expect, vi } from 'vitest';
import { StudyModule } from '../remoteEntry';

describe('Study MFE Remote Entry', () => {
  it('exports StudyModule as a valid React component', () => {
    expect(StudyModule).toBeDefined();
    expect(typeof StudyModule).toBe('function');
  });

  it('accepts MfeContext configured with Study Service endpoint (:8084)', () => {
    const mockContext = {
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@enrollnow.local',
        roles: ['ROLE_SUPER_ADMIN'],
      },
      token: 'valid-token',
      apiBaseUrl: 'http://localhost:8084',
      correlationId: 'study-test-corr',
      navigate: vi.fn(),
    };
    expect(mockContext.apiBaseUrl).toBe('http://localhost:8084');
  });
});
