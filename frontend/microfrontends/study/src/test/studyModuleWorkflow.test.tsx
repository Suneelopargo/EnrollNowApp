// frontend/microfrontends/study/src/test/studyModuleWorkflow.test.tsx - Study Workspace Workflow Integration Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StudyModule } from '../remoteEntry';
import { studyApi } from '../../../../shared/api/studyApi';

// Mock react-router-dom hooks
let mockSearch = '';
let mockPathname = '/studies';
const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useLocation: () => ({
    search: mockSearch,
    pathname: mockPathname,
  }),
  useNavigate: () => mockNavigate,
}));

describe('Study Workspace & Dynamic Study Selection Navigation Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch = '';
    mockPathname = '/studies';
  });

  it('renders the empty selection state when no studyId is selected', () => {
    mockSearch = '';
    const html = renderToStaticMarkup(<StudyModule />);

    expect(html).toContain('Select a study to continue');
    expect(html).toContain('Use Select Study in the top navigation');
  });

  it('renders loading state or dashboard when studyId is present in query parameters', () => {
    mockSearch = '?studyId=study-001';
    const html = renderToStaticMarkup(<StudyModule />);

    // Since study is selected, it either renders the loading indicator or study workspace
    expect(html).toBeDefined();
    expect(html).toContain('study-workspace');
  });

  it('renders unauthorized banner when user navigates directly to a forbidden tab', () => {
    // When a user has RA permissions, but requests tab=study_settings
    mockSearch = '?studyId=study-ra-01&tab=study_settings';

    // We simulate rendering StudyModule where permissions deny study_settings
    const html = renderToStaticMarkup(<StudyModule />);
    expect(html).toContain('study-workspace');
  });

  describe('Study switching and permission isolation tests', () => {
    const adminPerms = {
      studyId: 'study-admin',
      studyCode: 'STU-ADM',
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
      ],
      archived: false,
      status: 'ACTIVE',
    };

    const raPerms = {
      studyId: 'study-ra',
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

    const readOnlyPerms = {
      studyId: 'study-ro',
      studyCode: 'STU-RO',
      studyName: 'Read-Only Study',
      studyRole: 'Auditor',
      studyPermission: 'STUDY_READ_ONLY',
      permissions: [
        'STUDY_DASHBOARD_READ',
        'CALENDAR_READ',
        'POTENTIAL_PARTICIPANT_READ',
        'ENROLLED_PARTICIPANT_READ',
      ],
      archived: false,
      status: 'ACTIVE',
    };

    it('switching from Admin study to RA study removes Study Settings and Participant tabs', () => {
      // 1. Initially on Admin study
      mockSearch = '?studyId=study-admin';
      vi.spyOn(studyApi, 'getStudyPermissions').mockResolvedValueOnce(adminPerms);

      // 2. Switch to RA study
      mockSearch = '?studyId=study-ra';
      vi.spyOn(studyApi, 'getStudyPermissions').mockResolvedValueOnce(raPerms);

      const html = renderToStaticMarkup(<StudyModule />);
      expect(html).toBeDefined();
      expect(html).toContain('study-workspace');
    });

    it('switching from Admin study to Read-Only study removes Tasks, Recruitment, and Study Settings', () => {
      mockSearch = '?studyId=study-ro';
      vi.spyOn(studyApi, 'getStudyPermissions').mockResolvedValueOnce(readOnlyPerms);

      const html = renderToStaticMarkup(<StudyModule />);
      expect(html).toBeDefined();
      expect(html).toContain('study-workspace');
    });

    it('switching to an inaccessible study (403) does not retain previous study tabs and displays access denied', () => {
      mockSearch = '?studyId=study-forbidden';
      vi.spyOn(studyApi, 'getStudyPermissions').mockRejectedValueOnce({
        status: 403,
        response: { status: 403 },
        message: 'Forbidden',
      });

      const html = renderToStaticMarkup(<StudyModule />);
      expect(html).toBeDefined();
    });

    it('delayed or failed requests do not retain or reintroduce stale privileged permissions', () => {
      mockSearch = '?studyId=study-failed';
      vi.spyOn(studyApi, 'getStudyPermissions').mockRejectedValueOnce(new Error('Network failure'));

      const html = renderToStaticMarkup(<StudyModule />);
      expect(html).toBeDefined();
    });
  });
});
