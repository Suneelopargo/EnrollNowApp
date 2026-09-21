import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser } from '../types/auth';
import { authService } from '../api/authService';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roleCode: string) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('enrollnow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('enrollnow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('enrollnow_token');
      if (storedToken) {
        try {
          const profile = await authService.getCurrentUser();
          setUser(profile);
          localStorage.setItem('enrollnow_user', JSON.stringify(profile));
        } catch (err) {
          console.error('Failed to load current user profile:', err);
          setUser(null);
          setToken(null);
          localStorage.removeItem('enrollnow_token');
          localStorage.removeItem('enrollnow_user');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    const result = await authService.login(usernameOrEmail, password);
    setToken(result.accessToken);
    setUser(result.user);
    localStorage.setItem('enrollnow_token', result.accessToken);
    localStorage.setItem('enrollnow_user', JSON.stringify(result.user));
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  const hasRole = (roleCode: string): boolean => {
    if (!user || !user.roles) return false;
    const formatted = roleCode.startsWith('ROLE_') ? roleCode : `ROLE_${roleCode}`;
    return user.roles.includes(formatted) || user.roles.includes('ROLE_SUPER_ADMIN');
  };

  const isAdmin = Boolean(
    user &&
    user.roles &&
    (user.roles.includes('ROLE_SUPER_ADMIN') ||
      user.roles.includes('ROLE_SITE_ADMIN') ||
      user.roles.includes('SUPER_ADMIN') ||
      user.roles.includes('SITE_ADMIN'))
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        logout,
        hasRole,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
