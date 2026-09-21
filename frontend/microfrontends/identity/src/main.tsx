import React from 'react';
import ReactDOM from 'react-dom/client';
import IdentityModule from './remoteEntry';
import '../../../shared/design-system/styles/index.css';

const mockContext = {
  user: null,
  token: null,
  apiBaseUrl: 'http://localhost:8081',
  correlationId: 'standalone-identity',
  navigate: (to: string) => console.log('Navigate to:', to),
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <IdentityModule context={mockContext} />
  </React.StrictMode>
);
