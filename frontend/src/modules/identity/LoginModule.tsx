import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginModule: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('EnrollNowAdmin2026!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)', padding: 'var(--spacing-4)' }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--border-radius-lg)',
              background: 'linear-gradient(135deg, var(--color-brand-accent), var(--color-brand-cyan))',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '24px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-lg)',
              marginBottom: 'var(--spacing-4)',
            }}
          >
            EN
          </div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-primary)' }}>
            EnrollNow Platform
          </h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: '4px' }}>
            Clinical Participant Recruitment & Protocol Platform
          </p>
        </div>

        <div className="card">
          <div className="card-body">
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--spacing-4)' }}>
              Sign In to Your Account
            </h2>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: 'var(--spacing-3)',
                  backgroundColor: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger-border)',
                  borderRadius: 'var(--border-radius-md)',
                  color: 'var(--color-danger)',
                  fontSize: 'var(--font-size-sm)',
                  marginBottom: 'var(--spacing-4)',
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="username">
                  Username or Email
                </label>
                <div style={{ position: 'relative' }}>
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
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your credentials"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{ width: '100%', marginTop: 'var(--spacing-2)' }}
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

          <div className="card-footer" style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
            Authoritative Identity Service · Argon2id Secure Hash
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModule;
