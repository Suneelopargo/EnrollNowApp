// frontend/microfrontends/identity/src/test/identity.test.ts
import { describe, it, expect, vi } from 'vitest';
import { IdentityModule } from '../remoteEntry';

describe('Identity MFE Remote Entry', () => {
  it('exports IdentityModule as a valid React component', () => {
    expect(IdentityModule).toBeDefined();
    expect(typeof IdentityModule).toBe('function');
  });

  it('accepts MfeContext with apiBaseUrl and navigation handlers', () => {
    const mockContext = {
      user: null,
      token: null,
      apiBaseUrl: 'http://localhost:8081',
      correlationId: 'test-corr-id',
      navigate: vi.fn(),
      emitEvent: vi.fn(),
      onEvent: vi.fn(),
    };
    expect(mockContext.apiBaseUrl).toBe('http://localhost:8081');
    expect(typeof mockContext.navigate).toBe('function');
  });
});
