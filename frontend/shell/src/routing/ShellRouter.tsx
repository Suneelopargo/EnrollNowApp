// frontend/shell/src/routing/ShellRouter.tsx - Central Route Composition with Multi-Tab Keep-Alive Host
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { TopNavigation } from '../navigation/TopNavigation';
import { WorkspaceScreenHost } from './WorkspaceScreenHost';
import { Footer } from '../../../shared/design-system/components/Footer';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import {
  IdentityModule,
  ActivateAccountModule,
  RecoverPasswordModule,
  ResetPasswordModule,
} from '../modules';
import { useAuth } from '../auth/AuthContext';

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (!loading && isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export const ShellRouter: React.FC = () => {
  const workspaceContent = (
    <>
      <TopNavigation />
      <WorkspaceScreenHost />
      <Footer variant="app-shell" />
    </>
  );

  const protectedWorkspaceElement = (
    <ProtectedRoute>{workspaceContent}</ProtectedRoute>
  );

  const protectedRegistryWorkspaceElement = (
    <ProtectedRoute
      requiredPermission="REGISTRY_VIEW"
      requiredRoles={[
        'SITE_ADMIN',
        'SITE_MANAGER',
        'SITE_REGISTRY',
        'ROLE_SITE_ADMIN',
        'ROLE_SITE_MANAGER',
        'ROLE_SITE_REGISTRY',
        'ROLE_SUPER_ADMIN',
      ]}
    >
      {workspaceContent}
    </ProtectedRoute>
  );

  const protectedAdminWorkspaceElement = (
    <ProtectedRoute
      requiredPermission="SITE_ADMIN_ACCESS"
      requiredRoles={[
        'SITE_ADMIN',
        'SITE_MANAGER',
        'ROLE_SITE_ADMIN',
        'ROLE_SITE_MANAGER',
        'ROLE_SUPER_ADMIN',
        'ROLE_ADMIN',
      ]}
    >
      {workspaceContent}
    </ProtectedRoute>
  );

  return (
    <div className="app-shell">
      <Routes>
        {/* Public Login Route - Direct Local Identity Module */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <IdentityModule />
            </PublicOnlyRoute>
          }
        />
        {/* Public Account Activation Routes - Always accessible without redirecting to dashboard */}
        <Route path="/activate-account" element={<ActivateAccountModule />} />
        <Route path="/activate" element={<ActivateAccountModule />} />
        <Route path="/enroll/:token" element={<ActivateAccountModule />} />
        <Route path="/enroll" element={<ActivateAccountModule />} />
        {/* Public Password Recovery & Reset Routes */}
        <Route path="/recover-password" element={<RecoverPasswordModule />} />
        <Route path="/forgot-password" element={<RecoverPasswordModule />} />
        <Route path="/reset-password/:token" element={<ResetPasswordModule />} />
        <Route path="/reset-password" element={<ResetPasswordModule />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected Feature Module Routes - Mapped to Keep-Alive Multi-Screen Workspace */}
        <Route path="/dashboard" element={protectedWorkspaceElement} />
        <Route path="/dashboard/*" element={protectedWorkspaceElement} />
        <Route path="/studies" element={protectedWorkspaceElement} />
        <Route path="/studies/*" element={protectedWorkspaceElement} />
        <Route path="/participants" element={protectedRegistryWorkspaceElement} />
        <Route path="/participants/*" element={protectedRegistryWorkspaceElement} />
        <Route path="/recruitment" element={protectedWorkspaceElement} />
        <Route path="/recruitment/*" element={protectedWorkspaceElement} />
        <Route path="/surveys" element={protectedWorkspaceElement} />
        <Route path="/surveys/*" element={protectedWorkspaceElement} />
        <Route path="/tasks" element={protectedWorkspaceElement} />
        <Route path="/tasks/*" element={protectedWorkspaceElement} />
        <Route path="/communications" element={protectedWorkspaceElement} />
        <Route path="/communications/*" element={protectedWorkspaceElement} />
        <Route path="/documents" element={protectedWorkspaceElement} />
        <Route path="/documents/*" element={protectedWorkspaceElement} />
        <Route path="/organization" element={protectedWorkspaceElement} />
        <Route path="/organization/*" element={protectedWorkspaceElement} />
        <Route path="/admin" element={protectedAdminWorkspaceElement} />
        <Route path="/admin/*" element={protectedAdminWorkspaceElement} />

        {/* Fallback Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default ShellRouter;
