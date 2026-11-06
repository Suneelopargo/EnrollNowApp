// frontend/microfrontends/identity/src/components/ActivateAccountPage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { EnrollNowBrand } from './EnrollNowBrand';
import { Footer } from '../../../../shared/design-system/components/Footer';
import { AuthFooterWave } from './AuthFooterWave';
import { authApi } from '../../../../shared/api/authApi';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { usePasswordValidation } from './usePasswordValidation';
import { PasswordValidationPanel } from './PasswordValidationPanel';

export interface ActivateAccountPageProps {
  onSuccess?: () => void;
}

export const ActivateAccountPage: React.FC<ActivateAccountPageProps> = ({ onSuccess }) => {
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

  // Validate activation token on mount; if already used, redirect to /login with warning
  useEffect(() => {
    if (!token) {
      toast.warning('No activation token found. Please check your invitation email.');
      return;
    }

    let isMounted = true;
    authApi
      .validateActivationToken({ tenantId, token })
      .catch((err: any) => {
        if (!isMounted) return;
        const errData = err.response?.data;
        const errMsg = errData?.message || err.message || '';
        const errCode = errData?.error || '';
        const isAlreadyEnrolled =
          errCode === 'ALREADY_ENROLLED' ||
          err.response?.status === 409 ||
          errMsg.toLowerCase().includes('already enrolled') ||
          errMsg.toLowerCase().includes('already been used');

        const isExpired =
          errCode === 'TOKEN_EXPIRED' ||
          errMsg.toLowerCase().includes('expired') ||
          errMsg.toLowerCase().includes('contact your site admin');

        if (isAlreadyEnrolled) {
          const warning = 'Already enrolled! Please login';
          toast.warning(warning);
          navigate(`/login?warning=${encodeURIComponent(warning)}`, {
            replace: true,
            state: { warning },
          });
          return;
        }

        if (isExpired) {
          toast.warning(errMsg);
          return;
        }
      });

    return () => {
      isMounted = false;
    };
  }, [tenantId, token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('No activation token found. Please check your invitation email.');
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

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (!overallPassed) {
      toast.error('Password does not match all strength and complexity requirements.');
      return;
    }

    if (!isFormValid) {
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.activateAccount({
        tenantId,
        token,
        password,
        confirmPassword,
      });

      const message = response.message || 'Account activated successfully.';
      setSuccessMessage(`${message} Redirecting to sign in...`);
      toast.success(message, { title: 'Activation Successful' });

      authApi.logout();

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err: any) {
      const serverMessage = getApiErrorMessage(
        err,
        'Unable to activate account. The link may have expired or already been used.'
      );
      const errData = err?.response?.data;

      const isAlreadyEnrolled =
        errData?.error === 'ALREADY_ENROLLED' ||
        err.response?.status === 409 ||
        serverMessage.toLowerCase().includes('already enrolled') ||
        serverMessage.toLowerCase().includes('already been used');

      const isExpired =
        errData?.error === 'TOKEN_EXPIRED' ||
        serverMessage.toLowerCase().includes('expired') ||
        serverMessage.toLowerCase().includes('contact your site admin');

      if (isAlreadyEnrolled) {
        const warning = 'Already enrolled! Please login';
        toast.warning(warning);
        navigate(`/login?warning=${encodeURIComponent(warning)}`, {
          replace: true,
          state: { warning },
        });
        return;
      }

      if (isExpired) {
        toast.warning(serverMessage);
        return;
      }

      toast.error(serverMessage, { title: 'Activation Failed' });
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled = loading || Boolean(successMessage) || !isFormValid;

  return (
    <div className="enl-activation-page enl-user-activation-page">
      <div className="enl-activation-card">
        {/* Top Header Card with Brand Logo */}
        <div className="enl-activation-header">
          <EnrollNowBrand size="card" />
        </div>

        {/* Navy Card Body with Inputs and Live Validations */}
        <form className="enl-activation-body" onSubmit={handleSubmit} noValidate>
          <div className="signin-title">
            <h1 className="enl-activation-welcome">WELCOME!</h1>
            <small className="enl-activation-subtitle">SET YOUR PASSWORD BELOW</small>
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
              {/* Password Input */}
              <div className="enl-activation-input-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Your EnrollNow Password"
                  aria-label="Your EnrollNow Password"
                  className={`enl-activation-input ${password ? 'is-filled' : ''}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || Boolean(successMessage)}
                  autoFocus
                  required
                />
              </div>

              {/* Confirm Password Input */}
              <div className="enl-activation-input-group">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your Password"
                  aria-label="Confirm your Password"
                  className={`enl-activation-input ${confirmPassword ? 'is-filled' : ''}`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || Boolean(successMessage)}
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

      <div className="enl-user-activation-wave-container">
        <AuthFooterWave />
      </div>

      {/* Footer Below Card */}
      <Footer variant="auth" />
    </div>
  );
};

export default ActivateAccountPage;
