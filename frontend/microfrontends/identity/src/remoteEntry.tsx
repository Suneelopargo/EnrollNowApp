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
  Globe,
  ChevronDown,
} from 'lucide-react';
import { apiClient } from '../../../shared/api-client';
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
// BRAND ICONS & SVG ASSETS
// ============================================================================

const MicrosoftLogo: React.FC = () => (
  <svg width="17" height="17" viewBox="0 0 21 21" aria-hidden="true">
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

const GoogleLogo: React.FC = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.12C3.25 21.27 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.59H1.27C.46 8.2.01 10.05.01 12c0 1.95.45 3.8 1.26 5.41l4.01-3.12z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.73 1.27 6.59l4.01 3.12c.95-2.83 3.6-4.96 6.72-4.96z"
    />
  </svg>
);

// ============================================================================
// IDENTITY MODULE COMPONENT (Styles loaded from global _auth.scss)
// ============================================================================

export const IdentityModule: React.FC<IdentityModuleProps> = ({ context }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
                {/* Header Group: Brand Logo + Welcome Back */}
                <div className="enl-card-header">
                  <EnrollNowBrand size="card" />
                  <div>
                    <h2 className="enl-card-title">Welcome Back</h2>
                    <p className="enl-card-subtitle">
                      Sign in to your EnrollNow workspace
                    </p>
                  </div>
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
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
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
                <div className="enl-card-divider">
                 
               </div>
   
              </form>

              {/* Card Footer */}
              <div className="enl-card-footer">
                <div className="enl-footer-links">
                  <a href="#terms" onClick={(e) => e.preventDefault()}>
                    Terms of Service
                  </a>
                  <span>|</span>
                  <a href="#privacy" onClick={(e) => e.preventDefault()}>
                    Privacy Policy
                  </a>
                  <span>|</span>
                  <a href="#support" onClick={(e) => e.preventDefault()}>
                    Support Center
                  </a>
                </div>
                <div className="enl-copyright">
                  © 2016 – 2026 EnrollNow. All rights reserved.
                </div>
              </div>
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
      </div>
    </div>
  </div>
  );
};

export default IdentityModule;
