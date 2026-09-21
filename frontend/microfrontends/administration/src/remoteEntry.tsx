// frontend/microfrontends/administration/src/remoteEntry.tsx - Administration MFE Remote Entry
import React, { useMemo } from 'react';
import {
  Administrator,
  AdministratorProvider,
  AdministratorConfig,
} from '@aiventrahealth/administrator-ui';
import { MfeContext } from '../../../shared/contracts';
import { EnrollNowAdministratorApi } from './api/administratorApi';
import { EnrollNowAdministratorAuthAdapter } from './api/administratorAuthAdapter';

export interface AdministrationModuleProps {
  context: MfeContext;
  initialTab?: number | string;
}

export const defaultAdminConfig: AdministratorConfig = {
  title: 'EnrollNow Administration',
  subtitle: 'Platform Security, Role Entitlement Matrices, and Clinical Site Scopes',
  badgeText: 'EnrollNow Admin',
  features: {
    dashboard: true,
    users: true,
    userManagement: true,
    roles: true,
    rolesAndRbac: true,
    customRoles: true,
    customRoleBuilder: true,
    permissionMatrix: true,
    userRoleAssignment: true,
    locationAccess: true,
    auditTrail: true,
    providerMapping: false,
  },
  terminology: {
    location: 'Research Site',
    locations: 'Research Sites',
    provider: 'Investigator',
    providers: 'Investigators',
    providerCode: 'Investigator ID',
  },
};

export const AdministrationModule: React.FC<AdministrationModuleProps> = ({
  context,
  initialTab,
}) => {
  const api = useMemo(() => new EnrollNowAdministratorApi(context), [context]);
  const auth = useMemo(() => new EnrollNowAdministratorAuthAdapter(context), [context]);

  const config: AdministratorConfig = useMemo(
    () => ({
      ...defaultAdminConfig,
      onNavigate: (path: string) => {
        if (context.navigate) {
          context.navigate(path);
        }
      },
    }),
    [context]
  );

  return (
    <div className="admin-mfe-container">
      <AdministratorProvider api={api} auth={auth} config={config}>
        <Administrator initialTab={initialTab} />
      </AdministratorProvider>
    </div>
  );
};

export default AdministrationModule;
