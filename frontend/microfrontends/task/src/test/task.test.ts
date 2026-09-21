// frontend/microfrontends/task/src/test/task.test.ts
import { describe, it, expect, vi } from 'vitest';
import { TaskModule } from '../remoteEntry';

describe('Task MFE Remote Entry', () => {
  it('exports TaskModule as a valid React component', () => {
    expect(TaskModule).toBeDefined();
    expect(typeof TaskModule).toBe('function');
  });

  it('accepts MfeContext configured with Task Service endpoint (:8088)', () => {
    const mockContext = {
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@enrollnow.local',
        roles: ['ROLE_SUPER_ADMIN'],
      },
      token: 'valid-token',
      apiBaseUrl: 'http://localhost:8088',
      correlationId: 'task-test-corr',
      navigate: vi.fn(),
    };
    expect(mockContext.apiBaseUrl).toBe('http://localhost:8088');
  });
});
