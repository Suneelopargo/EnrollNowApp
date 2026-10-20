// frontend/microfrontends/communication/src/remoteEntry.tsx - Communication MFE Remote Entry
import React from 'react';
import { MfeContext } from '../../../shared/contracts';
import { PageHeader } from '../../../shared/design-system/components/PageHeader';
import { ComingSoon } from '../../../shared/design-system/components/ComingSoon';
import { MessageSquare } from 'lucide-react';

export interface CommunicationModuleProps {
  context: MfeContext;
}

export const CommunicationModule: React.FC<CommunicationModuleProps> = () => {
  return (
    <div>
      <PageHeader
        title="Participant Communications & Outreach Hub"
        subtitle="Automate participant notifications, multi-channel reminders, broadcast alerts, and engagement logs"
      />
      <ComingSoon
        title="Participant Communications & Outreach Hub"
        subtitle="Automate participant notifications, multi-channel reminders, broadcast alerts, and engagement logs"
        description="Multi-channel messaging integration (SMS, Email, Broadcast alerts) is currently in development. No placeholder communication records or hardcoded statistics are displayed."
        targetRelease="Scheduled Sprint Release"
        icon={MessageSquare}
      />
    </div>
  );
};

export default CommunicationModule;
