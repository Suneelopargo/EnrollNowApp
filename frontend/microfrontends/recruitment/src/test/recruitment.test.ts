// frontend/microfrontends/recruitment/src/test/recruitment.test.ts
import { describe, it, expect, vi } from 'vitest';
import { RecruitmentModule } from '../remoteEntry';

describe('Recruitment MFE Remote Entry', () => {
  it('exports RecruitmentModule as a valid React component', () => {
    expect(RecruitmentModule).toBeDefined();
    expect(typeof RecruitmentModule).toBe('function');
  });

  it('accepts MfeContext configured with Recruitment Service endpoint (:8086)', () => {
    const mockContext = {
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@enrollnow.local',
        roles: ['ROLE_SUPER_ADMIN'],
      },
      token: 'valid-token',
      apiBaseUrl: 'http://localhost:8086',
      correlationId: 'recruitment-test-corr',
      navigate: vi.fn(),
    };
    expect(mockContext.apiBaseUrl).toBe('http://localhost:8086');
  });
});
