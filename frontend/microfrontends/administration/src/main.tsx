// frontend/microfrontends/administration/src/main.tsx - Standalone Dev Entry
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AdministrationModule } from './remoteEntry';
import '../../../shared/design-system/styles/index.scss';

const mockContext = {
  user: {
    id: 'user-admin-001',
    username: 'admin',
    email: 'admin@enrollnow.local',
    roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'],
    firstName: 'System',
    lastName: 'Administrator',
    fullName: 'System Administrator',
    active: true,
    siteCodes: ['SITE-001', 'SITE-002', 'SITE-003'],
  },
  token: 'mock-admin-jwt-token',
  apiBaseUrl: 'http://localhost:8082',
  basePath: '/administrator',
  correlationId: `dev-admin-${Date.now()}`,
  navigate: (path: string) => console.log('Navigate to:', path),
  emitEvent: (event: any) => console.log('Emitted event:', event),
};

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <div className="shell-main-content">
        <AdministrationModule context={mockContext} />
      </div>
    </React.StrictMode>
  );
}
