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
/* BRAND LOGO TYPOGRAPHY & SVG SCALING                                        */
/* ========================================================================== */
.enl-brand-marketing {
  gap: 14px;
}
.enl-brand-marketing .enl-brand-svg {
  width: 54px;
  height: 48px;
}
.enl-brand-marketing .enl-brand-name {
  font-size: 34px;
}
.enl-brand-marketing .enl-brand-tagline {
  font-size: 13.5px;
  margin-top: 3px;
}

.enl-brand-card {
  gap: 12px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
}
.enl-brand-card .enl-brand-svg {
  width: 44px;
  height: 40px;
}
.enl-brand-card .enl-brand-name {
  font-size: 26px;
}
.enl-brand-card .enl-brand-tagline {
  font-size: 11px;
  margin-top: 2px;
}

.enl-brand-normal {
  gap: 10px;
}
.enl-brand-normal .enl-brand-svg {
  width: 44px;
  height: 40px;
}
.enl-brand-normal .enl-brand-name {
  font-size: 28px;
}
.enl-brand-normal .enl-brand-tagline {
  font-size: 11.5px;
  margin-top: 2px;
}

/* ========================================================================== */
/* AMBIENT GLOWS & DOT GRIDS                                                  */
/* ========================================================================== */
.enl-ambient-glow-yellow {
  position: absolute;
  left: 48%;
  top: 2%;
  width: 340px;
  height: 340px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(254, 240, 186, 0.7) 0%, rgba(254, 240, 186, 0) 70%);
  pointer-events: none;
  z-index: 1;
}

.enl-ambient-glow-blue {
  position: absolute;
  left: 35%;
  top: 8%;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(186, 224, 255, 0.75) 0%, rgba(186, 224, 255, 0) 70%);
  pointer-events: none;
  z-index: 1;
}

.enl-dot-grid-top {
  position: absolute;
  left: 43%;
  top: 3.5%;
  pointer-events: none;
  z-index: 2;
}

.enl-dot-grid-bottom {
  position: absolute;
  left: 58%;
  bottom: 8%;
  pointer-events: none;
  z-index: 2;
}

/* ========================================================================== */
/* THREE-REGION GRID LAYOUT (MARKETING | SHOWCASE | LOGIN)                     */
/* ========================================================================== */
.enl-three-region-layout {
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: minmax(360px, 24%) minmax(680px, 43%) minmax(460px, 33%);
  align-items: center;
  padding: 0 2.5% 0 4.5%;
  z-index: 10;
  box-sizing: border-box;
}

/* 1. Marketing Region (Left Column) */
.enl-marketing-region {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: 100%;
  padding-top: clamp(24px, 4.2vh, 46px);
  padding-bottom: clamp(100px, 14vh, 150px);
  max-width: 380px;
  z-index: 10;
}

.enl-marketing-brand {
  margin-bottom: clamp(12px, 2vh, 22px);
}

.enl-marketing-headline {
  margin-bottom: clamp(14px, 2.2vh, 24px);
}

.enl-marketing-features {
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 1.6vh, 16px);
}

/* 2. Showcase Region (Center Column) */
.enl-showcase-region {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  position: relative;
  z-index: 8;
}

.enl-showcase-container {
  position: relative;
  width: 720px;
  height: 750px;
  max-height: 86vh;
}

.enl-ambient-blob-cyan {
  position: absolute;
  left: 230px;
  top: -30px;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(147, 197, 253, 0.85) 0%, rgba(186, 230, 253, 0.6) 60%, rgba(224, 242, 254, 0) 100%);
  pointer-events: none;
  z-index: 1;
}

.enl-ambient-blob-yellow {
  position: absolute;
  right: -20px;
  top: 20px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(254, 240, 138, 0.9) 0%, rgba(254, 249, 195, 0.7) 60%, rgba(254, 252, 232, 0) 100%);
  pointer-events: none;
  z-index: 1;
}

.enl-researcher-frame {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 390px;
  height: 680px;
  max-height: 76vh;
  border-radius: 40px 40px 0 0;
  overflow: hidden;
  box-shadow: 0 20px 48px -12px rgba(15, 23, 42, 0.12);
  z-index: 2;
  background-color: #ffffff;
}

.enl-researcher-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
}

/* Dashed Flow Connector SVG */
.enl-flow-connector {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 7;
}

/* Floating Cards Surrounding Researcher */
.enl-float-screening {
  position: absolute;
  left: 110px;
  top: 25px;
  z-index: 10;
  width: 280px;
}

.enl-float-appointments {
  position: absolute;
  left: 45px;
  top: 310px;
  z-index: 10;
  width: 230px;
}

.enl-float-engage {
  position: absolute;
  left: 110px;
  top: 515px;
  z-index: 10;
  width: 260px;
}

/* 3. Login Region (Right Column) */
.enl-login-region {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  z-index: 10;
  padding-left: 20px;
}

.enl-login-card {
  width: 100%;
  max-width: 530px;
  height: clamp(620px, 86vh, 850px);
  background-color: #ffffff;
  border-radius: 28px;
  padding: clamp(22px, 3.2vh, 34px) clamp(26px, 2.6vw, 40px) clamp(16px, 2.2vh, 24px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
  text-align: center;
  box-shadow: 0 20px 50px -10px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.7);
}

/* Bottom Ocean Wave with Statistics */
.enl-wave-container {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: clamp(120px, 16vh, 165px);
  z-index: 6;
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
  left: 5%;
  bottom: clamp(16px, 2.5vh, 30px);
  z-index: 10;
  pointer-events: auto;
}

.enl-card-title {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.015em;
  margin: 8px 0 2px 0;
}

.enl-card-subtitle {
  font-size: 13.5px;
  color: #64748b;
  margin: 0 0 12px 0;
}

.enl-error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #fef2f2;
  border: 1px solid #fecdd3;
  border-radius: 8px;
  color: #b91c1c;
  font-size: 12px;
  margin-bottom: 8px;
  text-align: left;
}

/* Form Fields */
.enl-card-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}

.enl-field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.enl-field-label {
  font-size: 12.5px;
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
  left: 12px;
  color: #64748b;
  pointer-events: none;
}

.enl-field-input {
  width: 100%;
  height: 42px;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  padding: 0 38px 0 38px;
  font-size: 13.5px;
  color: #0f172a;
  background-color: #ffffff;
  outline: none;
  transition: all 0.15s ease;
}
.enl-field-input:focus {
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.18);
}
.enl-field-input::placeholder {
  color: #94a3b8;
  font-size: 13.5px;
}

.enl-toggle-eye {
  position: absolute;
  right: 10px;
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
  margin: 4px 0 6px;
  font-size: 12px;
}

.enl-remember-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #475569;
  cursor: pointer;
  user-select: none;
}
.enl-remember-label input {
  accent-color: #f59e0b;
  cursor: pointer;
  width: 14px;
  height: 14px;
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
  height: 44px;
  background-color: #f59e0b;
  color: #0f172a;
  border: none;
  border-radius: 10px;
  font-size: 14.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.28);
  transition: all 0.15s ease;
}
.enl-login-btn:hover {
  background-color: #d97706;
  color: #ffffff;
  box-shadow: 0 6px 18px rgba(217, 119, 6, 0.35);
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
  margin: 5px 0;
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
  padding: 0 10px;
  font-size: 11.5px;
  color: #94a3b8;
  font-weight: 500;
  text-transform: uppercase;
}

/* SSO Buttons */
.enl-sso-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.enl-sso-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  padding: 0 10px;
}
.enl-sso-btn:hover {
  background-color: #f8fafc;
  border-color: #94a3b8;
}

/* Card Footer */
.enl-card-footer {
  margin-top: 8px;
  text-align: center;
}

.enl-footer-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  font-size: 11.5px;
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
  font-size: 10.5px;
  color: #94a3b8;
  margin-top: 4px;
}

/* ========================================================================== */
/* RESPONSIVE DESIGN BREAKPOINTS                                              */
/* ========================================================================== */

@media (max-width: 1600px) {
  .enl-three-region-layout {
    grid-template-columns: minmax(320px, 25%) minmax(480px, 42%) minmax(360px, 33%);
    padding: 0 2.5% 0 3.5%;
  }
  .enl-showcase-container {
    width: 560px;
    height: 660px;
    transform: scale(0.92);
    transform-origin: center center;
  }
}

@media (max-width: 1366px) {
  .enl-three-region-layout {
    grid-template-columns: minmax(310px, 27%) minmax(440px, 38%) minmax(350px, 35%);
    padding: 0 2% 0 3%;
  }
  .enl-showcase-container {
    width: 520px;
    height: 620px;
    transform: scale(0.82);
    transform-origin: center center;
  }
  .enl-marketing-region {
    max-width: 340px;
  }
}

@media (max-width: 1180px) {
  .enl-three-region-layout {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    padding: 0 4%;
  }
  .enl-showcase-region {
    display: none;
  }
  .enl-marketing-region {
    max-width: 460px;
    padding-bottom: 120px;
  }
  .enl-login-region {
    justify-content: center;
    padding-left: 0;
  }
  .enl-login-card {
    max-width: 460px;
  }
  .enl-wave-stats-wrapper {
    left: 3%;
  }
  .enl-statistics-row {
    gap: 16px !important;
  }
  .enl-stat-item {
    gap: 8px !important;
  }
}

@media (max-width: 900px) {
  .enl-auth-page {
    height: auto;
    min-height: 100vh;
    overflow-y: auto;
    padding: 32px 16px;
    background: linear-gradient(145deg, #eef6fd 0%, #f8fbfd 100%);
    align-items: flex-start;
    justify-content: center;
  }
  .enl-canvas-wrapper {
    height: auto;
    max-width: 520px;
  }
  .enl-canvas {
    height: auto;
    background: none;
    overflow: visible;
  }
  .enl-three-region-layout {
    display: flex;
    flex-direction: column;
    padding: 0;
    gap: 32px;
  }
  .enl-showcase-region,
  .enl-wave-container,
  .enl-ambient-glow-yellow,
  .enl-ambient-glow-blue,
  .enl-dot-grid-top,
  .enl-dot-grid-bottom {
    display: none;
  }
  .enl-marketing-region {
    height: auto;
    padding-top: 0;
    padding-bottom: 0;
    max-width: 100%;
    align-items: center;
    text-align: center;
  }
  .enl-marketing-headline .enl-accent-bar {
    margin-left: auto;
    margin-right: auto;
  }
  .enl-marketing-features {
    align-items: flex-start;
    width: 100%;
  }
  .enl-login-region {
    width: 100%;
    height: auto;
  }
  .enl-login-card {
    height: auto;
    max-width: 100%;
    padding: 28px 24px 20px;
    box-shadow: 0 16px 40px -10px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.8);
  }
}

@media (max-width: 480px) {
  .enl-auth-page {
    padding: 16px 12px;
  }
  .enl-marketing-region {
    align-items: flex-start;
    text-align: left;
  }
  .enl-marketing-headline .enl-accent-bar {
    margin-left: 0;
    margin-right: 0;
  }
  .enl-brand-marketing {
    gap: 10px;
    margin-bottom: 14px;
    align-self: flex-start;
  }
  .enl-brand-marketing .enl-brand-svg {
    width: 38px;
    height: 34px;
  }
  .enl-brand-marketing .enl-brand-name {
    font-size: 24px;
  }
  .enl-brand-marketing .enl-brand-tagline {
    font-size: 10.5px;
  }
  .enl-login-card {
    padding: 20px 16px 16px;
  }
  .enl-sso-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .enl-sso-btn {
    height: 38px;
    font-size: 12px;
  }
  .enl-footer-links {
    flex-wrap: wrap;
    gap: 6px;
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

    // Exact entered credentials — NO hardcoded test fallback
    const loginUser = username.trim();
    const loginPass = password;

    if (!loginUser || !loginPass) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
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
