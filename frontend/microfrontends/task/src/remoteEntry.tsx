// frontend/microfrontends/task/src/remoteEntry.tsx - Task MFE Remote Entry
import React from 'react';
import { MfeContext } from '../../../shared/contracts';
import { PageHeader } from '../../../shared/design-system/components/PageHeader';
import { ComingSoon } from '../../../shared/design-system/components/ComingSoon';
import { CheckSquare } from 'lucide-react';

export interface TaskModuleProps {
  context: MfeContext;
}

export const TaskModule: React.FC<TaskModuleProps> = () => {
  return (
    <div>
      <PageHeader
        title="Clinical Operations & Task Management"
        subtitle="Manage coordinator workflows, protocol milestones, compliance action items, and task queues"
      />
      <ComingSoon
        title="Clinical Operations & Task Management"
        subtitle="Manage coordinator workflows, protocol milestones, compliance action items, and task queues"
        description="Protocol task management and coordinator action queues are currently in development. No placeholder tasks or hardcoded priority counters are displayed."
        targetRelease="Scheduled Sprint Release"
        icon={CheckSquare}
      />
    </div>
  );
};

export default TaskModule;
