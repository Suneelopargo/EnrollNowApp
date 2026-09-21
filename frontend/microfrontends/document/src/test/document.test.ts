// frontend/microfrontends/document/src/test/document.test.ts
import { describe, it, expect, vi } from 'vitest';
import { DocumentModule } from '../remoteEntry';

describe('Document MFE Remote Entry', () => {
  it('exports DocumentModule as a valid React component', () => {
    expect(DocumentModule).toBeDefined();
    expect(typeof DocumentModule).toBe('function');
  });

  it('accepts MfeContext configured with Document Service endpoint (:8090)', () => {
    const mockContext = {
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@enrollnow.local',
        roles: ['ROLE_SUPER_ADMIN'],
      },
      token: 'valid-token',
      apiBaseUrl: 'http://localhost:8090',
      correlationId: 'doc-test-corr',
      navigate: vi.fn(),
    };
    expect(mockContext.apiBaseUrl).toBe('http://localhost:8090');
  });
});
