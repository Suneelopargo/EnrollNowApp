// frontend/microfrontends/identity/src/remoteEntry.tsx - Identity MFE Remote Entry
import React, { useState } from 'react';
import { MfeContext } from '../../../shared/contracts';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import axios from 'axios';

export interface IdentityModuleProps {
  context: MfeContext;
}

export const IdentityModule: React.FC<IdentityModuleProps> = ({ context }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('EnrollNowAdmin2026!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const apiBase = context.apiBaseUrl || 'http://localhost:8081';
      const res = await axios.post(`${apiBase}/api/v1/auth/login`, {
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

        context.navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen-wrapper">
      <div className="login-card-container">
        <div className="login-brand-header">
          <div className="brand-logo-badge login-badge">EN</div>
          <h1>EnrollNow Platform</h1>
          <p>Authoritative Identity & Access Management</p>
        </div>

        <div className="card">
          <div className="card-body">
            <h2>Sign In to Your Account</h2>

            {error && (
              <div className="login-error-alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="username">
                  Username or Email
                </label>
                <input
                  id="username"
                  type="text"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  placeholder="e.g. admin"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg login-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="card-footer login-card-footer">
            Authoritative Identity Service 8081 · Argon2id Hash Security
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentityModule;
