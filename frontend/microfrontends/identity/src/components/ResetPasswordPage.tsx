import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import zxcvbn from 'zxcvbn';
import { EnrollNowBrand } from './EnrollNowBrand';
import { authApi } from '../../../../shared/api/authApi';
import { toast } from '../../../../shared/toaster';

export interface ResetPasswordPageProps {
  onSuccess?: () => void;
}


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

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onSuccess }) => {
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
    minimumPasswordLength: 8,
    minimumPasswordStrength: 'MODERATE',
    requireDigit: true,
    requireSymbol: true,
    requireMixedCase: true,
  });

  // Load authoritative security settings password rules for tenant
  useEffect(() => {
    let isMounted = true;
    authApi
      .getPasswordPolicy(tenantId)
      .then((res) => {
        if (isMounted && res) {
          setPolicy({
            minimumPasswordLength: res.minimumPasswordLength ?? 8,
            minimumPasswordStrength: (res.minimumPasswordStrength || 'MODERATE').toUpperCase(),
            requireDigit: res.requireDigit ?? true,
            requireSymbol: res.requireSymbol ?? true,
            requireMixedCase: res.requireMixedCase ?? true,
          });
        }
      })
      .catch(() => {
        // Fallback default policy remains active
      });
    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  // Notify if password reset token is missing from URL
  useEffect(() => {
    if (!token) {
      toast.warning('No password reset token found in URL. Please check your reset email.');
    }
  }, [token]);

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
  const minLength = policy.minimumPasswordLength || 8;
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

  const overallPassed = test1Passed && test2Passed;
  const passwordsMatch = Boolean(password && confirmPassword && password === confirmPassword);
  const isFormValid = Boolean(token) && overallPassed && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('No password reset token found in URL. Please check your reset email.');
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

  return (
    <div className="enl-activation-page">
      <div className="enl-activation-card">
        {/* Top White Brand Card */}
        <header className="enl-activation-header">
          <div className="enl-brand-container">
            <EnrollNowBrand />
          </div>
        </header>

        {/* Dark Navy Card Body */}
        <div className="enl-activation-body">
          <h2 className="enl-activation-welcome">RESET YOUR PASSWORD</h2>


          <form onSubmit={handleSubmit}>
            {/* New Password Field */}
            <div className="enl-activation-input-group">
              <input
                id="reset-password-input"
                type="password"
                className={`enl-activation-input ${password ? 'is-filled' : ''}`}
                placeholder="Your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || Boolean(successMessage)}
                autoComplete="new-password"
                autoFocus
              />
            </div>

            {/* Confirm New Password Field */}
            <div className="enl-activation-input-group">
              <input
                id="reset-confirm-password-input"
                type="password"
                className={`enl-activation-input ${confirmPassword ? 'is-filled' : ''}`}
                placeholder="Confirm your Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading || Boolean(successMessage)}
                autoComplete="new-password"
              />
            </div>

            {/* Validation Feedback & Requirements */}
            <div className="enl-activation-meter-group">
              <div className="enl-activation-overall-status">
                {overallPassed
                  ? 'The password meets all requirements from both tests.'
                  : 'The password does not match all requirements.'}
              </div>

              {/* Test #1: Strength */}
              <div className="enl-activation-test-title">Password Validation Test #1: Strength</div>
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
                It would take {password ? strengthResult.crackTime : 'a few seconds'} to crack this password.
              </div>



              {/* Test #2: Password Requirements */}
              <div className="enl-activation-test-title">
                Password Validation Test #2: Password Requirements
              </div>
              <div className="enl-activation-reqs-intro">
                {test2Passed
                  ? 'The password requirements have been met for this test.'
                  : 'Your password must contain the following:'}
              </div>
              <ul className="enl-activation-reqs-list">
                {test2Passed ? (
                  <li className="is-met">The password requirements have been met for this test.</li>
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

            {/* Success Banner */}
            {successMessage && (
              <div className="enl-activation-alert is-success" role="status">
                {successMessage}
              </div>
            )}
          </form>
        </div>

        {/* Set Password Submit Button */}
        <button
          type="button"
          className="enl-activation-submit-btn"
          onClick={handleSubmit}
          disabled={loading || Boolean(successMessage)}
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
