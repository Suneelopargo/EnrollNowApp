import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole?: string;
  requiredRoles?: string[];
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredRoles,
  adminOnly = false,
}) => {
  const { isAuthenticated, isLoading, hasRole, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.some(r => hasRole(r))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
