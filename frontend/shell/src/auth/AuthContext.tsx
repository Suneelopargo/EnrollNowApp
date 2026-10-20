// frontend/shell/src/auth/AuthContext.tsx - Host-Level Authentication & Session Management
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthUser, AuthState } from '../../../shared/contracts';
import { telemetry } from '../../../shared/telemetry';
import {
  authApi,
  deriveUserAccessFlags,
  userHasRole,
  userHasPermission,
  userHasRegistryAccess,
  userHasSiteAdminAccess,
  userIsFullSiteAdmin,
} from '../../../shared/api/authApi';

export interface AuthContextType extends AuthState {
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setSession: (user: AuthUser, token: string) => void;
  refreshPermissions: (siteId?: string) => Promise<AuthUser | null>;
  selectSite: (siteId: string) => Promise<void>;
  isAdmin: boolean;
  isFullSiteAdmin: boolean;
  canAccessRegistry: boolean;
  canAccessSiteAdmin: boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  setSession: () => {},
  refreshPermissions: async () => null,
  selectSite: async () => {},
  isAdmin: false,
  isFullSiteAdmin: false,
  canAccessRegistry: false,
  canAccessSiteAdmin: false,
  hasRole: () => false,
  hasPermission: () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('enrollnow_token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem('enrollnow_user');
      return raw ? deriveUserAccessFlags(JSON.parse(raw)) : null;
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
    const normalized = deriveUserAccessFlags(newUser);
    setToken(newToken);
    setUser(normalized);
    setLoading(false);
    localStorage.setItem('enrollnow_token', newToken);
    localStorage.setItem('enrollnow_user', JSON.stringify(normalized));
  }, []);

  const refreshPermissions = useCallback(async (siteId?: string): Promise<AuthUser | null> => {
    const storedToken = localStorage.getItem('enrollnow_token');
    if (!storedToken) return null;

    try {
      const refreshedUser = await authApi.getCurrentUser(siteId);
      if (refreshedUser && refreshedUser.username) {
        const normalized = deriveUserAccessFlags(refreshedUser);
        setUser(normalized);
        setToken(storedToken);
        localStorage.setItem('enrollnow_user', JSON.stringify(normalized));
        return normalized;
      }
    } catch (err: any) {
      const status = err.status || err.response?.status;
      if (status === 401 || status === 403) {
        clearSession();
      }
    }
    return null;
  }, [clearSession]);

  const selectSite = useCallback(async (siteId: string): Promise<void> => {
    await refreshPermissions(siteId);
  }, [refreshPermissions]);

  // Server-side session verification on startup
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const storedToken = localStorage.getItem('enrollnow_token');
      const storedUserRaw = localStorage.getItem('enrollnow_user');
      let cachedUser: AuthUser | null = null;
      try {
        cachedUser = storedUserRaw ? deriveUserAccessFlags(JSON.parse(storedUserRaw)) : null;
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
        const currentUser = await authApi.getCurrentUser(cachedUser?.siteId || undefined);

        if (currentUser && currentUser.username) {
          const normalized = deriveUserAccessFlags(currentUser);
          if (isMounted) {
            setUser(normalized);
            setToken(storedToken);
            localStorage.setItem('enrollnow_user', JSON.stringify(normalized));
          }
        }
      } catch (err: any) {
        // Only clear session if server explicitly returned 401 or 403 Unauthorized
        const status = err.status || err.response?.status;
        if (status === 401 || status === 403) {
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

  // Listen for login/auth changes or permission updates dispatched across microfrontends
  useEffect(() => {
    const handleAuthChange = (e: any) => {
      const detail = e.detail;
      if (detail?.user && detail?.token) {
        const normalized = deriveUserAccessFlags(detail.user);
        setToken(detail.token);
        setUser(normalized);
        setLoading(false);
      } else if (detail?.logout) {
        clearSession();
      }
    };

    const handlePermissionsUpdated = (e: any) => {
      const detail = e?.detail;
      // Refresh if no targetUserId is specified or if the updated user matches current user
      if (!detail?.userId || !user || String(detail.userId) === String(user.id)) {
        void refreshPermissions(detail?.siteId);
      }
    };

    window.addEventListener('enrollnow_auth_change', handleAuthChange);
    window.addEventListener('enrollnow_permissions_updated', handlePermissionsUpdated);
    return () => {
      window.removeEventListener('enrollnow_auth_change', handleAuthChange);
      window.removeEventListener('enrollnow_permissions_updated', handlePermissionsUpdated);
    };
  }, [clearSession, refreshPermissions, user]);

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
    try {
      const { user: authUser, token: accessToken } = await authApi.login({ username, password });

      if (!accessToken || !authUser || !authUser.username || !Array.isArray(authUser.roles)) {
        clearSession();
        throw new Error('Authentication failed: Incomplete user profile in server response');
      }

      const normalized = deriveUserAccessFlags(authUser);
      setToken(accessToken);
      setUser(normalized);
      localStorage.setItem('enrollnow_token', accessToken);
      localStorage.setItem('enrollnow_user', JSON.stringify(normalized));
      window.dispatchEvent(
        new CustomEvent('enrollnow_auth_change', {
          detail: { token: accessToken, user: normalized },
        })
      );
    } catch (err) {
      clearSession();
      throw err;
    }
  };

  const logout = () => {
    clearSession();
    localStorage.clear();
    sessionStorage.clear();
    authApi.logout();
    navigate('/login', { replace: true });
  };

  const hasRole = useCallback(
    (role: string) => userHasRole(user, role),
    [user]
  );

  const hasPermission = useCallback(
    (permission: string) => userHasPermission(user, permission),
    [user]
  );

  const canAccessRegistry = userHasRegistryAccess(user);
  const canAccessSiteAdmin = userHasSiteAdminAccess(user);
  const isFullSiteAdmin = userIsFullSiteAdmin(user);
  const isAdmin = canAccessSiteAdmin;

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
        refreshPermissions,
        selectSite,
        isAdmin,
        isFullSiteAdmin,
        canAccessRegistry,
        canAccessSiteAdmin,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
