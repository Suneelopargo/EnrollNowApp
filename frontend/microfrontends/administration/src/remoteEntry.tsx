// frontend/microfrontends/administration/src/remoteEntry.tsx - Administration MFE Remote Entry
import React from 'react';
import { MfeContext } from '../../../shared/contracts';
import { SiteAdminDashboard } from './components/SiteAdminDashboard';

export interface AdministrationModuleProps {
  context?: MfeContext;
  initialTab?: number | string;
}

export const AdministrationModule: React.FC<AdministrationModuleProps> = ({ context, initialTab }) => {
  return (
    <div className="page-container">
      <SiteAdminDashboard context={context} initialTab={initialTab as any} />
    </div>
  );
};

export default AdministrationModule;
