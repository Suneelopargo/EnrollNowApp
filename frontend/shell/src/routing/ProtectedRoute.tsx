import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { LoadingSpinner } from '../../../shared/design-system/components/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { isAuthenticated, user, hasRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Verifying session..." />;
  }

  const hasStoredToken = Boolean(localStorage.getItem('enrollnow_token'));
  if (!isAuthenticated || !user) {
    if (hasStoredToken) {
      return <LoadingSpinner message="Loading workspace..." />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const authorized = requiredRoles.some((r) => hasRole(r) || hasRole('ROLE_SUPER_ADMIN'));
    if (!authorized) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
