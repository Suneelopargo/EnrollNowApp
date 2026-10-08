// frontend/microfrontends/identity/src/test/identity.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  IdentityModule,
  LoginMarketingPanel,
  EnrollNowBrand,
  MarketingHeadline,
  FeatureHighlights,
  FeatureHighlightCard,
  FloatingInfoCard,
  LoginStatistics,
  loginContent,
  defaultStatistics,
} from '../remoteEntry';

describe('Identity MFE Remote Entry & Code-Driven Login Components', () => {
  it('exports IdentityModule as a valid React component', () => {
    expect(IdentityModule).toBeDefined();
    expect(typeof IdentityModule).toBe('function');
  });

  it('accepts MfeContext with apiBaseUrl and navigation handlers', () => {
    const mockContext = {
      user: null,
      token: null,
      apiBaseUrl: 'http://localhost:8080',
      correlationId: 'test-corr-id',
      navigate: vi.fn(),
      emitEvent: vi.fn(),
      onEvent: vi.fn(),
    };
    expect(mockContext.apiBaseUrl).toBe('http://localhost:8080');
    expect(typeof mockContext.navigate).toBe('function');
  });

  it('exports all code-driven marketing components', () => {
    expect(LoginMarketingPanel).toBeDefined();
    expect(typeof LoginMarketingPanel).toBe('function');

    expect(EnrollNowBrand).toBeDefined();
    expect(typeof EnrollNowBrand).toBe('function');

    expect(MarketingHeadline).toBeDefined();
    expect(typeof MarketingHeadline).toBe('function');

    expect(FeatureHighlights).toBeDefined();
    expect(typeof FeatureHighlights).toBe('function');

    expect(FeatureHighlightCard).toBeDefined();
    expect(typeof FeatureHighlightCard).toBe('function');

    expect(FloatingInfoCard).toBeDefined();
    expect(typeof FloatingInfoCard).toBe('function');

    expect(LoginStatistics).toBeDefined();
    expect(typeof LoginStatistics).toBe('function');
  });

  it('contains data-driven loginContent and defaultStatistics', () => {
    expect(loginContent).toBeDefined();
    expect(loginContent.headline.line1).toBe('Advancing');
    expect(loginContent.headline.line2).toBe('Clinical Research');
    expect(loginContent.headline.emphasis).toBe('Together');
    expect(loginContent.features).toHaveLength(4);
    expect(loginContent.features.map((f) => f.title)).toEqual([
      'Recruit & Prescreen',
      'Schedule & Enroll',
      'Manage Studies',
      'Secure & Compliant',
    ]);

    expect(defaultStatistics).toBeDefined();
    expect(Array.isArray(defaultStatistics)).toBe(true);
  });
});
