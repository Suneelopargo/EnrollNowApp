// frontend/microfrontends/participant/src/main.tsx - Standalone Dev Entry
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ParticipantModule } from './remoteEntry';
import '../../../shared/design-system/variables.css';
import '../../../shared/design-system/globals.css';
import '../../../shared/design-system/layout.css';
import '../../../shared/design-system/components.css';

const mockContext = {
  user: {
    id: 'user-dev-001',
    username: 'coordinator',
    email: 'coordinator@enrollnow.local',
    roles: ['ROLE_COORDINATOR'],
    firstName: 'Sara',
    lastName: 'Chen',
  },
  token: 'mock-jwt-token',
  apiBaseUrl: 'http://localhost:8085',
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
        <ParticipantModule context={mockContext} />
      </div>
    </React.StrictMode>
  );
}
