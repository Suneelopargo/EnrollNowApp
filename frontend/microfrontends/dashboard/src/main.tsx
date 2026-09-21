import React from 'react';
import ReactDOM from 'react-dom/client';
import DashboardModule from './remoteEntry';
import '../../../shared/design-system/styles/index.css';

const mockContext = {
  user: { id: 1, username: 'admin', email: 'admin@enrollnow.local', active: true, roles: ['ROLE_SUPER_ADMIN'], siteCodes: ['SITE-001'] },
  token: 'mock-token',
  apiBaseUrl: 'http://localhost:8091',
  correlationId: 'standalone-dashboard',
  navigate: (to: string) => console.log('Navigate to:', to),
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="page-container">
      <DashboardModule context={mockContext} />
    </div>
  </React.StrictMode>
);
