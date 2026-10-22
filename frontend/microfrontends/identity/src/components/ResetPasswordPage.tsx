// frontend/microfrontends/identity/src/components/ResetPasswordPage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { EnrollNowBrand } from './EnrollNowBrand';
import { authApi } from '../../../../shared/api/authApi';
import { toast } from '../../../../shared/toaster';
import { usePasswordValidation } from './usePasswordValidation';
import { PasswordValidationPanel } from './PasswordValidationPanel';

export interface ResetPasswordPageProps {
  onSuccess?: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onSuccess }) => {
  const { token: routeToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tenantId = searchParams.get('tenantId') || '';
  const token = searchParams.get('token') || routeToken || '';

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    policy,
    policyLoading,
    policyError,
    reloadPolicy,
    strengthResult,
    minLength,
    meetsMinChars,
    meetsRequireDigit,
    meetsRequireSymbol,
    meetsRequireMixedCase,
    test1Passed,
    test2Passed,
    requiredStrengthLabel,
    scoreLabel,
    overallPassed,
    passwordsMatch,
    isFormValid,
  } = usePasswordValidation({ tenantId, token });

  // Notify if password reset token is missing from URL
  useEffect(() => {
    if (!token) {
      toast.warning('No password reset token found in URL. Please check your reset email.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('No password reset token found in URL. Please check your reset email.');
      return;
    }

    if (policyError) {
      toast.error('Cannot set password while policy failed to load. Please retry.');
      return;
    }

    if (!password) {
      toast.error('Please enter a password.');
      return;
    }

    if (!confirmPassword) {
      toast.error('Please confirm your password.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('The entered passwords do not match. Please ensure both fields are identical.');
      return;
    }

    if (!overallPassed) {
      toast.error('The password does not match all requirements.');
      return;
    }

    if (!isFormValid) {
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword({
        tenantId,
        token,
        newPassword: password,
      });

      setSuccessMessage('Password reset successfully! Redirecting you to login...');
      toast.success('Your password has been updated. Please sign in with your new password.');

      onSuccess?.();

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      const errData = err?.response?.data;
      const msg =
        errData?.message ||
        err?.message ||
        'Unable to reset password. The link may have expired or already been used.';

      const isWarning =
        errData?.error === 'TOKEN_EXPIRED' ||
        errData?.error === 'ALREADY_ENROLLED' ||
        errData?.error === 'RESET_TOKEN_USED' ||
        errData?.error === 'ENROLLMENT_REQUIRED' ||
        err?.response?.status === 409 ||
        msg.toLowerCase().includes('expired') ||
        msg.toLowerCase().includes('already enrolled') ||
        msg.toLowerCase().includes('already used') ||
        msg.toLowerCase().includes('contact your site admin');

      if (isWarning) {
        toast.warning(msg);
        return;
      }

      toast.error(msg, { title: 'Password Reset Failed' });
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled = loading || Boolean(successMessage) || !isFormValid;

  return (
    <div className="enl-activation-page">
      <div className="enl-activation-card">
        {/* Top White Brand Card */}
        <div className="enl-activation-header">
          <EnrollNowBrand size="card" />
        </div>

        {/* Dark Navy Card Body */}
        <form className="enl-activation-body" onSubmit={handleSubmit} noValidate>
          <div className="signin-title">
            <h1 className="enl-activation-welcome">RESET YOUR PASSWORD</h1>
          </div>

          {/* Policy Loading / Error State */}
          {policyLoading && (
            <div className="enl-activation-policy-loading" role="status">
              Loading password requirements...
            </div>
          )}

          {policyError && (
            <div className="enl-activation-alert is-error" role="alert">
              <div>{policyError}</div>
              <button
                type="button"
                className="enl-activation-retry-btn"
                onClick={reloadPolicy}
              >
                Retry Loading Requirements
              </button>
            </div>
          )}

          {!policyLoading && !policyError && (
            <>
              {/* New Password Field */}
              <div className="enl-activation-input-group">
                <input
                  id="reset-password-input"
                  type="password"
                  name="password"
                  placeholder="Your EnrollNow Password"
                  aria-label="Your EnrollNow Password"
                  className={`enl-activation-input ${password ? 'is-filled' : ''}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || Boolean(successMessage)}
                  autoComplete="new-password"
                  autoFocus
                  required
                />
              </div>

              {/* Confirm New Password Field */}
              <div className="enl-activation-input-group">
                <input
                  id="reset-confirm-password-input"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your Password"
                  aria-label="Confirm your Password"
                  className={`enl-activation-input ${confirmPassword ? 'is-filled' : ''}`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || Boolean(successMessage)}
                  autoComplete="new-password"
                  required
                />
              </div>

              {/* Validation Summary & Tests */}
              <PasswordValidationPanel
                password={password}
                policy={policy}
                strengthResult={strengthResult}
                minLength={minLength}
                meetsMinChars={meetsMinChars}
                meetsRequireDigit={meetsRequireDigit}
                meetsRequireSymbol={meetsRequireSymbol}
                meetsRequireMixedCase={meetsRequireMixedCase}
                test1Passed={test1Passed}
                test2Passed={test2Passed}
                overallPassed={overallPassed}
                requiredStrengthLabel={requiredStrengthLabel}
                scoreLabel={scoreLabel}
              />
            </>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="enl-activation-alert is-success" role="status">
              {successMessage}
            </div>
          )}
        </form>

        {/* Set Password Submit Button */}
        <button
          type="button"
          className="enl-activation-submit-btn"
          onClick={handleSubmit}
          disabled={isButtonDisabled}
        >
          {loading ? 'Setting Password...' : 'Set Password'}
        </button>
      </div>

      {/* Footer Below Card */}
      <footer className="enl-activation-footer">
        <span className="enl-activation-copyright">© 2016 - 2026</span>
        <a href="#enrollnow" className="enl-activation-footer-link" onClick={(e) => e.preventDefault()}>
          EnrollNow
        </a>
        <span className="enl-activation-footer-divider">|</span>
        <a href="#terms" className="enl-activation-footer-link" onClick={(e) => e.preventDefault()}>
          Terms of Service
        </a>
        <span className="enl-activation-footer-divider">|</span>
        <a href="#support" className="enl-activation-footer-link" onClick={(e) => e.preventDefault()}>
          Support Center
        </a>
      </footer>
    </div>
  );
};

export default ResetPasswordPage;
