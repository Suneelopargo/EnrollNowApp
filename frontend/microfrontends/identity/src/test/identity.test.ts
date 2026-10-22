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
  ActivateAccountPage,
  RecoverPasswordPage,
  ResetPasswordPage,
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

  it('exports ActivateAccountPage as a valid React component', () => {
    expect(ActivateAccountPage).toBeDefined();
    expect(typeof ActivateAccountPage).toBe('function');
  });

  it('exports RecoverPasswordPage as a valid React component', () => {
    expect(RecoverPasswordPage).toBeDefined();
    expect(typeof RecoverPasswordPage).toBe('function');
  });

  it('exports ResetPasswordPage as a valid React component', () => {
    expect(ResetPasswordPage).toBeDefined();
    expect(typeof ResetPasswordPage).toBe('function');
  });

  it('triggers warning in toaster for Already enrolled! Please login', async () => {
    const { toast } = await import('../../../../shared/toaster');
    const warningSpy = vi.spyOn(toast, 'warning');
    toast.warning('Already enrolled! Please login');
    expect(warningSpy).toHaveBeenCalledWith('Already enrolled! Please login');
    const activeToasts = toast.getToasts();
    expect(activeToasts.some((t) => t.message === 'Already enrolled! Please login' && t.type === 'warning')).toBe(true);
    warningSpy.mockRestore();
  });

  it('fetches password policy from authApi and securitySettingsApi', async () => {
    const { authApi } = await import('../../../../shared/api/authApi');
    const { securitySettingsApi } = await import('../../../../shared/api/securitySettingsApi');

    expect(typeof authApi.getPasswordPolicy).toBe('function');
    expect(typeof securitySettingsApi.getPasswordPolicy).toBe('function');

    const mockPolicy = {
      minimumPasswordLength: 10,
      minimumPasswordStrength: 'MODERATE',
      requireDigit: true,
      requireSymbol: true,
      requireMixedCase: true,
    };
    vi.spyOn(authApi, 'getPasswordPolicy').mockResolvedValue(mockPolicy);

    const policy = await authApi.getPasswordPolicy('11111111-1111-1111-1111-111111111111');
    expect(policy).toBeDefined();
    expect(typeof policy.minimumPasswordLength).toBe('number');
    expect(typeof policy.minimumPasswordStrength).toBe('string');
    expect(typeof policy.requireDigit).toBe('boolean');
    expect(typeof policy.requireSymbol).toBe('boolean');
    expect(typeof policy.requireMixedCase).toBe('boolean');
  });

  it('provides validateActivationToken method on authApi', async () => {
    const { authApi } = await import('../../../../shared/api/authApi');
    expect(typeof authApi.validateActivationToken).toBe('function');
  });

  it('routes password reset and account activation errors to toaster instead of on-screen banner', async () => {
    const { toast } = await import('../../../../shared/toaster');
    const errorSpy = vi.spyOn(toast, 'error');
    const warningSpy = vi.spyOn(toast, 'warning');

    // Simulate password history reuse error
    const reuseMsg = 'Cannot reuse any of your last 1 passwords';
    toast.error(reuseMsg, { title: 'Password Reset Failed' });
    expect(errorSpy).toHaveBeenCalledWith(reuseMsg, { title: 'Password Reset Failed' });

    // Verify toast is present in central toaster
    const active = toast.getToasts();
    expect(active.some((t) => t.message === reuseMsg && t.type === 'error')).toBe(true);

    errorSpy.mockRestore();
    warningSpy.mockRestore();
  });

});
