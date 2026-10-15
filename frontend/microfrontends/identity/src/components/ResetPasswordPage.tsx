// frontend/microfrontends/identity/src/components/ResetPasswordPage.tsx
// Central Code-Driven Password Reset Component
import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import zxcvbn from 'zxcvbn';
import { EnrollNowBrand } from './EnrollNowBrand';
import { authApi } from '../../../../shared/api/authApi';
import { toast } from '../../../../shared/toaster';

export interface ResetPasswordPageProps {
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

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onSuccess }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tenantId = searchParams.get('tenantId') || '';
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
  const meetsMinChars = password.length >= 10;
  const meetsRequireNumber = /[0-9]/.test(password);
  const meetsRequireSymbol = /[^0-9A-Za-z]/.test(password);
  const meetsMixCase = /[a-z]/.test(password) && /[A-Z]/.test(password);

  const test2Passed = meetsMinChars && meetsRequireNumber && meetsRequireSymbol && meetsMixCase;
  const test1Passed = strengthResult.score >= 3; // Moderate or better
  const overallPassed = test1Passed && test2Passed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage('No password reset token found in URL. Please check your reset email.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    if (!confirmPassword) {
      setErrorMessage('Please confirm your new password.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('The entered passwords do not match. Please ensure both fields are identical.');
      return;
    }

    if (!overallPassed) {
      setErrorMessage('Please ensure your password meets all requirements and achieves Moderate or Strong rating.');
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
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to reset password. The link may have expired or already been used.';
      setErrorMessage(msg);
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
          <h2 className="enl-activation-welcome">RESET PASSWORD</h2>
          <div className="enl-activation-subtitle">ENTER YOUR NEW PASSWORD</div>

          <form onSubmit={handleSubmit}>
            {/* New Password Field */}
            <div className="enl-activation-input-group">
              <input
                id="reset-password-input"
                type="password"
                className={`enl-activation-input ${password ? 'is-filled' : ''}`}
                placeholder="New Password"
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
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading || Boolean(successMessage)}
                autoComplete="new-password"
              />
            </div>

            {/* Validation Feedback & Requirements */}
            <div className="enl-activation-meter-group">
              <div className="enl-activation-overall-status">
                Overall: {overallPassed ? 'Password passed all tests' : 'Password requires attention'}
              </div>

              {/* Test #1: Progress Meter Bar */}
              <div className="enl-activation-test-title">Test #1: Progress Meter Bar</div>
              <div className="enl-activation-meter-container">
                <div className="enl-activation-meter-bg">
                  <div
                    className={`enl-activation-meter-fill score-${strengthResult.score}`}
                    style={{ width: `${((strengthResult.score + 1) / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div className="enl-activation-crack-time">
                Time required to crack: <strong>{strengthResult.crackTime}</strong>
              </div>

              {strengthResult.suggestions.length > 0 && (
                <div className="enl-activation-suggestions">
                  <div className="enl-activation-suggestions-label">Suggestions:</div>
                  <ul>
                    {strengthResult.suggestions.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="enl-activation-strength-status">
                Current: <strong>{SCORE_DESCRIPTIONS[strengthResult.score]}</strong> (requires Moderate or Strong)
              </div>

              {/* Test #2: Password Requirements */}
              <div className="enl-activation-test-title">Test #2: Password Requirements</div>
              <div className="enl-activation-reqs-intro">
                {test2Passed ? 'Password passed requirements test' : 'Password must have:'}
              </div>
              <ul className="enl-activation-reqs-list">
                {test2Passed ? (
                  <li className="is-met">Password met all requirements</li>
                ) : (
                  <>
                    {!meetsMinChars && <li>10 or more characters.</li>}
                    {!meetsRequireNumber && <li>At least one digit (number).</li>}
                    {!meetsRequireSymbol && <li>At least one symbol (special character).</li>}
                    {!meetsMixCase && <li>Mixed upper and lower case characters.</li>}
                  </>
                )}
              </ul>
            </div>

            {/* Missing Token Alert */}
            {!token && !errorMessage && !successMessage && (
              <div className="enl-activation-alert is-error" role="alert">
                No password reset token found in URL. Please click the complete link received in your reset email.
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="enl-activation-alert is-error" role="alert">
                {errorMessage}
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div className="enl-activation-alert is-success" role="status">
                {successMessage}
              </div>
            )}
          </form>
        </div>

        {/* Reset Password Submit Button */}
        <button
          type="button"
          className="enl-activation-submit-btn"
          onClick={handleSubmit}
          disabled={loading || !token || Boolean(successMessage)}
        >
          {loading ? 'Resetting Password...' : 'Reset Password'}
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
