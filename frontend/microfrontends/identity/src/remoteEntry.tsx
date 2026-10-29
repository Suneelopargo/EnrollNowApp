// frontend/microfrontends/identity/src/remoteEntry.tsx
// Code-Driven EnrollNow Identity & Login Module

import React, { useState, useEffect } from 'react';
import { MfeContext } from '../../../shared/contracts';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { authApi } from '../../../shared/api/authApi';
import { toast } from '../../../shared/toaster';
import { Footer } from '../../../shared/design-system/components/Footer';
import { AuthErrorNotification, mapAuthError } from '../../../shared/auth/authErrorMapper';
import { validators, validateField } from '../../../shared/design-system/validation';
import '../../../shared/design-system/styles/index.scss';

// Reusable Code-Driven Marketing & Brand Components
import { LoginMarketingPanel } from './components/LoginMarketingPanel';
import { EnrollNowBrand } from './components/EnrollNowBrand';
import { MarketingHeadline } from './components/MarketingHeadline';
import { FeatureHighlights } from './components/FeatureHighlights';
import { FeatureHighlightCard } from './components/FeatureHighlightCard';
import { FloatingInfoCard } from './components/FloatingInfoCard';
import { LoginStatistics } from './components/LoginStatistics';
import { loginContent, defaultStatistics } from './data/loginContent';

import { ActivateAccountPage } from './components/ActivateAccountPage';
import { RecoverPasswordPage } from './components/RecoverPasswordPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';

// Export components for consumers and unit testing
export {
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
};

export interface IdentityModuleProps {
  context: MfeContext;
}

// ============================================================================
// IDENTITY MODULE COMPONENT (Styles loaded from global _auth.scss)
// ============================================================================

export const IdentityModule: React.FC<IdentityModuleProps> = ({ context }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recoveryAlert, setRecoveryAlert] = useState<AuthErrorNotification | null>(null);

  const emailValidationError = validateField(username.trim(), [
    validators.required('Email Address'),
    validators.email('Email Address'),
  ]);
  const isFormValid = !emailValidationError && password.length > 0;

  useEffect(() => {
    let warningMsg: string | null = null;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      warningMsg = urlParams.get('warning');
    }
    if (!warningMsg && typeof history !== 'undefined' && (history.state as any)?.usr?.warning) {
      warningMsg = (history.state as any).usr.warning;
    }

    if (warningMsg) {
      toast.warning(warningMsg);
    }
  }, []);

  useEffect(() => {
    if (context.user && context.token) {
      if (context.navigate) {
        context.navigate('/dashboard');
      } else {
        window.location.href = '/dashboard';
      }
    }
  }, [context.user, context.token, context.navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    if (emailValidationError) {
      setUsernameError(emailValidationError);
      setUsernameTouched(true);
      hasError = true;
    }
    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    }

    if (hasError || !isFormValid) {
      toast.warning('Please enter your email and password.');
      return;
    }

    // Exact entered credentials — NO hardcoded test fallback
    const loginUser = username.trim();
    const loginPass = password;

    setLoading(true);
    setRecoveryAlert(null);

    try {
      const { user, token } = await authApi.login({
        username: loginUser,
        password: loginPass,
      });

      localStorage.setItem('enrollnow_token', token);
      localStorage.setItem('enrollnow_user', JSON.stringify(user));

      window.dispatchEvent(
        new CustomEvent('enrollnow_auth_change', {
          detail: { token, user },
        })
      );

      if (context.onEvent) {
        context.onEvent('LOGIN_SUCCESS', { user, token, username: loginUser });
      }

      if (context.navigate) {
        context.navigate('/dashboard');
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      const mapped: AuthErrorNotification | null =
        err?.mappedAuthError ||
        err?.apiError?.mappedAuthError ||
        (err ? mapAuthError(err) : null);

      if (mapped?.requiresInlineAlert) {
        setRecoveryAlert(mapped);
      } else {
        setRecoveryAlert(null);
      }

      if (!err?.normalized && !err?.response && !err?.mappedAuthError) {
        const fallbackMsg =
          err?.message ||
          'Invalid username or password. Please verify your credentials.';
        toast.error(fallbackMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="enl-auth-page">
      <div className="enl-canvas-wrapper">
        <div className="enl-canvas">
          {/* Ambient Glowing Background Elements */}
          <div className="enl-ambient-glow-yellow" />
          <div className="enl-ambient-glow-blue" />

          {/* Top Dot Grid Pattern Accent */}
          <svg
            className="enl-dot-grid-top"
            width="120"
            height="70"
            viewBox="0 0 120 70"
            fill="none"
            aria-hidden="true"
          >
            <pattern
              id="enl-dots-top"
              x="0"
              y="0"
              width="16"
              height="16"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="3" cy="3" r="1.5" fill="#93c5fd" opacity="0.75" />
            </pattern>
            <rect width="120" height="70" fill="url(#enl-dots-top)" />
          </svg>

          {/* Bottom-Right Dot Grid Pattern Accent */}
          <svg
            className="enl-dot-grid-bottom"
            width="100"
            height="70"
            viewBox="0 0 100 70"
            fill="none"
            aria-hidden="true"
          >
            <pattern
              id="enl-dots-bottom"
              x="0"
              y="0"
              width="16"
              height="16"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="3" cy="3" r="1.5" fill="#93c5fd" opacity="0.75" />
            </pattern>
            <rect width="100" height="70" fill="url(#enl-dots-bottom)" />
          </svg>

          {/* Three-Region Grid Layout (Column 1: Marketing, Column 2: Showcase, Column 3: Login) */}
          <div className="enl-three-region-layout">
            <LoginMarketingPanel />

            {/* Region 3: Login Card */}
            <section className="enl-login-region">
              <div className="enl-login-card">
                {/* Header Group: Welcome Back */}
                <div className="enl-card-header">
                  <h2 className="enl-card-title">Welcome Back</h2>
                  <p className="enl-card-subtitle">
                    Sign in to your workspace
                  </p>
                </div>

                {/* Persistent Accessible Inline Recovery Alert (e.g. Mandatory Password Reset) */}
                {recoveryAlert && (
                  <div className="enl-login-recovery-alert" role="alert" aria-live="polite">
                    <div className="enl-recovery-alert-icon">
                      <AlertCircle size={18} aria-hidden="true" />
                    </div>
                    <div className="enl-recovery-alert-content">
                      <strong className="enl-recovery-alert-title">{recoveryAlert.title}</strong>
                      <p className="enl-recovery-alert-desc">{recoveryAlert.description}</p>
                      {recoveryAlert.secondaryHelp && (
                        <p className="enl-recovery-alert-help">{recoveryAlert.secondaryHelp}</p>
                      )}
                      {recoveryAlert.action && (
                        <button
                          type="button"
                          className="enl-recovery-alert-action"
                          onClick={() => {
                            const targetRoute = recoveryAlert.action?.route || '/forgot-password';
                            if (context.navigate) {
                              context.navigate(targetRoute);
                            } else {
                              window.location.href = targetRoute;
                            }
                          }}
                        >
                          {recoveryAlert.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                )}

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="enl-card-form">
                {/* Email Address */}
                <div className="enl-field-group">
                  <label className="enl-field-label" htmlFor="email-input">
                    Email Address
                  </label>
                  <div className="enl-field-box">
                    <Mail size={16} className="enl-field-icon" />
                    <input
                      id="email-input"
                      type="email"
                      className={`enl-field-input${usernameTouched && emailValidationError ? ' is-invalid' : ''}`}
                      placeholder={usernameError && !username ? usernameError : 'Enter your email address'}
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setUsernameTouched(true);
                        setUsernameError('');
                      }}
                      onBlur={() => {
                        setUsernameTouched(true);
                        setUsernameError(emailValidationError);
                      }}
                      autoComplete="username"
                      required
                      aria-required="true"
                      aria-invalid={usernameTouched && Boolean(emailValidationError)}
                      aria-describedby={usernameTouched && emailValidationError ? 'email-input-error' : undefined}
                    />
                  </div>
                  {usernameTouched && emailValidationError && (
                    <div id="email-input-error" className="mt-1 text-xs text-red-600" role="alert">
                      {emailValidationError}
                    </div>
                  )}
                </div>

                {/* Password */}
                <div className="enl-field-group">
                  <label className="enl-field-label" htmlFor="password-input">
                    Password
                  </label>
                  <div className="enl-field-box">
                    <Lock size={16} className="enl-field-icon" />
                    <input
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      className="enl-field-input"
                      placeholder={passwordError && !password ? passwordError : 'Enter your password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                      onBlur={() => {
                        if (!password) {
                          setPasswordError('Password is required');
                        }
                      }}
                      autoComplete="current-password"
                      required
                      aria-required="true"
                      aria-invalid={!!passwordError}
                      aria-describedby={passwordError ? 'password-input-error' : undefined}
                    />
                    <button
                      type="button"
                      className="enl-toggle-eye"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                    </button>
                  </div>
                  {passwordError && (
                    <div id="password-input-error" className="sr-only" role="alert">
                      {passwordError}
                    </div>
                  )}
                </div>

                {/* Options Row */}
                <div className="enl-options-row">
                  <div className="enl-remember-spacer" aria-hidden="true" />
                  <a
                    href="/recover-password"
                    className="enl-forgot-link"
                    onClick={(e) => {
                      e.preventDefault();
                      if (context.navigate) {
                        context.navigate('/recover-password');
                      } else {
                        window.location.href = '/recover-password';
                      }
                    }}
                  >
                    Forgot password?
                  </a>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  className="enl-login-btn"
                  disabled={loading || !isFormValid}
                  aria-disabled={loading || !isFormValid}
                >
                  {loading ? (
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <span>Log In</span>
                      <ArrowRight size={16} strokeWidth={2.5} />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="enl-card-divider" />

                {/* Compliance & Activity Monitoring Warning Notice */}
                <div className="enl-compliance-notice">
                  <div className="enl-compliance-header">
                    <ShieldCheck size={14} className="enl-compliance-icon" />
                    <span className="enl-compliance-title">Authorized Access & System Monitoring</span>
                  </div>
                  <p className="enl-compliance-text">
                    This system should only be accessed by authorized users. Individuals
                    using this system are subject to having their activities on this system
                    monitored and recorded by system administrators. If this monitoring
                    reveals possible criminal activity or policy violation, system
                    administrators may terminate your access privileges and may provide
                    the evidence to law enforcement or other officials.
                  </p>
                </div>
              </form>
            </div>
          </section>
        </div>

        {/* =============================================================== */}
        {/* 4. BOTTOM OCEAN WAVE WITH DYNAMIC STATISTICS                    */}
        {/* =============================================================== */}
        <div className="enl-wave-container">
          <svg
            className="enl-wave-svg"
            viewBox="0 0 1440 180"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M 0 91 C 280 50, 470 108, 740 82 C 1010 56, 1220 97, 1440 64 L 1440 180 L 0 180 Z"
              fill="#8FAFE7"
            />
            <path
              d="M 0 112 C 270 75, 500 126, 760 104 C 1030 82, 1240 119, 1440 91 L 1440 180 L 0 180 Z"
              fill="#FFCB05"
            />
            <path
              d="M 0 130 C 260 99, 520 145, 790 126 C 1060 108, 1260 143, 1440 120 L 1440 180 L 0 180 Z"
              fill="#00274C"
            />
          </svg>
          <div className="enl-wave-stats-wrapper">
            <LoginStatistics statistics={defaultStatistics} />
          </div>
        </div>

        {/* =============================================================== */}
        {/* 5. STRONG SYSTEM FOOTER BAR (CENTERED, CLINICAL PALETTE)        */}
        {/* =============================================================== */}
        <Footer variant="auth" />
      </div>
    </div>
  </div>
  );
};

export default IdentityModule;
