// frontend/microfrontends/participant/src/remoteEntry.tsx - Participant MFE Remote Entry
import React from 'react';
import { MfeContext } from '../../../shared/contracts';
import RegistryDashboard from './components/RegistryDashboard';

export interface ParticipantModuleProps {
  context: MfeContext;
}

export const ParticipantModule: React.FC<ParticipantModuleProps> = () => {
  return (
    <div className="page-container">
      <RegistryDashboard />
    </div>
  );
};

export default ParticipantModule;
