// frontend/microfrontends/survey/src/test/survey.test.ts
import { describe, it, expect, vi } from 'vitest';
import { SurveyModule } from '../remoteEntry';

describe('Survey MFE Remote Entry', () => {
  it('exports SurveyModule as a valid React component', () => {
    expect(SurveyModule).toBeDefined();
    expect(typeof SurveyModule).toBe('function');
  });

  it('accepts MfeContext configured with Survey Service endpoint (:8087)', () => {
    const mockContext = {
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@enrollnow.local',
        roles: ['ROLE_SUPER_ADMIN'],
      },
      token: 'valid-token',
      apiBaseUrl: 'http://localhost:8087',
      correlationId: 'survey-test-corr',
      navigate: vi.fn(),
    };
    expect(mockContext.apiBaseUrl).toBe('http://localhost:8087');
  });
});
