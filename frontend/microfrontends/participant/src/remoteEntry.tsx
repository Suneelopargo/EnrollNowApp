// frontend/microfrontends/participant/src/remoteEntry.tsx - Participant MFE Remote Entry
import React from 'react';
import { MfeContext } from '../../../shared/contracts';
import { PageHeader } from '../../../shared/design-system/components/PageHeader';
import RegistryDashboard from './components/RegistryDashboard';
import './styles/registry.css';

export interface ParticipantModuleProps {
  context: MfeContext;
}

export const ParticipantModule: React.FC<ParticipantModuleProps> = () => {
  return (
    <div className="participant-mfe-container w-full">
      <RegistryDashboard />
    </div>
  );
};

export default ParticipantModule;
