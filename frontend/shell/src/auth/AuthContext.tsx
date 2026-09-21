// frontend/shell/src/auth/AuthContext.tsx - Host-Level Authentication & Session Management
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, AuthState } from '../../../shared/contracts';
import { defaultApiClient } from '../../../shared/api-client';
import { telemetry } from '../../../shared/telemetry';

export interface AuthContextType extends AuthState {
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
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
  isAdmin: false,
  hasRole: () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('enrollnow_token'));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('enrollnow_token');
    localStorage.removeItem('enrollnow_user');
  }, []);

  // Server-side session verification on startup
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const storedToken = localStorage.getItem('enrollnow_token');
      if (!storedToken) {
        if (isMounted) {
          clearSession();
          setLoading(false);
        }
        return;
      }

      try {
        const res = await defaultApiClient.get('/api/v1/auth/me', {
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
        } else {
          if (isMounted) {
            clearSession();
          }
        }
      } catch (err) {
        // Server rejected token or unavailable
        if (isMounted) {
          clearSession();
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
    const res = await defaultApiClient.post('/api/v1/auth/login', { username, password });
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
  };

  const logout = () => {
    clearSession();
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
