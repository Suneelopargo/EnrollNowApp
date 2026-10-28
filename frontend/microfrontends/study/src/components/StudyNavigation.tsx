// frontend/microfrontends/study/src/components/StudyNavigation.tsx - Legacy-Parity Study Navigation
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Calendar,
  UserCheck,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { StudyNavigationPermissions } from '../../../../shared/api/studyApi';

export type StudyTabId =
  | 'dashboard'
  | 'tasks'
  | 'recruitment'
  | 'calendar'
  | 'potential_participants'
  | 'enrolled_participants'
  | 'study_settings';

export type RecruitmentSubTabId = 'sources' | 'strategies';

export interface StudyTabDefinition {
  id: StudyTabId;
  label: string;
  requiredPermission: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isDropdown?: boolean;
}

export const STUDY_TABS: StudyTabDefinition[] = [
  { id: 'dashboard', label: 'Dashboard', requiredPermission: 'STUDY_DASHBOARD_READ', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', requiredPermission: 'TASK_READ', icon: CheckSquare },
  { id: 'recruitment', label: 'Recruitment', requiredPermission: 'RECRUITMENT_READ', icon: Users, isDropdown: true },
  { id: 'calendar', label: 'Calendar', requiredPermission: 'CALENDAR_READ', icon: Calendar },
  { id: 'potential_participants', label: 'Potential Participants', requiredPermission: 'POTENTIAL_PARTICIPANT_READ', icon: Users },
  { id: 'enrolled_participants', label: 'Enrolled Participants', requiredPermission: 'ENROLLED_PARTICIPANT_READ', icon: UserCheck },
  { id: 'study_settings', label: 'Study Settings', requiredPermission: 'STUDY_SETTINGS_MANAGE', icon: Settings },
];

export const RECRUITMENT_SUB_TABS: { id: RecruitmentSubTabId; label: string }[] = [
  { id: 'sources', label: 'Sources' },
  { id: 'strategies', label: 'Strategies' },
];

export interface StudyNavigationProps {
  permissions: StudyNavigationPermissions;
  activeTab: StudyTabId;
  activeSubTab?: RecruitmentSubTabId;
  onSelectTab: (tabId: StudyTabId, subTab?: RecruitmentSubTabId) => void;
  isParticipantUser?: boolean;
}

/**
 * Evaluates whether a specific tab is authorized for the given study permissions and role.
 * Maps exact legacy Ripple tab visibility rules:
 * - ReadOnly: Dashboard, Calendar, Potential Participants, Enrolled Participants
 * - RA: Dashboard, Tasks, Recruitment, Calendar (No potential/enrolled participants, No study settings)
 * - Leader: Dashboard, Tasks, Recruitment, Calendar, Potential Participants, Enrolled Participants (No study settings)
 * - Admin: All tabs
 */
export function isStudyTabAuthorized(
  tabId: StudyTabId,
  permissions?: StudyNavigationPermissions | null
): boolean {
  if (!permissions) return false;

  const role = (permissions.studyPermission || '').toUpperCase();
  const perms = permissions.permissions;

  const tabDef = STUDY_TABS.find((t) => t.id === tabId);
  if (!tabDef) return false;

  // 1. Explicit permission check: permissions array must be present, non-empty, and include requiredPermission
  if (!Array.isArray(perms) || perms.length === 0 || !perms.includes(tabDef.requiredPermission)) {
    return false;
  }

  // 2. Enforce legacy role-level constraints:
  // - Study Settings: Strictly Admin only (role === 'STUDY_ADMIN')
  if (tabId === 'study_settings') {
    return role === 'STUDY_ADMIN';
  }

  // - RA: Forbidden from seeing Potential and Enrolled participants
  if (role === 'STUDY_RA') {
    if (tabId === 'potential_participants' || tabId === 'enrolled_participants') {
      return false;
    }
  }

  // - ReadOnly: Forbidden from seeing Tasks and Recruitment
  if (role === 'STUDY_READ_ONLY') {
    if (tabId === 'tasks' || tabId === 'recruitment') {
      return false;
    }
  }

  // - Leader: Allowed all tabs except Study Settings (already checked above)
  if (role === 'STUDY_LEADER') {
    return true;
  }

  // - Admin: Allowed all tabs
  if (role === 'STUDY_ADMIN') {
    return true;
  }

  // For any other/unknown study role:
  // Explicit permission check passed and tab is not study_settings
  return true;
}

export const StudyNavigation: React.FC<StudyNavigationProps> = ({
  permissions,
  activeTab,
  activeSubTab,
  onSelectTab,
  isParticipantUser = false,
}) => {
  const [isRecruitmentOpen, setIsRecruitmentOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsRecruitmentOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsRecruitmentOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter visible tabs according to legacy verified rules
  const visibleTabs = STUDY_TABS.filter((tab) => isStudyTabAuthorized(tab.id, permissions));

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (visibleTabs.length === 0) return;
      let nextIndex = -1;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextIndex = (index + 1) % visibleTabs.length;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nextIndex = (index - 1 + visibleTabs.length) % visibleTabs.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = visibleTabs.length - 1;
      }

      if (nextIndex >= 0) {
        const nextTab = visibleTabs[nextIndex];
        const btn = tabRefs.current[nextTab.id];
        if (btn) {
          btn.focus();
        }
        onSelectTab(nextTab.id);
      }
    },
    [visibleTabs, onSelectTab]
  );

  if (isParticipantUser || permissions?.isParticipantUser) {
    return null;
  }

  return (
    <nav className="study-navigation" aria-label="Study Navigation">
      <div className="study-navigation__tabs" role="tablist" aria-orientation="horizontal">
        {visibleTabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          if (tab.isDropdown) {
            return (
              <div
                key={tab.id}
                className="study-navigation__dropdown-wrap"
                ref={dropdownRef}
              >
                <button
                  type="button"
                  role="tab"
                  id={`study-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`study-tabpanel-${tab.id}`}
                  aria-haspopup="menu"
                  aria-expanded={isRecruitmentOpen}
                  tabIndex={isActive ? 0 : -1}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  className={`study-navigation__tab-btn ${isActive ? 'is-active' : ''}`}
                  onClick={() => {
                    onSelectTab(tab.id);
                    setIsRecruitmentOpen((prev) => !prev);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                >
                  <Icon size={15} aria-hidden="true" />
                  <span>{tab.label}</span>
                  <ChevronDown size={13} className={`study-navigation__caret ${isRecruitmentOpen ? 'is-open' : ''}`} />
                </button>

                {isRecruitmentOpen && (
                  <div
                    className="study-navigation__dropdown-menu"
                    role="menu"
                    aria-labelledby={`study-tab-${tab.id}`}
                  >
                    {RECRUITMENT_SUB_TABS.map((subTab) => {
                      const isSubActive = isActive && activeSubTab === subTab.id;
                      return (
                        <button
                          key={subTab.id}
                          type="button"
                          role="menuitem"
                          className={`study-navigation__dropdown-item ${isSubActive ? 'is-active' : ''}`}
                          onClick={() => {
                            setIsRecruitmentOpen(false);
                            onSelectTab('recruitment', subTab.id);
                          }}
                        >
                          {subTab.label.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`study-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`study-tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              className={`study-navigation__tab-btn ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelectTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              <Icon size={15} aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default StudyNavigation;
