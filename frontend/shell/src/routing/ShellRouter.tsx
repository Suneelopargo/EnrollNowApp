// frontend/shell/src/routing/ShellRouter.tsx - Central Route Composition via Direct Modular Imports
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { TopNavigation } from '../navigation/TopNavigation';
import { Footer } from '../../../shared/design-system/components/Footer';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { useAuth } from '../auth/AuthContext';
import {
  IdentityModule,
  AdministrationModule,
  DashboardModule,
  OrganizationModule,
  StudyModule,
  ParticipantModule,
  RecruitmentModule,
  SurveyModule,
  TaskModule,
  CommunicationModule,
  DocumentModule,
} from '../modules';

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (!loading && isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export const ShellRouter: React.FC = () => {
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

        {/* Protected Feature Module Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <TopNavigation />
              <main className="page-container">
                <DashboardModule />
              </main>
              <Footer variant="app-shell" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/studies/*"
          element={
            <ProtectedRoute>
              <TopNavigation />
              <main className="page-container">
                <StudyModule />
              </main>
              <Footer variant="app-shell" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/participants/*"
          element={
            <ProtectedRoute>
              <TopNavigation />
              <main className="page-container">
                <ParticipantModule />
              </main>
              <Footer variant="app-shell" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruitment/*"
          element={
            <ProtectedRoute>
              <TopNavigation />
              <main className="page-container">
                <RecruitmentModule />
              </main>
              <Footer variant="app-shell" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/surveys/*"
          element={
            <ProtectedRoute>
              <TopNavigation />
              <main className="page-container">
                <SurveyModule />
              </main>
              <Footer variant="app-shell" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tasks/*"
          element={
            <ProtectedRoute>
              <TopNavigation />
              <main className="page-container">
                <TaskModule />
              </main>
              <Footer variant="app-shell" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/communications/*"
          element={
            <ProtectedRoute>
              <TopNavigation />
              <main className="page-container">
                <CommunicationModule />
              </main>
              <Footer variant="app-shell" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents/*"
          element={
            <ProtectedRoute>
              <TopNavigation />
              <main className="page-container">
                <DocumentModule />
              </main>
              <Footer variant="app-shell" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organization/*"
          element={
            <ProtectedRoute>
              <TopNavigation />
              <main className="page-container">
                <OrganizationModule />
              </main>
              <Footer variant="app-shell" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRoles={['ROLE_SUPER_ADMIN', 'ROLE_SITE_ADMIN', 'ROLE_ADMIN']}>
              <TopNavigation />
              <main className="page-container">
                <AdministrationModule />
              </main>
              <Footer variant="app-shell" />
            </ProtectedRoute>
          }
        />

        {/* Fallback Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default ShellRouter;
