import React from 'react';
import { Administrator, AdministratorProvider } from '@aiventrahealth/administrator-ui';
import { enrollNowAdministratorApi } from '../../adapters/enrollNowAdministratorApi';
import { enrollNowAdministratorAuthAdapter } from '../../adapters/enrollNowAdministratorAuthAdapter';

export const AdministratorPage: React.FC = () => {
  return (
    <AdministratorProvider
      api={enrollNowAdministratorApi}
      auth={enrollNowAdministratorAuthAdapter}
      config={{
        title: 'EnrollNow Administration',
        features: {
          dashboard: true,
          users: true,
          roles: true,
          locationAccess: true,
          auditTrail: true,
          providerMapping: false,
        },
        terminology: {
          location: 'Site',
          locations: 'Sites',
        },
      }}
    >
      <Administrator />
    </AdministratorProvider>
  );
};

export default AdministratorPage;
