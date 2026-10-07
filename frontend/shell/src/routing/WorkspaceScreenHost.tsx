// frontend/shell/src/routing/WorkspaceScreenHost.tsx - Keep-Alive Multi-Screen Workspace Host
import React from 'react';
import { CircleHelp } from 'lucide-react';
import { useTabWorkspace } from '../navigation/TabWorkspaceContext';
import { LoadingSpinner } from '../../../shared/design-system/components/LoadingSpinner';
import { SUPPORT_KNOWLEDGE_BASE_URL } from '../../../shared/supportLinks';
import {
  DashboardModule,
  StudyModule,
  ParticipantModule,
  RecruitmentModule,
  SurveyModule,
  TaskModule,
  CommunicationModule,
  DocumentModule,
  OrganizationModule,
  AdministrationModule,
} from '../modules';

export const WorkspaceScreenHost: React.FC = () => {
  const { openTabs, activeTabId, isRefreshing } = useTabWorkspace();

  const renderModuleContent = (tabId: string, refreshCount: number) => {
    switch (tabId) {
      case 'dashboard':
        return <DashboardModule key={`dashboard-${refreshCount}`} />;
      case 'studies':
        return <StudyModule key={`studies-${refreshCount}`} />;
      case 'participants':
        return <ParticipantModule key={`participants-${refreshCount}`} />;
      case 'recruitment':
        return <RecruitmentModule key={`recruitment-${refreshCount}`} />;
      case 'surveys':
        return <SurveyModule key={`surveys-${refreshCount}`} />;
      case 'tasks':
        return <TaskModule key={`tasks-${refreshCount}`} />;
      case 'communications':
        return <CommunicationModule key={`communications-${refreshCount}`} />;
      case 'documents':
        return <DocumentModule key={`documents-${refreshCount}`} />;
      case 'organization':
        return <OrganizationModule key={`organization-${refreshCount}`} />;
      case 'admin':
        return <AdministrationModule key={`admin-${refreshCount}`} />;
      default:
        return <DashboardModule key={`default-${refreshCount}`} />;
    }
  };

  const activeTab = openTabs.find((t) => t.id === activeTabId);

  return (
    <div className="enl-workspace-screen-host">
      {/* Fullscreen Overlay Loader when refreshing data */}
      {isRefreshing && (
        <LoadingSpinner
          variant="overlay"
          title="Please Wait "
          message={`Refreshing ${activeTab?.title || 'Screen'} Data...`}
          subtitle="Updating records while preserving your workspace state"
        />
      )}

      {/* Keep-Alive Screen Panes: All open tabs stay mounted in memory */}
      {openTabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            id={`screen-pane-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            className={`enl-screen-pane ${isActive ? 'enl-screen-pane--active' : 'enl-screen-pane--hidden'}`}
          >
            <main className="page-container">
              <div className="page-context-banner">
                <h1>{tab.title}</h1>
                <a
                  href={SUPPORT_KNOWLEDGE_BASE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="page-context-banner__help"
                  title="Open the EnrollNow knowledge base"
                  aria-label="Open the EnrollNow knowledge base"
                >
                  <CircleHelp size={27} strokeWidth={2.5} aria-hidden="true" />
                </a>
              </div>
              {renderModuleContent(tab.id, tab.refreshCount)}
            </main>
          </div>
        );
      })}
    </div>
  );
};

export default WorkspaceScreenHost;
