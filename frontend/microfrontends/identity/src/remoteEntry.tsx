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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    setError(null);

    // Exact entered credentials — NO hardcoded test fallback
    const loginUser = username.trim();
    const loginPass = password;

    if (!loginUser || !loginPass) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

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
      setError(
        err.message ||
          err.normalized?.message ||
          'Invalid username or password. Please verify your credentials.'
      );
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

              {/* Error Alert */}
              {error && (
                <div className="enl-error-alert" role="alert">
                  <AlertCircle size={15} />
                  <span>{error}</span>
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
                      type="text"
                      className="enl-field-input"
                      placeholder="Enter your email address"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
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
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="enl-toggle-eye"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Options Row */}
                <div className="enl-options-row">
                  <label className="enl-remember-label">
                   
                    <span></span>
                  </label>
                  <a
                    href="#forgot-password"
                    className="enl-forgot-link"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Password reset instructions routed to your administrator.');
                    }}
                  >
                    Forgot password?
                  </a>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  className="enl-login-btn"
                  disabled={loading}
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
            <defs>
              <linearGradient id="enl-wave-front" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="35%" stopColor="#0369a1" />
                <stop offset="70%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
              <linearGradient id="enl-wave-back" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.35" />
              </linearGradient>
            </defs>
            <path
              d="M 0 50 C 260 85, 480 25, 780 70 C 1050 110, 1260 55, 1440 115 L 1440 180 L 0 180 Z"
              fill="url(#enl-wave-back)"
            />
            <path
              d="M 0 60 C 300 110, 600 35, 900 80 C 1140 115, 1280 75, 1440 140 L 1440 180 L 0 180 Z"
              fill="url(#enl-wave-front)"
            />
          </svg>
          <div className="enl-wave-stats-wrapper">
            <LoginStatistics statistics={defaultStatistics} />
          </div>
        </div>

        {/* =============================================================== */}
        {/* 5. STRONG SYSTEM FOOTER BAR (CENTERED, CLINICAL PALETTE)        */}
        {/* =============================================================== */}
        <footer className="enl-login-strong-footer" role="contentinfo">
          <div className="enl-strong-footer-container enl-strong-footer-container--center">
            <span>© 2016 - 2027 </span>
            <a
              href="#enrollnow"
              className="enl-strong-footer-link"
              onClick={(e) => e.preventDefault()}
            >
              EnrollNow
            </a>
            <span className="enl-strong-footer-sep" aria-hidden="true">|</span>
            <a
              href="#terms"
              className="enl-strong-footer-link"
              onClick={(e) => e.preventDefault()}
            >
              Terms of Service
            </a>
            <span className="enl-strong-footer-sep" aria-hidden="true">|</span>
            <a
              href="#support"
              className="enl-strong-footer-link"
              onClick={(e) => e.preventDefault()}
            >
              Support Center
            </a>
          </div>
        </footer>
      </div>
    </div>
  </div>
  );
};

export default IdentityModule;
