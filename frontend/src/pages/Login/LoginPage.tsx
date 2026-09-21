import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, ShieldAlert, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Invalid email or password. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center space-x-2">
          <div className="h-12 w-12 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">EnrollNow</span>
        </div>
        <h2 className="mt-4 text-center text-xl font-semibold text-slate-800">
          Sign in to Clinical Trials Portal
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          HIPAA Compliant &amp; Role-Based Access Control
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 border border-red-200 flex items-start space-x-3">
              <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700 font-medium">{error}</div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="name@enrollnow.local"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Authorized personnel only. All access and actions are monitored and logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
