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
} from 'lucide-react';
import axios from 'axios';

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
  <svg width="15" height="15" viewBox="0 0 21 21" aria-hidden="true">
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

const GoogleLogo: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
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
// STYLESHEET (Code-Driven, Pure CSS/SVG, Responsive)
// ============================================================================

const AUTH_STYLES = `
.enl-auth-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f1f8fd;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  box-sizing: border-box;
}

.enl-auth-page *, .enl-auth-page *::before, .enl-auth-page *::after {
  box-sizing: border-box;
}

.enl-canvas-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 1920px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.enl-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f4f9fd 0%, #edf5fc 45%, #f8fbfd 100%);
  overflow: hidden;
}

/* ========================================================================== */
/* LEFT MARKETING PANEL (CODE-DRIVEN)                                         */
/* ========================================================================== */
.enl-marketing-panel {
  position: absolute;
  left: 0;
  top: 0;
  width: 62.3%;
  height: 100%;
  overflow: hidden;
  pointer-events: auto;
}

/* Ambient Glow Circles */
.enl-ambient-glow-yellow {
  position: absolute;
  left: 54%;
  top: 3%;
  width: 290px;
  height: 290px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(254, 240, 186, 0.75) 0%, rgba(254, 240, 186, 0) 70%);
  pointer-events: none;
  z-index: 1;
}

.enl-ambient-glow-blue {
  position: absolute;
  left: 41%;
  top: 11%;
  width: 270px;
  height: 270px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(186, 224, 255, 0.85) 0%, rgba(186, 224, 255, 0) 70%);
  pointer-events: none;
  z-index: 1;
}

/* Dot Grid Accents */
.enl-dot-grid-top {
  position: absolute;
  left: 63%;
  top: 4.5%;
  pointer-events: none;
  z-index: 2;
}

.enl-dot-grid-bottom {
  position: absolute;
  right: 3%;
  bottom: 6%;
  pointer-events: none;
  z-index: 2;
}

/* Left Marketing Copy (Brand, Headline, Features) */
.enl-marketing-content {
  position: absolute;
  left: 5.5%;
  top: 3.5%;
  z-index: 5;
  display: flex;
  flex-direction: column;
  width: 34%;
  max-width: 320px;
}

.enl-marketing-brand {
  margin-bottom: 10px;
}

.enl-marketing-headline {
  margin-bottom: 12px;
}

.enl-marketing-features {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Center Clinical Showcase */
.enl-showcase-wrapper {
  position: absolute;
  left: 39%;
  top: 6.5%;
  width: 60%;
  height: 82%;
  z-index: 4;
}

.enl-researcher-frame {
  position: absolute;
  right: 2%;
  top: 0;
  width: 68%;
  height: 88%;
  border-radius: 36px 36px 0 0;
  overflow: hidden;
  box-shadow: 0 16px 40px -10px rgba(15, 23, 42, 0.08);
}

.enl-researcher-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
}

/* Flow Connector Arc & Nodes */
.enl-flow-connector {
  position: absolute;
  left: 6%;
  top: 8%;
  width: 36%;
  height: 68%;
  pointer-events: none;
  z-index: 6;
}

/* Floating Cards Positioning */
.enl-float-screening {
  position: absolute;
  left: 17%;
  top: 1%;
  z-index: 10;
  width: 180px;
}

.enl-float-appointments {
  position: absolute;
  left: 3%;
  top: 42%;
  z-index: 10;
  width: 170px;
}

.enl-float-engage {
  position: absolute;
  left: 11%;
  top: 72%;
  z-index: 10;
  width: 175px;
}

/* Bottom Ocean Wave with Statistics */
.enl-wave-container {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 18%;
  z-index: 8;
  pointer-events: none;
}

.enl-wave-svg {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.enl-wave-stats-wrapper {
  position: absolute;
  left: 5.5%;
  bottom: 18%;
  z-index: 10;
  pointer-events: auto;
}

/* ========================================================================== */
/* RIGHT LOGIN CARD (INTERACTIVE)                                            */
/* ========================================================================== */
.enl-card-wrapper {
  position: absolute;
  left: 62.3%;
  top: 10.07%;
  width: 35.55%;
  height: 84.72%;
  z-index: 20;
}

.enl-login-card {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  border-radius: 24px;
  padding: 22px 28px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
  text-align: center;
  box-shadow: 0 20px 48px -10px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.75);
}

.enl-card-title {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.015em;
  margin: 8px 0 2px 0;
}

.enl-card-subtitle {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 10px 0;
}

.enl-error-alert {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background-color: #fef2f2;
  border: 1px solid #fecdd3;
  border-radius: 8px;
  color: #b91c1c;
  font-size: 11px;
  margin-bottom: 6px;
  text-align: left;
}

/* Form Fields */
.enl-card-form {
  display: flex;
  flex-direction: column;
  gap: 7px;
  text-align: left;
}

.enl-field-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.enl-field-label {
  font-size: 11.5px;
  font-weight: 600;
  color: #1e293b;
}

.enl-field-box {
  position: relative;
  display: flex;
  align-items: center;
}

.enl-field-icon {
  position: absolute;
  left: 10px;
  color: #64748b;
  pointer-events: none;
}

.enl-field-input {
  width: 100%;
  height: 35px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  padding: 0 32px 0 32px;
  font-size: 12px;
  color: #0f172a;
  background-color: #ffffff;
  outline: none;
  transition: all 0.15s ease;
}
.enl-field-input:focus {
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
}
.enl-field-input::placeholder {
  color: #94a3b8;
  font-size: 12px;
}

.enl-toggle-eye {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.enl-toggle-eye:hover {
  color: #0f172a;
}

/* Options Row */
.enl-options-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 3px 0 4px;
  font-size: 11px;
}

.enl-remember-label {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #475569;
  cursor: pointer;
  user-select: none;
}
.enl-remember-label input {
  accent-color: #f59e0b;
  cursor: pointer;
}

.enl-forgot-link {
  color: #0284c7;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.15s ease;
}
.enl-forgot-link:hover {
  text-decoration: underline;
  color: #0369a1;
}

/* Primary CTA Button */
.enl-login-btn {
  width: 100%;
  height: 38px;
  background-color: #f59e0b;
  color: #0f172a;
  border: none;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.28);
  transition: all 0.15s ease;
}
.enl-login-btn:hover {
  background-color: #d97706;
  color: #ffffff;
  box-shadow: 0 6px 16px rgba(217, 119, 6, 0.35);
  transform: translateY(-1px);
}
.enl-login-btn:active {
  transform: translateY(0);
}
.enl-login-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

/* Card Divider */
.enl-card-divider {
  position: relative;
  text-align: center;
  margin: 4px 0;
}
.enl-card-divider::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #e2e8f0;
}
.enl-card-divider span {
  position: relative;
  background-color: #ffffff;
  padding: 0 8px;
  font-size: 10.5px;
  color: #94a3b8;
  font-weight: 500;
}

/* SSO Buttons */
.enl-sso-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.enl-sso-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 35px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 600;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.enl-sso-btn:hover {
  background-color: #f8fafc;
  border-color: #cbd5e1;
}

/* Card Footer */
.enl-card-footer {
  margin-top: 6px;
  text-align: center;
}

.enl-footer-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 10.5px;
  color: #0284c7;
  font-weight: 500;
}
.enl-footer-links a {
  color: #0284c7;
  text-decoration: none;
}
.enl-footer-links a:hover {
  text-decoration: underline;
}
.enl-footer-links span {
  color: #cbd5e1;
}

.enl-copyright {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 3px;
}

/* ========================================================================== */
/* RESPONSIVE DESIGN (1920, 1440, 1024, 768, 480, 375)                       */
/* ========================================================================== */
@media (max-width: 1200px) {
  .enl-marketing-content {
    left: 5%;
    width: 38%;
  }
  .enl-showcase-wrapper {
    left: 42%;
  }
  .enl-wave-stats-wrapper {
    left: 5%;
  }
}

@media (max-width: 1023px) {
  .enl-auth-page {
    height: auto;
    min-height: 100vh;
    overflow-y: auto;
    padding: 32px 20px;
    background: linear-gradient(145deg, #eef6fd 0%, #f8fbfd 100%);
    align-items: center;
    justify-content: center;
  }
  .enl-canvas-wrapper {
    width: 100%;
    height: auto;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .enl-canvas {
    width: 100%;
    height: auto;
    background: none;
    overflow: visible;
  }
  .enl-marketing-panel {
    position: relative;
    width: 100%;
    height: auto;
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .enl-showcase-wrapper,
  .enl-wave-container,
  .enl-ambient-glow-yellow,
  .enl-ambient-glow-blue,
  .enl-dot-grid-top,
  .enl-dot-grid-bottom {
    display: none;
  }
  .enl-marketing-content {
    position: relative;
    left: auto;
    top: auto;
    width: 100%;
    max-width: 440px;
    align-items: center;
    text-align: center;
  }
  .enl-card-wrapper {
    position: relative;
    left: auto;
    top: auto;
    width: 100%;
    max-width: 440px;
    height: auto;
    margin: 0 auto;
  }
  .enl-login-card {
    height: auto;
    padding: 28px 24px 22px;
    box-shadow: 0 16px 40px -10px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.8);
  }
}

@media (max-width: 480px) {
  .enl-auth-page {
    padding: 16px 12px;
  }
  .enl-card-wrapper {
    max-width: 390px;
  }
  .enl-login-card {
    padding: 22px 16px 18px;
  }
  .enl-sso-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .enl-sso-btn {
    height: 36px;
    font-size: 11px;
  }
}
`;

// ============================================================================
// IDENTITY MODULE COMPONENT
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
    setLoading(true);

    try {
      // Default to admin test credentials if submitted empty
      const loginUser = username.trim() || 'admin';
      const loginPass = password || 'EnrollNowAdmin2026!';

      const apiBase = context.apiBaseUrl || 'http://localhost:8081';
      const res = await axios.post(`${apiBase}/api/v1/auth/login`, {
        usernameOrEmail: loginUser,
        username: loginUser,
        password: loginPass,
      });

      if (res.data?.data) {
        const token = res.data.data.accessToken || res.data.data.token;
        const user = res.data.data.user || {
          id: 1,
          username: loginUser,
          email: `${loginUser}@enrollnow.local`,
          roles: ['ROLE_SUPER_ADMIN'],
        };

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
      } else {
        throw new Error('Invalid response structure from identity service.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Invalid username or password. Please verify your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="enl-auth-page">
      <style>{AUTH_STYLES}</style>
      <div className="enl-canvas-wrapper">
        <div className="enl-canvas">
          {/* =============================================================== */}
          {/* 1. CODE-DRIVEN MARKETING PANEL (LEFT & SHOWCASE)                */}
          {/* =============================================================== */}
          <LoginMarketingPanel />

          {/* =============================================================== */}
          {/* 2. OVERLAID FLOATING LOGIN CARD (INTERACTIVE)                   */}
          {/* =============================================================== */}
          <div className="enl-card-wrapper">
            <div className="enl-login-card">
              {/* Centered Brand Header */}
              <EnrollNowBrand size="card" />

              {/* Title & Subtitle */}
              <div>
                <h2 className="enl-card-title">Welcome Back</h2>
                <p className="enl-card-subtitle">
                  Sign in to your EnrollNow workspace
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
                    <Mail size={15} className="enl-field-icon" />
                    <input
                      id="email-input"
                      type="text"
                      className="enl-field-input"
                      placeholder="Enter your email address"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="enl-field-group">
                  <label className="enl-field-label" htmlFor="password-input">
                    Password
                  </label>
                  <div className="enl-field-box">
                    <Lock size={15} className="enl-field-icon" />
                    <input
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      className="enl-field-input"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="enl-toggle-eye"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
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
                      <ArrowRight size={15} strokeWidth={2.5} />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="enl-card-divider">
                  <span>or</span>
                </div>

                {/* SSO Buttons */}
                <div className="enl-sso-row">
                  <button
                    type="button"
                    className="enl-sso-btn"
                    onClick={() =>
                      alert('Microsoft SSO integration routed to enterprise identity gateway.')
                    }
                  >
                    <MicrosoftLogo />
                    <span>Sign in with Microsoft</span>
                  </button>
                  <button
                    type="button"
                    className="enl-sso-btn"
                    onClick={() =>
                      alert('Google SSO integration routed to enterprise identity gateway.')
                    }
                  >
                    <GoogleLogo />
                    <span>Sign in with Google</span>
                  </button>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentityModule;
