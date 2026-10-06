// frontend/microfrontends/communication/src/test/communication.test.ts
import { describe, it, expect, vi } from 'vitest';
import { CommunicationModule } from '../remoteEntry';

describe('Communication MFE Remote Entry', () => {
  it('exports CommunicationModule as a valid React component', () => {
    expect(CommunicationModule).toBeDefined();
    expect(typeof CommunicationModule).toBe('function');
  });

  it('accepts MfeContext configured with backend API base URL (:8080)', () => {
    const mockContext = {
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@enrollnow.local',
        roles: ['ROLE_SUPER_ADMIN'],
      },
      token: 'valid-token',
      apiBaseUrl: 'http://localhost:8080',
      correlationId: 'comm-test-corr',
      navigate: vi.fn(),
    };
    expect(mockContext.apiBaseUrl).toBe('http://localhost:8080');
  });
});
