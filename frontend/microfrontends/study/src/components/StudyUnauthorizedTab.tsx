// frontend/microfrontends/study/src/components/StudyUnauthorizedTab.tsx - Unauthorized Tab Access Alert
import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { StudyTabId, STUDY_TABS } from './StudyNavigation';

export interface StudyUnauthorizedTabProps {
  tabId: StudyTabId;
  studyName: string;
  onGoToDashboard: () => void;
}

export const StudyUnauthorizedTab: React.FC<StudyUnauthorizedTabProps> = ({
  tabId,
  studyName,
  onGoToDashboard,
}) => {
  const tabDef = STUDY_TABS.find((t) => t.id === tabId);
  const tabName = tabDef?.label || tabId;

  return (
    <div
      className="study-tab-pane"
      role="tabpanel"
      id={`study-tabpanel-${tabId}`}
      aria-labelledby={`study-tab-${tabId}`}
    >
      <div className="study-unauthorized-banner" role="alert">
        <div className="study-unauthorized-banner__icon">
          <ShieldAlert size={24} />
        </div>
        <div className="study-unauthorized-banner__content">
          <h3>Permission Denied</h3>
          <p>
            Error: You do not have permission to view <strong>{tabName}</strong> in <em>{studyName}</em>.
          </p>
          <button
            type="button"
            className="study-unauthorized-banner__action"
            onClick={onGoToDashboard}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudyUnauthorizedTab;
