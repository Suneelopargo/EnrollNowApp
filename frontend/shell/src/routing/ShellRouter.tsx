// frontend/shell/src/routing/ShellRouter.tsx - Central Route Composition with Multi-Tab Keep-Alive Host
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { TopNavigation } from '../navigation/TopNavigation';
import { WorkspaceScreenHost } from './WorkspaceScreenHost';
import { Footer } from '../../../shared/design-system/components/Footer';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { IdentityModule } from '../modules';
import { useAuth } from '../auth/AuthContext';

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (!loading && isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export const ShellRouter: React.FC = () => {
  const protectedWorkspaceElement = (
    <ProtectedRoute>
      <TopNavigation />
      <WorkspaceScreenHost />
      <Footer variant="app-shell" />
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
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected Feature Module Routes - Mapped to Keep-Alive Multi-Screen Workspace */}
        <Route path="/dashboard" element={protectedWorkspaceElement} />
        <Route path="/dashboard/*" element={protectedWorkspaceElement} />
        <Route path="/studies" element={protectedWorkspaceElement} />
        <Route path="/studies/*" element={protectedWorkspaceElement} />
        <Route path="/participants" element={protectedWorkspaceElement} />
        <Route path="/participants/*" element={protectedWorkspaceElement} />
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
        <Route path="/admin" element={protectedWorkspaceElement} />
        <Route path="/admin/*" element={protectedWorkspaceElement} />

        {/* Fallback Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default ShellRouter;
