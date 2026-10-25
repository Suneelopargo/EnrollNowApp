// frontend/microfrontends/study/src/test/studyNavigation.test.tsx - Study Navigation & Conditional Tab Visibility Tests
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  StudyNavigation,
  isStudyTabAuthorized,
  STUDY_TABS,
  StudyTabId,
} from '../components/StudyNavigation';
import { StudyNavigationPermissions } from '../../../../shared/api/studyApi';

describe('Study Tab Navigation & Conditional Tab Visibility (Legacy Ripple Rules)', () => {
  const adminPermissions: StudyNavigationPermissions = {
    studyId: '11111111-1111-1111-1111-111111111111',
    studyCode: 'STU-ADMIN',
    studyName: 'Admin Study',
    studyRole: 'Study Admin',
    studyPermission: 'STUDY_ADMIN',
    permissions: [
      'STUDY_DASHBOARD_READ',
      'TASK_READ',
      'RECRUITMENT_READ',
      'RECRUITMENT_MANAGE',
      'CALENDAR_READ',
      'POTENTIAL_PARTICIPANT_READ',
      'POTENTIAL_PARTICIPANT_MANAGE',
      'ENROLLED_PARTICIPANT_READ',
      'ENROLLED_PARTICIPANT_MANAGE',
      'STUDY_SETTINGS_MANAGE',
      'REPORT_READ',
      'PHI_READ',
    ],
    archived: false,
    status: 'ACTIVE',
  };

  const leaderPermissions: StudyNavigationPermissions = {
    studyId: '22222222-2222-2222-2222-222222222222',
    studyCode: 'STU-LEAD',
    studyName: 'Leader Study',
    studyRole: 'Study Leader',
    studyPermission: 'STUDY_LEADER',
    permissions: [
      'STUDY_DASHBOARD_READ',
      'TASK_READ',
      'RECRUITMENT_READ',
      'RECRUITMENT_MANAGE',
      'CALENDAR_READ',
      'POTENTIAL_PARTICIPANT_READ',
      'POTENTIAL_PARTICIPANT_MANAGE',
      'ENROLLED_PARTICIPANT_READ',
      'ENROLLED_PARTICIPANT_MANAGE',
      'PHI_READ',
    ],
    archived: false,
    status: 'ACTIVE',
  };

  const raPermissions: StudyNavigationPermissions = {
    studyId: '33333333-3333-3333-3333-333333333333',
    studyCode: 'STU-RA',
    studyName: 'RA Study',
    studyRole: 'Research Assistant',
    studyPermission: 'STUDY_RA',
    permissions: [
      'STUDY_DASHBOARD_READ',
      'TASK_READ',
      'RECRUITMENT_READ',
      'CALENDAR_READ',
    ],
    archived: false,
    status: 'ACTIVE',
  };

  const readOnlyPermissions: StudyNavigationPermissions = {
    studyId: '44444444-4444-4444-4444-444444444444',
    studyCode: 'STU-RO',
    studyName: 'Read-Only Study',
    studyRole: 'Auditor',
    studyPermission: 'STUDY_READ_ONLY',
    permissions: [
      'STUDY_DASHBOARD_READ',
      'CALENDAR_READ',
      'POTENTIAL_PARTICIPANT_READ',
      'ENROLLED_PARTICIPANT_READ',
      'REPORT_READ',
      'PHI_READ',
    ],
    archived: false,
    status: 'ACTIVE',
  };

  describe('isStudyTabAuthorized rule engine', () => {
    it('authorizes all 7 tabs for STUDY_ADMIN', () => {
      const allTabs: StudyTabId[] = [
        'dashboard',
        'tasks',
        'recruitment',
        'calendar',
        'potential_participants',
        'enrolled_participants',
        'study_settings',
      ];
      allTabs.forEach((tab) => {
        expect(isStudyTabAuthorized(tab, adminPermissions)).toBe(true);
      });
    });

    it('authorizes 6 tabs for STUDY_LEADER and strictly hides Study Settings', () => {
      expect(isStudyTabAuthorized('dashboard', leaderPermissions)).toBe(true);
      expect(isStudyTabAuthorized('tasks', leaderPermissions)).toBe(true);
      expect(isStudyTabAuthorized('recruitment', leaderPermissions)).toBe(true);
      expect(isStudyTabAuthorized('calendar', leaderPermissions)).toBe(true);
      expect(isStudyTabAuthorized('potential_participants', leaderPermissions)).toBe(true);
      expect(isStudyTabAuthorized('enrolled_participants', leaderPermissions)).toBe(true);
      // Study settings must be hidden
      expect(isStudyTabAuthorized('study_settings', leaderPermissions)).toBe(false);
    });

    it('authorizes exactly Dashboard, Tasks, Recruitment, Calendar for STUDY_RA (Hides Participants and Study Settings)', () => {
      expect(isStudyTabAuthorized('dashboard', raPermissions)).toBe(true);
      expect(isStudyTabAuthorized('tasks', raPermissions)).toBe(true);
      expect(isStudyTabAuthorized('recruitment', raPermissions)).toBe(true);
      expect(isStudyTabAuthorized('calendar', raPermissions)).toBe(true);
      // Strict legacy rule: RA cannot view potential or enrolled participants, nor study settings
      expect(isStudyTabAuthorized('potential_participants', raPermissions)).toBe(false);
      expect(isStudyTabAuthorized('enrolled_participants', raPermissions)).toBe(false);
      expect(isStudyTabAuthorized('study_settings', raPermissions)).toBe(false);
    });

    it('authorizes Dashboard, Calendar, Potential and Enrolled Participants for STUDY_READ_ONLY (Hides Tasks, Recruitment, Settings)', () => {
      expect(isStudyTabAuthorized('dashboard', readOnlyPermissions)).toBe(true);
      expect(isStudyTabAuthorized('calendar', readOnlyPermissions)).toBe(true);
      expect(isStudyTabAuthorized('potential_participants', readOnlyPermissions)).toBe(true);
      expect(isStudyTabAuthorized('enrolled_participants', readOnlyPermissions)).toBe(true);
      // Strict legacy rule: ReadOnly has no write/task/recruitment/settings access
      expect(isStudyTabAuthorized('tasks', readOnlyPermissions)).toBe(false);
      expect(isStudyTabAuthorized('recruitment', readOnlyPermissions)).toBe(false);
      expect(isStudyTabAuthorized('study_settings', readOnlyPermissions)).toBe(false);
    });

    it('denies access if permissions object is null or undefined', () => {
      expect(isStudyTabAuthorized('dashboard', null)).toBe(false);
      expect(isStudyTabAuthorized('dashboard', undefined)).toBe(false);
    });
  });

  describe('StudyNavigation component rendering', () => {
    it('renders all 7 top-level tabs for STUDY_ADMIN', () => {
      const html = renderToStaticMarkup(
        <StudyNavigation
          permissions={adminPermissions}
          activeTab="dashboard"
          onSelectTab={vi.fn()}
        />
      );

      expect(html).toContain('Dashboard');
      expect(html).toContain('Tasks');
      expect(html).toContain('Recruitment');
      expect(html).toContain('Calendar');
      expect(html).toContain('Potential Participants');
      expect(html).toContain('Enrolled Participants');
      expect(html).toContain('Study Settings');
    });

    it('renders 6 tabs for STUDY_LEADER, omitting Study Settings', () => {
      const html = renderToStaticMarkup(
        <StudyNavigation
          permissions={leaderPermissions}
          activeTab="dashboard"
          onSelectTab={vi.fn()}
        />
      );

      expect(html).toContain('Dashboard');
      expect(html).toContain('Tasks');
      expect(html).toContain('Recruitment');
      expect(html).toContain('Calendar');
      expect(html).toContain('Potential Participants');
      expect(html).toContain('Enrolled Participants');
      expect(html).not.toContain('Study Settings');
    });

    it('renders 4 tabs for STUDY_RA, omitting Participants and Study Settings', () => {
      const html = renderToStaticMarkup(
        <StudyNavigation
          permissions={raPermissions}
          activeTab="dashboard"
          onSelectTab={vi.fn()}
        />
      );

      expect(html).toContain('Dashboard');
      expect(html).toContain('Tasks');
      expect(html).toContain('Recruitment');
      expect(html).toContain('Calendar');
      expect(html).not.toContain('Potential Participants');
      expect(html).not.toContain('Enrolled Participants');
      expect(html).not.toContain('Study Settings');
    });

    it('renders 4 tabs for STUDY_READ_ONLY, omitting Tasks, Recruitment, and Study Settings', () => {
      const html = renderToStaticMarkup(
        <StudyNavigation
          permissions={readOnlyPermissions}
          activeTab="dashboard"
          onSelectTab={vi.fn()}
        />
      );

      expect(html).toContain('Dashboard');
      expect(html).toContain('Calendar');
      expect(html).toContain('Potential Participants');
      expect(html).toContain('Enrolled Participants');
      expect(html).not.toContain('Tasks');
      expect(html).not.toContain('Recruitment');
      expect(html).not.toContain('Study Settings');
    });

    it('highlights the active tab with aria-selected="true" and is-active class', () => {
      const html = renderToStaticMarkup(
        <StudyNavigation
          permissions={adminPermissions}
          activeTab="calendar"
          onSelectTab={vi.fn()}
        />
      );

      expect(html).toContain('id="study-tab-calendar"');
      expect(html).toContain('aria-selected="true"');
      expect(html).toContain('class="study-navigation__tab-btn is-active"');
    });

    it('renders nothing for a participant portal user (isParticipantUser = true)', () => {
      const html = renderToStaticMarkup(
        <StudyNavigation
          permissions={adminPermissions}
          activeTab="dashboard"
          onSelectTab={vi.fn()}
          isParticipantUser={true}
        />
      );

      expect(html).toBe('');
    });
  });
});
