// frontend/microfrontends/survey/src/main.tsx - Standalone Dev Entry
import React from 'react';
import ReactDOM from 'react-dom/client';
import { SurveyModule } from './remoteEntry';
import { getApiBaseUrl } from '../../../shared/api-config';
import '../../../shared/design-system/styles/index.scss';

const mockContext = {
  user: {
    id: 'user-dev-001',
    username: 'surveyauthor',
    email: 'surveys@enrollnow.local',
    roles: ['ROLE_SURVEY_AUTHOR'],
    firstName: 'David',
    lastName: 'Kovac',
  },
  token: 'mock-jwt-token',
  apiBaseUrl: getApiBaseUrl(),
  basePath: '/',
  correlationId: 'dev-correlation-id',
  navigate: (path: string) => console.log('Navigate to:', path),
  emitEvent: (event: any) => console.log('Emitted event:', event),
};

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <div className="shell-main-content">
        <SurveyModule context={mockContext} />
      </div>
    </React.StrictMode>
  );
}
