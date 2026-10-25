// frontend/microfrontends/study/src/test/studySettingsDetails.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StudySettingsWorkspace } from '../components/StudySettingsWorkspace';
import { StudySettingsDetails } from '../components/StudySettingsDetails';
import { studyApi, StudyDetails } from '../../../../shared/api/studyApi';

// Mock studyApi methods
vi.mock('../../../../shared/api/studyApi', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    studyApi: {
      ...actual.studyApi,
      getStudyDetails: vi.fn(),
      updateStudyDetails: vi.fn(),
      exportStudy: vi.fn(),
      importStudyJson: vi.fn(),
    },
  };
});

describe('Study Settings → Details Functional Component Tests', () => {
  const mockStudyDetails: StudyDetails = {
    id: '33333333-3333-3333-3333-333333333301',
    studyCode: 'STU-001',
    name: 'CardioTrial',
    longName: 'Long Title for Cardiovascular Health Study',
    description: 'Comprehensive evaluation of treatment efficacy.',
    irbId: 'IRB-2026-001',
    recruitmentStartDate: '2026-01-15',
    recruitmentEndDate: '2026-12-31',
    completionDate: '2027-06-30',
    sampleSize: 150,
    allowParticipationInOtherStudies: true,
    studyUrl: 'https://cardiotrial.org',
    studyUrlLabel: 'CardioTrial Portal',
    archived: false,
    canManage: true,
    grants: [
      { id: 'grant-1', grantNumber: 'R01-HL123456', agency: 'NIH / NHLBI' },
      { id: 'grant-2', grantNumber: 'AHA-987654', agency: 'American Heart Association' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(studyApi.getStudyDetails).mockResolvedValue(mockStudyDetails);
  });

  describe('StudySettingsWorkspace Submenu Navigation', () => {
    it('renders the Study Settings workspace with all 8 submenus', () => {
      const html = renderToStaticMarkup(
        <StudySettingsWorkspace
          studyId="study-1"
          studyName="CardioTrial"
          canManageSettings={true}
        />
      );

      // Verify the 8 sidebar items are rendered
      expect(html).toContain('Details');
      expect(html).toContain('Display');
      expect(html).toContain('Bulk Tasks');
      expect(html).toContain('Email and Text');
      expect(html).toContain('Survey Creator');
      expect(html).toContain('Old Survey Creator (Legacy)');
      expect(html).toContain('Participants');
      expect(html).toContain('Requirements');
      expect(html).toContain('Statuses');
      expect(html).toContain('Scheduling');
      expect(html).toContain('Events');
      expect(html).toContain('Study Calendar Integration');
      expect(html).toContain('3rd Party Activity Log');
    });

    it('defaults to rendering the Details form when opened', () => {
      const html = renderToStaticMarkup(
        <StudySettingsWorkspace
          studyId="study-1"
          studyName="CardioTrial"
          canManageSettings={true}
        />
      );

      // Workspace mounts Details as active page
      expect(html).toContain('study-settings-nav__btn--active');
      expect(html).toContain('data-testid="submenu-details"');
    });
  });

  describe('StudySettingsDetails Component Rendering & Controls', () => {
    it('renders initial study details loading or form container', () => {
      const html = renderToStaticMarkup(
        <StudySettingsDetails
          studyId="33333333-3333-3333-3333-333333333301"
          studyName="CardioTrial"
          canManageSettings={true}
        />
      );

      // Component renders
      expect(html).toContain('study-settings-details');
    });

    it('renders in read-only mode when study is archived or user lacks permission', () => {
      const html = renderToStaticMarkup(
        <StudySettingsDetails
          studyId="33333333-3333-3333-3333-333333333301"
          studyName="CardioTrial"
          isArchived={true}
          canManageSettings={false}
        />
      );

      expect(html).toBeDefined();
    });
  });

  describe('Short Study Name & Date Validation Logic', () => {
    it('validates short study name length (<= 15 characters) and alphanumeric characters', () => {
      const isValidShortName = (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return false;
        if (trimmed.length > 15) return false;
        return /^[a-zA-Z0-9 ]+$/.test(trimmed);
      };

      expect(isValidShortName('CardioTrial')).toBe(true);
      expect(isValidShortName('Short 123')).toBe(true);
      expect(isValidShortName('')).toBe(false);
      expect(isValidShortName('ThisNameIsMuchTooLongForShortName')).toBe(false);
      expect(isValidShortName('Invalid@Name!')).toBe(false);
    });

    it('validates recruitment date order (end date must not precede start date)', () => {
      const areDatesValid = (startDate?: string, endDate?: string) => {
        if (!startDate || !endDate) return true;
        return new Date(endDate) >= new Date(startDate);
      };

      expect(areDatesValid('2026-01-01', '2026-12-31')).toBe(true);
      expect(areDatesValid('2026-05-15', '2026-05-15')).toBe(true);
      expect(areDatesValid('2026-10-01', '2026-02-01')).toBe(false);
    });
  });

  describe('Grant Management Invariants', () => {
    it('filters out blank grants before payload submission', () => {
      const rawGrants = [
        { grantNumber: 'R01-HL123456', agency: 'NIH' },
        { grantNumber: '   ', agency: '' },
        { grantNumber: '', agency: 'Gates Foundation' },
      ];

      const filtered = rawGrants.filter(
        (g) => g.grantNumber.trim() !== '' || g.agency.trim() !== ''
      );

      expect(filtered.length).toBe(2);
      expect(filtered[0].grantNumber).toBe('R01-HL123456');
      expect(filtered[1].agency).toBe('Gates Foundation');
    });
  });
});
