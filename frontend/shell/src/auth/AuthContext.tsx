// frontend/shell/src/auth/AuthContext.tsx - Host-Level Authentication & Session Management
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AuthUser, AuthState } from '../../../shared/contracts';
import { getCachedRuntimeConfig } from '../../../shared/runtime-config';
import { telemetry } from '../../../shared/telemetry';

export interface AuthContextType extends AuthState {
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setSession: (user: AuthUser, token: string) => void;
  isAdmin: boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  setSession: () => {},
  isAdmin: false,
  hasRole: () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('enrollnow_token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem('enrollnow_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('enrollnow_token');
    localStorage.removeItem('enrollnow_user');
  }, []);

  const setSession = useCallback((newUser: AuthUser, newToken: string) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('enrollnow_token', newToken);
    localStorage.setItem('enrollnow_user', JSON.stringify(newUser));
  }, []);

  // Server-side session verification on startup
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const storedToken = localStorage.getItem('enrollnow_token');
      const storedUserRaw = localStorage.getItem('enrollnow_user');
      let cachedUser: AuthUser | null = null;
      try {
        cachedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
      } catch {
        cachedUser = null;
      }

      if (!storedToken) {
        if (isMounted) {
          clearSession();
          setLoading(false);
        }
        return;
      }

      // Pre-seed user if cached in localStorage
      if (cachedUser && isMounted) {
        setUser(cachedUser);
        setToken(storedToken);
      }

      try {
        const config = getCachedRuntimeConfig();
        const identityBase = config?.remotes?.identity?.apiBaseUrl || 'http://localhost:8081';
        const res = await axios.get(`${identityBase}/api/v1/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
          timeout: 5000,
        });

        if (res.data && res.data.data && res.data.data.username) {
          if (isMounted) {
            setUser(res.data.data);
            setToken(storedToken);
            localStorage.setItem('enrollnow_user', JSON.stringify(res.data.data));
          }
        }
      } catch (err: any) {
        // Only clear session if server explicitly returned 401 or 403 Unauthorized
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          if (isMounted) {
            clearSession();
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [clearSession]);

  // Listen for login/auth changes dispatched across microfrontends or window
  useEffect(() => {
    const handleAuthChange = (e: any) => {
      const detail = e.detail;
      if (detail?.user && detail?.token) {
        setToken(detail.token);
        setUser(detail.user);
      } else if (detail?.logout) {
        clearSession();
      }
    };

    window.addEventListener('enrollnow_auth_change', handleAuthChange);
    return () => {
      window.removeEventListener('enrollnow_auth_change', handleAuthChange);
    };
  }, [clearSession]);

  const isAuthenticated = Boolean(token && user);

  useEffect(() => {
    if (!loading) {
      telemetry.track({
        eventType: 'AUTH_STATE',
        details: { isAuthenticated, username: user?.username },
      });
    }
  }, [isAuthenticated, user, loading]);

  const login = async (username: string, password: string) => {
    const config = getCachedRuntimeConfig();
    const identityBase = config?.remotes?.identity?.apiBaseUrl || 'http://localhost:8081';
    const res = await axios.post(`${identityBase}/api/v1/auth/login`, {
      usernameOrEmail: username,
      username,
      password,
    });
    if (!res.data || !res.data.data) {
      clearSession();
      throw new Error('Authentication failed: Malformed response from Identity Service');
    }

    const data = res.data.data;
    const accessToken = data.accessToken || data.token;
    const authUser: AuthUser | undefined = data.user;

    if (!accessToken || !authUser || !authUser.username || !authUser.roles) {
      clearSession();
      throw new Error('Authentication failed: Incomplete user profile in server response');
    }

    setToken(accessToken);
    setUser(authUser);
    localStorage.setItem('enrollnow_token', accessToken);
    localStorage.setItem('enrollnow_user', JSON.stringify(authUser));
    window.dispatchEvent(
      new CustomEvent('enrollnow_auth_change', {
        detail: { token: accessToken, user: authUser },
      })
    );
  };

  const logout = () => {
    clearSession();
    window.dispatchEvent(new CustomEvent('enrollnow_auth_change', { detail: { logout: true } }));
    window.location.href = '/login';
  };

  const hasRole = (role: string) => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  };

  const isAdmin = hasRole('ROLE_SUPER_ADMIN') || hasRole('ROLE_SITE_ADMIN') || hasRole('ROLE_ADMIN');

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        token,
        loading,
        login,
        logout,
        setSession,
        isAdmin,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
