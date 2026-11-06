// frontend/microfrontends/study/src/components/StudyTabPlaceholder.tsx - Placeholder for Future Phases
import React from 'react';
import { StudyTabId, RecruitmentSubTabId, STUDY_TABS, RECRUITMENT_SUB_TABS } from './StudyNavigation';

export interface StudyTabPlaceholderProps {
  tabId: StudyTabId;
  subTab?: RecruitmentSubTabId;
  studyName: string;
}

export const StudyTabPlaceholder: React.FC<StudyTabPlaceholderProps> = ({ tabId, subTab, studyName }) => {
  const tabDef = STUDY_TABS.find((t) => t.id === tabId);
  const subTabDef = subTab ? RECRUITMENT_SUB_TABS.find((s) => s.id === subTab) : null;
  const label = subTabDef ? `Recruitment: ${subTabDef.label}` : tabDef?.label || tabId;

  return (
    <div
      className="study-tab-pane"
      role="tabpanel"
      id={`study-tabpanel-${tabId}`}
      aria-labelledby={`study-tab-${tabId}`}
    >
      <div className="study-tab-placeholder">
        <div className="study-tab-placeholder__header">
          <h2>{label}</h2>
          <span>Study: {studyName}</span>
        </div>
        <div className="study-tab-placeholder__body">
          <p>
            The navigation and access permissions for <strong>{label}</strong> have been verified and established.
          </p>
          <small>Business features for this tab will be implemented in subsequent migration steps.</small>
        </div>
      </div>
    </div>
  );
};

export default StudyTabPlaceholder;
