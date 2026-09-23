// frontend/microfrontends/task/src/main.tsx - Standalone Dev Entry
import React from 'react';
import ReactDOM from 'react-dom/client';
import { TaskModule } from './remoteEntry';
import '../../../shared/design-system/styles/index.scss';

const mockContext = {
  user: {
    id: 'user-dev-001',
    username: 'taskmanager',
    email: 'ops@enrollnow.local',
    roles: ['ROLE_COORDINATOR'],
    firstName: 'Elena',
    lastName: 'Rostova',
  },
  token: 'mock-jwt-token',
  apiBaseUrl: 'http://localhost:8088',
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
        <TaskModule context={mockContext} />
      </div>
    </React.StrictMode>
  );
}
