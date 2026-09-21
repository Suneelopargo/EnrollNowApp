// frontend/shell/src/routing/ShellRouter.tsx - Dynamic Route Composition via RemoteLoader
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RemoteLoader } from '../remotes/RemoteLoader';
import { TopNavigation } from '../navigation/TopNavigation';
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
