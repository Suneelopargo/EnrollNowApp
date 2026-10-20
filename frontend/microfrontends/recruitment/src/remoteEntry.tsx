// frontend/microfrontends/recruitment/src/remoteEntry.tsx - Recruitment MFE Remote Entry
import React from 'react';
import { MfeContext } from '../../../shared/contracts';
import { PageHeader } from '../../../shared/design-system/components/PageHeader';
import { ComingSoon } from '../../../shared/design-system/components/ComingSoon';
import { Megaphone } from 'lucide-react';

export interface RecruitmentModuleProps {
  context: MfeContext;
}

export const RecruitmentModule: React.FC<RecruitmentModuleProps> = () => {
  return (
    <div>
      <PageHeader
        title="Participant Recruitment & Funnel Management"
        subtitle="Manage recruitment channels, prescreening eligibility funnels, and lead conversion workflows"
      />
      <ComingSoon
        title="Participant Recruitment & Funnel Management"
        subtitle="Manage recruitment channels, prescreening eligibility funnels, and lead conversion workflows"
        description="Recruitment campaign analytics and prescreening funnel tracking are currently in development. No placeholder campaigns or hardcoded conversion numbers are displayed."
        targetRelease="Scheduled Sprint Release"
        icon={Megaphone}
      />
    </div>
  );
};

export default RecruitmentModule;
