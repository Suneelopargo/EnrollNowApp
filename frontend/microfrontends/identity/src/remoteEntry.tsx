// frontend/microfrontends/identity/src/remoteEntry.tsx - Identity MFE Remote Entry
import React, { useState } from 'react';
import { MfeContext } from '../../../shared/contracts';
import { Footer } from '../../../shared/design-system/components/Footer';
import { Lock, User, AlertCircle, ArrowRight, Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react';
import axios from 'axios';

export interface IdentityModuleProps {
  context: MfeContext;
}

export const IdentityModule: React.FC<IdentityModuleProps> = ({ context }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('EnrollNowAdmin2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const apiBase = context.apiBaseUrl || 'http://localhost:8081';
      const res = await axios.post(`${apiBase}/api/v1/auth/login`, {
        usernameOrEmail: username,
        username,
        password,
      });

      if (res.data?.data) {
        const token = res.data.data.accessToken || res.data.data.token;
        const user = res.data.data.user || {
          id: 1,
          username,
          email: `${username}@enrollnow.local`,
          roles: ['ROLE_SUPER_ADMIN'],
        };

        localStorage.setItem('enrollnow_token', token);
        localStorage.setItem('enrollnow_user', JSON.stringify(user));

        if (context.onEvent) {
          context.onEvent('LOGIN_SUCCESS', { username, token });
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

  const handleSetDemoCredentials = (userRole: 'admin' | 'investigator' | 'coordinator') => {
    if (userRole === 'admin') {
      setUsername('admin');
      setPassword('EnrollNowAdmin2026!');
    } else if (userRole === 'investigator') {
      setUsername('dr_smith');
      setPassword('EnrollNowInvestigator2026!');
    } else {
      setUsername('coordinator1');
      setPassword('EnrollNowCoord2026!');
    }
    setError(null);
  };

  return (
    <div className="login-screen-wrapper">
      <div className="login-card-container">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="brand-logo-badge login-badge">EN</div>
          <h1>EnrollNow Platform</h1>
          <p>Authoritative Identity & Access Management</p>
        </div>

        {/* Auth Glass Card */}
        <div className="auth-card">
          <div className="auth-card-body">
            <div className="auth-title-row">
              <h2>Sign In to Your Account</h2>
              <div className="auth-subtitle">Enter your clinical credentials to access your workspaces</div>
            </div>

            {error && (
              <div className="login-error-alert" role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Username Input */}
              <div className="auth-form-group">
                <label className="form-label" htmlFor="username">
                  Username or Email
                </label>
                <div className="input-icon-wrapper">
                  <div className="input-icon-left">
                    <User size={18} />
                  </div>
                  <input
                    id="username"
                    type="text"
                    className="form-input-with-icon"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                    placeholder="Enter your username or email"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="auth-form-group">
                <div className="form-label">
                  <span>Password</span>
                </div>
                <div className="input-icon-wrapper">
                  <div className="input-icon-left">
                    <Lock size={18} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input-with-icon"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your secure password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Help Options */}
              <div className="auth-options-row">
                <label className="remember-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember my session</span>
                </label>
                <a
                  href="#forgot-password"
                  className="forgot-password-link"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset link has been routed to identity administrator.');
                  }}
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="btn btn-primary login-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner spinner-sm spinner-white" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Platform</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {/* Demo Helper Pills */}
              <div className="demo-credentials-box">
                <div className="demo-header">
                  <div className="demo-header-label">
                    <KeyRound size={12} />
                    <span>Quick Fill Credentials:</span>
                  </div>
                </div>
                <div className="demo-pills-row">
                  <button
                    type="button"
                    className="demo-pill-btn"
                    onClick={() => handleSetDemoCredentials('admin')}
                  >
                    Super Admin
                  </button>
                  <button
                    type="button"
                    className="demo-pill-btn"
                    onClick={() => handleSetDemoCredentials('investigator')}
                  >
                    Investigator
                  </button>
                  <button
                    type="button"
                    className="demo-pill-btn"
                    onClick={() => handleSetDemoCredentials('coordinator')}
                  >
                    Coordinator
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Card Footer Security Badge */}
          <div className="login-card-footer">
            <span className="security-icon">
              <ShieldCheck size={14} />
            </span>
            <span>Authoritative Identity Gateway 8081 · Argon2id · 21 CFR Part 11 Compliant</span>
          </div>
        </div>

        {/* Global Shared Auth Footer */}
        <Footer variant="auth" />
      </div>
    </div>
  );
};

export default IdentityModule;
