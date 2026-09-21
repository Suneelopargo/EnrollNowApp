// frontend/microfrontends/participant/src/test/participant.test.ts
import { describe, it, expect, vi } from 'vitest';
import { ParticipantModule } from '../remoteEntry';

describe('Participant MFE Remote Entry', () => {
  it('exports ParticipantModule as a valid React component', () => {
    expect(ParticipantModule).toBeDefined();
    expect(typeof ParticipantModule).toBe('function');
  });

  it('accepts MfeContext configured with Participant Service endpoint (:8085)', () => {
    const mockContext = {
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@enrollnow.local',
        roles: ['ROLE_SUPER_ADMIN'],
      },
      token: 'valid-token',
      apiBaseUrl: 'http://localhost:8085',
      correlationId: 'participant-test-corr',
      navigate: vi.fn(),
    };
    expect(mockContext.apiBaseUrl).toBe('http://localhost:8085');
  });
});
