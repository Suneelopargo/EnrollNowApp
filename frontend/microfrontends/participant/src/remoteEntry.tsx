// frontend/microfrontends/participant/src/remoteEntry.tsx - Participant MFE Remote Entry
import React from 'react';
import { MfeContext } from '../../../shared/contracts';
import '../../../shared/design-system/tooltip';
import RegistryDashboard from './components/RegistryDashboard';

export interface ParticipantModuleProps {
  context: MfeContext;
}

export const ParticipantModule: React.FC<ParticipantModuleProps> = ({ context }) => {
  return (
    <div className="page-container">
      <RegistryDashboard context={context} />
    </div>
  );
};

export default ParticipantModule;
