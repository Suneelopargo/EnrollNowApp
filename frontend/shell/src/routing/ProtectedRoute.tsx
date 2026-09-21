// frontend/shell/src/routing/ProtectedRoute.tsx - Host Route Guard
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { isAuthenticated, user, hasRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
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
