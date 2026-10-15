import React from 'react';
import ReactDOM from 'react-dom/client';
import IdentityModule from './remoteEntry';
import { getApiBaseUrl } from '../../../shared/api-config';
import { LoaderContainer } from '../../../shared/loader';
import { ToasterContainer } from '../../../shared/toaster';
import '../../../shared/design-system/styles/index.scss';

const mockContext = {
  user: null,
  token: null,
  apiBaseUrl: getApiBaseUrl(),
  correlationId: 'standalone-identity',
  navigate: (to: string) => console.log('Navigate to:', to),
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <IdentityModule context={mockContext} />
    <LoaderContainer />
    <ToasterContainer />
  </React.StrictMode>
);
