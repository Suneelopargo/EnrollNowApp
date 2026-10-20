// frontend/microfrontends/document/src/remoteEntry.tsx - Document MFE Remote Entry
import React from 'react';
import { MfeContext } from '../../../shared/contracts';
import { PageHeader } from '../../../shared/design-system/components/PageHeader';
import { ComingSoon } from '../../../shared/design-system/components/ComingSoon';
import { FileText } from 'lucide-react';

export interface DocumentModuleProps {
  context: MfeContext;
}

export const DocumentModule: React.FC<DocumentModuleProps> = () => {
  return (
    <div>
      <PageHeader
        title="Electronic Trial Master File (eTMF) & Document Repository"
        subtitle="21 CFR Part 11 compliant document management, version control, cryptographic audit logs, and e-signatures"
      />
      <ComingSoon
        title="Electronic Trial Master File (eTMF) & Document Repository"
        subtitle="21 CFR Part 11 compliant document management, version control, cryptographic audit logs, and e-signatures"
        description="Electronic document repository and cryptographic signature workflows are currently in development. No placeholder documents or hardcoded storage metrics are displayed."
        targetRelease="Scheduled Sprint Release"
        icon={FileText}
      />
    </div>
  );
};

export default DocumentModule;
