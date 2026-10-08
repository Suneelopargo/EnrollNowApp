// frontend/shell/src/modules/index.tsx - Local Feature Module Declarations & Context Providers
import React, { Suspense, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { MfeContext } from '../../../shared/contracts';
import { getApiBaseUrl } from '../../../shared/api-config';
import { telemetry } from '../../../shared/telemetry';
import { ErrorBoundary } from '../../../shared/design-system/components/ErrorBoundary';
import { LoadingSpinner } from '../../../shared/design-system/components/LoadingSpinner';

export function useMfeContext(moduleName: string): MfeContext {
  const { user, token, setSession } = useAuth();
  const navigate = useNavigate();

  return useMemo<MfeContext>(
    () => ({
      user,
      token,
      apiBaseUrl: getApiBaseUrl(),
      correlationId: telemetry.getCorrelationId(),
      navigate,
      onEvent: (eventType: string, payload: any) => {
        telemetry.track({
          eventType: 'AUTH_STATE',
          remoteId: moduleName,
          details: { eventType, payload },
        });

        if (eventType === 'LOGIN_SUCCESS') {
          const authToken = payload?.token || localStorage.getItem('enrollnow_token');
          let authUser = payload?.user;
          if (!authUser && payload?.username) {
            authUser = {
              id: 1,
              username: payload.username,
              email: `${payload.username}@enrollnow.local`,
              roles: ['ROLE_SUPER_ADMIN'],
            };
          }
          if (authUser && authToken) {
            setSession(authUser, authToken);
          }
        }
      },
    }),
    [user, token, setSession, navigate, moduleName]
  );
}

// Local dynamic imports for code splitting within single-app Vite runtime
const LazyIdentity = React.lazy(() => import('../../../microfrontends/identity/src/remoteEntry'));
const LazyAdministration = React.lazy(() => import('../../../microfrontends/administration/src/remoteEntry'));
const LazyDashboard = React.lazy(() => import('../../../microfrontends/dashboard/src/remoteEntry'));
const LazyOrganization = React.lazy(() => import('../../../microfrontends/organization/src/remoteEntry'));
const LazyStudy = React.lazy(() => import('../../../microfrontends/study/src/remoteEntry'));
const LazyParticipant = React.lazy(() => import('../../../microfrontends/participant/src/remoteEntry'));
const LazyRecruitment = React.lazy(() => import('../../../microfrontends/recruitment/src/remoteEntry'));
const LazySurvey = React.lazy(() => import('../../../microfrontends/survey/src/remoteEntry'));
const LazyTask = React.lazy(() => import('../../../microfrontends/task/src/remoteEntry'));
const LazyCommunication = React.lazy(() => import('../../../microfrontends/communication/src/remoteEntry'));
const LazyDocument = React.lazy(() => import('../../../microfrontends/document/src/remoteEntry'));

export interface ModuleProps {
  context?: MfeContext;
}

export const IdentityModule: React.FC<ModuleProps> = ({ context }) => {
  const defaultContext = useMfeContext('identity');
  return (
    <ErrorBoundary fallbackTitle="Identity Module Error" remoteId="identity">
      <Suspense fallback={<LoadingSpinner message="Loading Identity & Authentication Module..." />}>
        <LazyIdentity context={context || defaultContext} />
      </Suspense>
    </ErrorBoundary>
  );
};

export const AdministrationModule: React.FC<ModuleProps> = ({ context }) => {
  const defaultContext = useMfeContext('administration');
  return (
    <ErrorBoundary fallbackTitle="Administration Module Error" remoteId="administration">
      <Suspense fallback={<LoadingSpinner message="Loading Administration & RBAC Module..." />}>
        <LazyAdministration context={context || defaultContext} />
      </Suspense>
    </ErrorBoundary>
  );
};

export const DashboardModule: React.FC<ModuleProps> = ({ context }) => {
  const defaultContext = useMfeContext('dashboard');
  return (
    <ErrorBoundary fallbackTitle="Dashboard Module Error" remoteId="dashboard">
      <Suspense fallback={<LoadingSpinner message="Loading Clinical Operations Dashboard Module..." />}>
        <LazyDashboard context={context || defaultContext} />
      </Suspense>
    </ErrorBoundary>
  );
};

export const OrganizationModule: React.FC<ModuleProps> = ({ context }) => {
  const defaultContext = useMfeContext('organization');
  return (
    <ErrorBoundary fallbackTitle="Organization Module Error" remoteId="organization">
      <Suspense fallback={<LoadingSpinner message="Loading Organization & Sites Module..." />}>
        <LazyOrganization context={context || defaultContext} />
      </Suspense>
    </ErrorBoundary>
  );
};

export const StudyModule: React.FC<ModuleProps> = ({ context }) => {
  const defaultContext = useMfeContext('study');
  return (
    <ErrorBoundary fallbackTitle="Study Module Error" remoteId="study">
      <Suspense fallback={<LoadingSpinner message="Loading Study Protocols Module..." />}>
        <LazyStudy context={context || defaultContext} />
      </Suspense>
    </ErrorBoundary>
  );
};

export const ParticipantModule: React.FC<ModuleProps> = ({ context }) => {
  const defaultContext = useMfeContext('participant');
  return (
    <ErrorBoundary fallbackTitle="Participant Module Error" remoteId="participant">
      <Suspense fallback={<LoadingSpinner message="Loading Registry Module..." />}>
        <LazyParticipant context={context || defaultContext} />
      </Suspense>
    </ErrorBoundary>
  );
};

export const RecruitmentModule: React.FC<ModuleProps> = ({ context }) => {
  const defaultContext = useMfeContext('recruitment');
  return (
    <ErrorBoundary fallbackTitle="Recruitment Module Error" remoteId="recruitment">
      <Suspense fallback={<LoadingSpinner message="Loading Recruitment Campaigns Module..." />}>
        <LazyRecruitment context={context || defaultContext} />
      </Suspense>
    </ErrorBoundary>
  );
};

export const SurveyModule: React.FC<ModuleProps> = ({ context }) => {
  const defaultContext = useMfeContext('survey');
  return (
    <ErrorBoundary fallbackTitle="Survey Module Error" remoteId="survey">
      <Suspense fallback={<LoadingSpinner message="Loading Survey & eConsent Module..." />}>
        <LazySurvey context={context || defaultContext} />
      </Suspense>
    </ErrorBoundary>
  );
};

export const TaskModule: React.FC<ModuleProps> = ({ context }) => {
  const defaultContext = useMfeContext('task');
  return (
    <ErrorBoundary fallbackTitle="Task Module Error" remoteId="task">
      <Suspense fallback={<LoadingSpinner message="Loading Tasks & Operations Module..." />}>
        <LazyTask context={context || defaultContext} />
      </Suspense>
    </ErrorBoundary>
  );
};

export const CommunicationModule: React.FC<ModuleProps> = ({ context }) => {
  const defaultContext = useMfeContext('communication');
  return (
    <ErrorBoundary fallbackTitle="Communication Module Error" remoteId="communication">
      <Suspense fallback={<LoadingSpinner message="Loading Outreach & Communications Module..." />}>
        <LazyCommunication context={context || defaultContext} />
      </Suspense>
    </ErrorBoundary>
  );
};

export const DocumentModule: React.FC<ModuleProps> = ({ context }) => {
  const defaultContext = useMfeContext('document');
  return (
    <ErrorBoundary fallbackTitle="Document Module Error" remoteId="document">
      <Suspense fallback={<LoadingSpinner message="Loading Document Repository Module..." />}>
        <LazyDocument context={context || defaultContext} />
      </Suspense>
    </ErrorBoundary>
  );
};

export const MODULE_REGISTRY: Record<string, React.FC<ModuleProps>> = {
  identity: IdentityModule,
  administration: AdministrationModule,
  dashboard: DashboardModule,
  organization: OrganizationModule,
  study: StudyModule,
  participant: ParticipantModule,
  recruitment: RecruitmentModule,
  survey: SurveyModule,
  task: TaskModule,
  communication: CommunicationModule,
  document: DocumentModule,
};
