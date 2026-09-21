import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NavigationProvider } from './context/NavigationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/Layout/AppLayout';
import { ErrorBoundary } from './components/ErrorBoundary';

// Feature / Micro-Frontend Modules
import { LoginModule } from './modules/identity/LoginModule';
import { DashboardModule } from './modules/dashboard/DashboardModule';
import { AdministrationModule } from './modules/administration/AdministrationModule';
import { StudyModule } from './modules/study/StudyModule';
import { ParticipantModule } from './modules/participant/ParticipantModule';
import { RecruitmentModule } from './modules/recruitment/RecruitmentModule';
import { SurveyModule } from './modules/survey/SurveyModule';
import { TaskModule } from './modules/task/TaskModule';
import { CommunicationModule } from './modules/communication/CommunicationModule';
import { DocumentModule } from './modules/document/DocumentModule';
import { OrganizationModule } from './modules/organization/OrganizationModule';
import { UnauthorizedPage } from './pages/Unauthorized/UnauthorizedPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavigationProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginModule />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected Micro-Frontend Module Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ErrorBoundary fallbackTitle="Clinical Dashboard Unavailable">
                      <DashboardModule />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/studies/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ErrorBoundary fallbackTitle="Study Management Module Unavailable">
                      <StudyModule />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/participants/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ErrorBoundary fallbackTitle="Participant Queue Module Unavailable">
                      <ParticipantModule />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/recruitment/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ErrorBoundary fallbackTitle="Recruitment Module Unavailable">
                      <RecruitmentModule />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/surveys/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ErrorBoundary fallbackTitle="Survey Studio Module Unavailable">
                      <SurveyModule />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/tasks/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ErrorBoundary fallbackTitle="Task Management Module Unavailable">
                      <TaskModule />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/communications/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ErrorBoundary fallbackTitle="Communications Module Unavailable">
                      <CommunicationModule />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/documents/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ErrorBoundary fallbackTitle="Document Repository Unavailable">
                      <DocumentModule />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/organization/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ErrorBoundary fallbackTitle="Organization Module Unavailable">
                      <OrganizationModule />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Administrator Unified Section */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requiredRoles={['ROLE_SUPER_ADMIN', 'ROLE_SITE_ADMIN', 'ROLE_ADMIN']}>
                  <AppLayout>
                    <ErrorBoundary fallbackTitle="Administration Console Unavailable">
                      <AdministrationModule />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </NavigationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
