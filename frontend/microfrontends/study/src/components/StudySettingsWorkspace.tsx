// frontend/microfrontends/study/src/components/StudySettingsWorkspace.tsx
import React, { useState } from 'react';
import { StudySettingsDetails } from './StudySettingsDetails';
import { StudySettingsDisplay } from './StudySettingsDisplay';
import { StudySettingsBulkTasks } from './StudySettingsBulkTasks';
import { StudySettingsEmailAndText } from './StudySettingsEmailAndText';
import { StudySettingsRequirements } from './StudySettingsRequirements';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';

export interface StudySettingsWorkspaceProps {
  studyId: string;
  studyName: string;
  isArchived?: boolean;
  canManageSettings?: boolean;
  initialSubmenu?: StudySettingsSubmenuId;
  onStudyUpdated?: () => void;
}

export type StudySettingsSubmenuId =
  | 'details'
  | 'display'
  | 'bulk_tasks'
  | 'email_and_text'
  | 'survey_creator'
  | 'old_survey_creator'
  | 'participants_requirements'
  | 'participants_statuses'
  | 'scheduling_events'
  | 'scheduling_calendar'
  | 'scheduling_activity_log';

export const StudySettingsWorkspace: React.FC<StudySettingsWorkspaceProps> = ({
  studyId,
  studyName,
  isArchived = false,
  canManageSettings = true,
  initialSubmenu = 'details',
  onStudyUpdated,
}) => {
  const [activeSubmenu, setActiveSubmenu] = useState<StudySettingsSubmenuId>(initialSubmenu);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(true);
  const [isSchedulingOpen, setIsSchedulingOpen] = useState(true);
  const [isDetailsDirty, setIsDetailsDirty] = useState(false);
  const [isRequirementsDirty, setIsRequirementsDirty] = useState(false);

  const handleSubmenuSelect = (target: StudySettingsSubmenuId) => {
    if (target === activeSubmenu) return;
    if (activeSubmenu === 'details' && isDetailsDirty) {
      const proceed = window.confirm(
        'You have unsaved changes in Study Details. Are you sure you want to discard your changes and leave?'
      );
      if (!proceed) return;
    }
    if (activeSubmenu === 'participants_requirements' && isRequirementsDirty) {
      const proceed = window.confirm(
        'You have unsaved changes in Study Requirements. Are you sure you want to discard your changes and leave?'
      );
      if (!proceed) return;
    }
    setActiveSubmenu(target);
  };

  return (
    <div className="study-settings-workspace" data-testid="study-settings-workspace">
      {/* Sidebar Subnavigation matching Ripple Image 3 */}
      <aside className="study-settings-sidebar" aria-label="Study Settings Submenu">
        <nav className="study-settings-nav">
          <ul className="study-settings-nav__list">
            {/* 1. Details */}
            <li className="study-settings-nav__item">
              <button
                type="button"
                className={`study-settings-nav__btn ${activeSubmenu === 'details' ? 'study-settings-nav__btn--active' : ''}`}
                onClick={() => handleSubmenuSelect('details')}
                aria-current={activeSubmenu === 'details' ? 'page' : undefined}
                data-testid="submenu-details"
              >
                <span>Details</span>
              </button>
            </li>

            {/* 2. Display */}
            <li className="study-settings-nav__item">
              <button
                type="button"
                className={`study-settings-nav__btn ${activeSubmenu === 'display' ? 'study-settings-nav__btn--active' : ''}`}
                onClick={() => handleSubmenuSelect('display')}
                aria-current={activeSubmenu === 'display' ? 'page' : undefined}
                data-testid="submenu-display"
              >
                <span>Display</span>
              </button>
            </li>

            {/* 3. Bulk Tasks */}
            <li className="study-settings-nav__item">
              <button
                type="button"
                className={`study-settings-nav__btn ${activeSubmenu === 'bulk_tasks' ? 'study-settings-nav__btn--active' : ''}`}
                onClick={() => handleSubmenuSelect('bulk_tasks')}
                aria-current={activeSubmenu === 'bulk_tasks' ? 'page' : undefined}
                data-testid="submenu-bulk-tasks"
              >
                <span>Bulk Tasks</span>
              </button>
            </li>

            {/* 4. Email and Text */}
            <li className="study-settings-nav__item">
              <button
                type="button"
                className={`study-settings-nav__btn ${activeSubmenu === 'email_and_text' ? 'study-settings-nav__btn--active' : ''}`}
                onClick={() => handleSubmenuSelect('email_and_text')}
                aria-current={activeSubmenu === 'email_and_text' ? 'page' : undefined}
                data-testid="submenu-email-and-text"
              >
                <span>Email and Text</span>
              </button>
            </li>

            {/* 5. Survey Creator */}
            <li className="study-settings-nav__item">
              <button
                type="button"
                className={`study-settings-nav__btn ${activeSubmenu === 'survey_creator' ? 'study-settings-nav__btn--active' : ''}`}
                onClick={() => handleSubmenuSelect('survey_creator')}
                aria-current={activeSubmenu === 'survey_creator' ? 'page' : undefined}
                data-testid="submenu-survey-creator"
              >
                <span>Survey Creator</span>
              </button>
            </li>

            {/* 6. Old Survey Creator (Legacy) */}
            <li className="study-settings-nav__item">
              <button
                type="button"
                className={`study-settings-nav__btn ${activeSubmenu === 'old_survey_creator' ? 'study-settings-nav__btn--active' : ''}`}
                onClick={() => handleSubmenuSelect('old_survey_creator')}
                aria-current={activeSubmenu === 'old_survey_creator' ? 'page' : undefined}
                data-testid="submenu-old-survey-creator"
              >
                <span>Old Survey Creator (Legacy)</span>
              </button>
            </li>

            {/* 7. Participants Group */}
            <li className="study-settings-nav__group">
              <button
                type="button"
                className="study-settings-nav__group-toggle"
                onClick={() => setIsParticipantsOpen((prev) => !prev)}
                aria-expanded={isParticipantsOpen}
              >
                {isParticipantsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>Participants</span>
              </button>

              {isParticipantsOpen && (
                <ul className="study-settings-nav__sublist">
                  <li>
                    <button
                      type="button"
                      className={`study-settings-nav__subbtn ${activeSubmenu === 'participants_requirements' ? 'study-settings-nav__subbtn--active' : ''}`}
                      onClick={() => handleSubmenuSelect('participants_requirements')}
                      aria-current={activeSubmenu === 'participants_requirements' ? 'page' : undefined}
                      data-testid="submenu-participants-requirements"
                    >
                      <span>Requirements</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={`study-settings-nav__subbtn ${activeSubmenu === 'participants_statuses' ? 'study-settings-nav__subbtn--active' : ''}`}
                      onClick={() => handleSubmenuSelect('participants_statuses')}
                      aria-current={activeSubmenu === 'participants_statuses' ? 'page' : undefined}
                      data-testid="submenu-participants-statuses"
                    >
                      <span>Statuses</span>
                    </button>
                  </li>
                </ul>
              )}
            </li>

            {/* 8. Scheduling Group */}
            <li className="study-settings-nav__group">
              <button
                type="button"
                className="study-settings-nav__group-toggle"
                onClick={() => setIsSchedulingOpen((prev) => !prev)}
                aria-expanded={isSchedulingOpen}
              >
                {isSchedulingOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>Scheduling</span>
              </button>

              {isSchedulingOpen && (
                <ul className="study-settings-nav__sublist">
                  <li>
                    <button
                      type="button"
                      className={`study-settings-nav__subbtn ${activeSubmenu === 'scheduling_events' ? 'study-settings-nav__subbtn--active' : ''}`}
                      onClick={() => handleSubmenuSelect('scheduling_events')}
                      aria-current={activeSubmenu === 'scheduling_events' ? 'page' : undefined}
                      data-testid="submenu-scheduling-events"
                    >
                      <span>Events</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={`study-settings-nav__subbtn ${activeSubmenu === 'scheduling_calendar' ? 'study-settings-nav__subbtn--active' : ''}`}
                      onClick={() => handleSubmenuSelect('scheduling_calendar')}
                      aria-current={activeSubmenu === 'scheduling_calendar' ? 'page' : undefined}
                      data-testid="submenu-scheduling-calendar"
                    >
                      <span>Study Calendar Integration</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={`study-settings-nav__subbtn ${activeSubmenu === 'scheduling_activity_log' ? 'study-settings-nav__subbtn--active' : ''}`}
                      onClick={() => handleSubmenuSelect('scheduling_activity_log')}
                      aria-current={activeSubmenu === 'scheduling_activity_log' ? 'page' : undefined}
                      data-testid="submenu-scheduling-activity-log"
                    >
                      <span>3rd Party Activity Log</span>
                    </button>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Workspace Content Area */}
      <main className="study-settings-content" id="study-settings-main-content">
        {activeSubmenu === 'details' ? (
          <StudySettingsDetails
            studyId={studyId}
            studyName={studyName}
            isArchived={isArchived}
            canManageSettings={canManageSettings}
            onStudyUpdated={onStudyUpdated}
            onDirtyChange={(dirty) => setIsDetailsDirty(dirty)}
          />
        ) : activeSubmenu === 'display' ? (
          <StudySettingsDisplay
            studyId={studyId}
            studyName={studyName}
            isArchived={isArchived}
            canManageSettings={canManageSettings}
            onStudyUpdated={onStudyUpdated}
          />
        ) : activeSubmenu === 'bulk_tasks' ? (
          <StudySettingsBulkTasks
            studyId={studyId}
            studyName={studyName}
            isArchived={isArchived}
            canManageSettings={canManageSettings}
            onStudyUpdated={onStudyUpdated}
          />
        ) : activeSubmenu === 'email_and_text' ? (
          <StudySettingsEmailAndText
            studyId={studyId}
            studyName={studyName}
            isArchived={isArchived}
            canManageSettings={canManageSettings}
            onStudyUpdated={onStudyUpdated}
          />
        ) : activeSubmenu === 'participants_requirements' ? (
          <StudySettingsRequirements
            studyId={studyId}
            studyName={studyName}
            isArchived={isArchived}
            canManageSettings={canManageSettings}
            onStudyUpdated={onStudyUpdated}
            onDirtyChange={(dirty) => setIsRequirementsDirty(dirty)}
          />
        ) : (
          <div className="study-settings-placeholder" role="region" aria-label="Submenu coming soon">
            <div className="study-settings-placeholder__icon">
              <Info size={22} />
            </div>
            <h3 className="study-settings-placeholder__title">
              {activeSubmenu.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </h3>
            <p className="study-settings-placeholder__message">
              This Study Settings section is scheduled for complete migration in an upcoming phase.
              Please use the <strong>Details</strong> submenu to configure this study protocol.
            </p>
            <button
              type="button"
              className="study-settings-btn study-settings-btn--primary"
              onClick={() => handleSubmenuSelect('details')}
            >
              Back to Details
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudySettingsWorkspace;
