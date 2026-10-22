import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import zxcvbn from 'zxcvbn';
import { EnrollNowBrand } from './EnrollNowBrand';
import { authApi } from '../../../../shared/api/authApi';
import { toast } from '../../../../shared/toaster';

export interface ActivateAccountPageProps {
  onSuccess?: () => void;
}

const SCORE_DESCRIPTIONS: Record<number, string> = {
  0: 'Very Weak',
  1: 'Very Weak',
  2: 'Weak',
  3: 'Moderate',
  4: 'Strong',
};

function formatCrackDuration(seconds: number): string {
  if (seconds <= 0 || isNaN(seconds) || seconds < 60) return 'a few seconds';
  if (seconds < 120) return 'a minute';
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 7200) return 'an hour';
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 172800) return 'a day';
  if (seconds < 86400 * 30) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 86400 * 60) return 'a month';
  if (seconds < 86400 * 365) return `${Math.round(seconds / (86400 * 30))} months`;
  if (seconds < 86400 * 365 * 2) return 'a year';
  if (seconds < 86400 * 365 * 100) return `${Math.round(seconds / (86400 * 365))} years`;
  return 'centuries';
}

export const ActivateAccountPage: React.FC<ActivateAccountPageProps> = ({ onSuccess }) => {
  const { token: routeToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tenantId = searchParams.get('tenantId') || '';
  const token = searchParams.get('token') || routeToken || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [policy, setPolicy] = useState<{
    minimumPasswordLength: number;
    minimumPasswordStrength: string;
    requireDigit: boolean;
    requireSymbol: boolean;
    requireMixedCase: boolean;
  }>({
    minimumPasswordLength: 10,
    minimumPasswordStrength: 'MODERATE',
    requireDigit: true,
    requireSymbol: true,
    requireMixedCase: true,
  });

  useEffect(() => {
    let isMounted = true;
    authApi
      .getPasswordPolicy(tenantId)
      .then((res) => {
        if (isMounted && res) {
          setPolicy({
            minimumPasswordLength: res.minimumPasswordLength ?? 10,
            minimumPasswordStrength: (res.minimumPasswordStrength || 'MODERATE').toUpperCase(),
            requireDigit: res.requireDigit ?? true,
            requireSymbol: res.requireSymbol ?? true,
            requireMixedCase: res.requireMixedCase ?? true,
          });
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  // Validate activation token on mount; if already used, redirect to /login with warning
  useEffect(() => {
    if (!token) return;

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

  // Test #1: Password Strength via zxcvbn
  const strengthResult = useMemo(() => {
    if (!password) {
      return {
        score: 0,
        crackTime: 'a few seconds',
        suggestions: [] as string[],
      };
    }

    const res = zxcvbn(password, ['EnrollNow', 'Enroll', 'Ripple']);
    const times = res.crack_times_seconds;
    const minTime = times
      ? Math.min(
          Number(times.online_throttling_100_per_hour) || 0,
          Number(times.online_no_throttling_10_per_second) || 0,
          Number(times.offline_slow_hashing_1e4_per_second) || 0,
          Number(times.offline_fast_hashing_1e10_per_second) || 0
        )
      : 0;

    return {
      score: res.score,
      crackTime: formatCrackDuration(minTime),
      suggestions: res.feedback?.suggestions || [],
    };
  }, [password]);

  // Test #2: Password Requirements
  const minLength = policy.minimumPasswordLength || 10;
  const meetsMinChars = password.length >= minLength;
  const meetsRequireNumber = /[0-9]/.test(password);
  const meetsRequireSymbol = /[^0-9A-Za-z]/.test(password);
  const meetsMixCase = /[a-z]/.test(password) && /[A-Z]/.test(password);

  const test2Passed =
    meetsMinChars &&
    (!policy.requireDigit || meetsRequireNumber) &&
    (!policy.requireSymbol || meetsRequireSymbol) &&
    (!policy.requireMixedCase || meetsMixCase);

  const requiredScore =
    policy.minimumPasswordStrength === 'STRONG'
      ? 4
      : policy.minimumPasswordStrength === 'WEAK'
      ? 2
      : 3;
  const test1Passed = strengthResult.score >= requiredScore;
  const requiredStrengthLabel =
    policy.minimumPasswordStrength === 'STRONG'
      ? 'Strong'
      : policy.minimumPasswordStrength === 'WEAK'
      ? 'Weak, Moderate or Strong'
      : 'Moderate or Strong';

  const overallPassed = test1Passed && test2Passed;
  const passwordsMatch = Boolean(password && confirmPassword && password === confirmPassword);
  const isFormValid = Boolean(token) && overallPassed && passwordsMatch;
  const isButtonDisabled = loading || Boolean(successMessage) || !isFormValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('No activation token found. Please check your invitation email.');
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

      // Clear any previous session in this browser tab so the newly activated user starts fresh
      authApi.logout();

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err: any) {
      const errData = err.response?.data;
      const serverMessage =
        errData?.message ||
        errData?.error ||
        err.message ||
        'Unable to activate account. The link may have expired or already been used.';

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

  return (
    <div className="enl-activation-page">
      <div className="enl-activation-card">
        {/* Top Header Card with Brand Logo */}
        <div className="enl-activation-header">
          <EnrollNowBrand size="card" />
        </div>

        {/* Navy Card Body with Inputs and Live Validations */}
        <form className="enl-activation-body" onSubmit={handleSubmit}>
          <h1 className="enl-activation-welcome">WELCOME!</h1>
          <h2 className="enl-activation-subtitle">SET YOUR PASSWORD BELOW</h2>

          {/* Password Input */}
          <div className="enl-activation-input-group">
            <input
              type="password"
              name="password"
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

          {/* Overall Validation Summary */}
          <div className="enl-activation-meter-group">
            <div className="enl-activation-overall-status">
              {overallPassed
                ? 'The password meets all requirements from both tests.'
                : 'The password does not match all requirements.'}
            </div>

            {/* Test #1: Strength */}
            <div>
              <h3 className="enl-activation-test-title">Password Validation Test #1: Strength</h3>

              <div className="enl-activation-meter-container">
                <div className="enl-activation-meter-bg">
                  <div
                    className={`enl-activation-meter-fill score-${strengthResult.score}`}
                    style={{
                      width: password ? `${Math.max((strengthResult.score / 4) * 100, 10)}%` : '0%',
                    }}
                  />
                </div>
              </div>

              <div className="enl-activation-crack-time">
                {password
                  ? `It would take ${strengthResult.crackTime} to crack this password.`
                  : 'Time required to crack: —'}
              </div>

              {password && strengthResult.suggestions.length > 0 && (
                <div className="enl-activation-suggestions">
                  <div className="enl-activation-suggestions-label">Suggestions for a better password:</div>
                  <ul>
                    {strengthResult.suggestions.map((sug, i) => (
                      <li key={i}>{sug}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="enl-activation-strength-status">
                Your password must be {requiredStrengthLabel} or better. Your strength is:{' '}
                <strong>{password ? `${SCORE_DESCRIPTIONS[strengthResult.score]}.` : '—'}</strong>
              </div>
            </div>

            {/* Test #2: Password Requirements */}
            <div>
              <h3 className="enl-activation-test-title">
                Password Validation Test #2: Password Requirements
              </h3>
              <div className="enl-activation-reqs-intro">Your password must contain the following:</div>
              <ul className="enl-activation-reqs-list">
                {test2Passed ? (
                  <li className="is-met">
                    <strong>The password requirements have been met for this test.</strong>
                  </li>
                ) : (
                  <>
                    {!meetsMinChars && <li>A minimum length of {minLength} characters.</li>}
                    {policy.requireDigit && !meetsRequireNumber && <li>At least one digit (number).</li>}
                    {policy.requireSymbol && !meetsRequireSymbol && <li>At least one symbol (special character).</li>}
                    {policy.requireMixedCase && !meetsMixCase && <li>Mixed upper and lower case characters.</li>}
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="enl-activation-alert is-success" role="status">
              {successMessage}
            </div>
          )}
        </form>

        {/* Set Password Submit Button (Disabled until all validations match) */}
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

export default ActivateAccountPage;
