// frontend/microfrontends/document/src/main.tsx - Standalone Dev Entry
import React from 'react';
import ReactDOM from 'react-dom/client';
import { DocumentModule } from './remoteEntry';
import { getApiBaseUrl } from '../../../shared/api-config';
import '../../../shared/design-system/styles/index.scss';

const mockContext = {
  user: {
    id: 'user-dev-001',
    username: 'docspecialist',
    email: 'documents@enrollnow.local',
    roles: ['ROLE_REGULATORY_SPECIALIST'],
    firstName: 'Rachel',
    lastName: 'Greene',
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
        <DocumentModule context={mockContext} />
      </div>
    </React.StrictMode>
  );
}
