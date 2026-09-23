// frontend/shell/src/routing/ShellRouter.tsx - Dynamic Route Composition via RemoteLoader
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RemoteLoader } from '../remotes/RemoteLoader';
import { TopNavigation } from '../navigation/TopNavigation';
import { Footer } from '../../../shared/design-system/components/Footer';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';

export const ShellRouter: React.FC = () => {
  return (
    <div className="app-shell">
      <Routes>
        {/* Public Login Route dynamically loads identity MFE */}
        <Route path="/login" element={<RemoteLoader remoteId="identity" />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected Micro-Frontend Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <TopNavigation />
              <main className="page-container">
                <RemoteLoader remoteId="dashboard" />
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
                <RemoteLoader remoteId="study" />
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
                <RemoteLoader remoteId="participant" />
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
                <RemoteLoader remoteId="recruitment" />
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
                <RemoteLoader remoteId="survey" />
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
                <RemoteLoader remoteId="task" />
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
                <RemoteLoader remoteId="communication" />
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
                <RemoteLoader remoteId="document" />
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
                <RemoteLoader remoteId="organization" />
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
                <RemoteLoader remoteId="administration" />
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
