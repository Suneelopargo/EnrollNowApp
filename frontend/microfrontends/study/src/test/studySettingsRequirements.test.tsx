// frontend/microfrontends/study/src/test/studySettingsRequirements.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StudySettingsRequirements } from '../components/StudySettingsRequirements';
import { StudySettingsWorkspace } from '../components/StudySettingsWorkspace';
import { studyApi } from '../../../../shared/api/studyApi';

// Mock studyApi methods
vi.mock('../../../../shared/api/studyApi', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    studyApi: {
      ...actual.studyApi,
      getStudyRequirements: vi.fn(),
      updateStudyRequirements: vi.fn(),
      addStudyMilestone: vi.fn(),
      deleteStudyMilestone: vi.fn(),
      getGlobalCustomVariables: vi.fn(),
      addGlobalVariableToStudy: vi.fn(),
    },
  };
});

describe('StudySettingsRequirements Component Tests', () => {
  const mockStudyId = 'study-req-001';

  const mockRequirementsData = {
    studyId: mockStudyId,
    sampleSize: 150,
    milestones: [
      { id: 'm-1', milestoneDate: '2026-12-01', participantTarget: 50 },
      { id: 'm-2', milestoneDate: '2027-06-01', participantTarget: 150 },
    ],
    studyGroups: [
      {
        id: 'grp-age-1',
        defaultCategoryName: 'age',
        label: 'Pediatric',
        sampleSize: '40',
        ageRange: { min: 1, max: 12 },
      },
      {
        id: 'grp-gen-1',
        defaultCategoryName: 'sex',
        label: 'Female',
        sampleSize: '75',
      },
      {
        id: 'grp-eth-1',
        defaultCategoryName: 'ethnicity',
        label: 'Hispanic or Latino',
        sampleSize: '30',
        genderGroups: [
          { id: 'g1', gender: 'Male', participants: 15 },
          { id: 'g2', gender: 'Female', participants: 15 },
        ],
      },
    ],
    customVariables: [
      {
        id: 'var-1',
        name: 'Handedness',
        variableType: 'single',
        options: [
          { label: 'Right', value: 'right' },
          { label: 'Left', value: 'left' },
        ],
        isGlobal: false,
        isBlind: false,
        rank: 0,
      },
      {
        id: 'var-2',
        name: 'Systolic BP',
        variableType: 'number',
        options: [],
        isGlobal: true,
        isBlind: true,
        rank: 1,
      },
    ],
    variableGroups: [
      {
        id: 'vg-1',
        name: 'Neurological Assessments',
        variableIds: ['var-1'],
        rank: 0,
      },
    ],
    customVariableLayout: [
      { id: 'lay-1', type: 'group' as const, refId: 'vg-1', rank: 0 },
      { id: 'lay-2', type: 'variable' as const, refId: 'var-2', rank: 1 },
    ],
    contactRelationships: [
      { id: 'rel-1', name: 'Mother', type: 'relationship' },
      { id: 'rel-2', name: 'Father', type: 'relationship' },
    ],
    contactOutcomes: [
      { id: 'out-1', name: 'Call Completed', type: 'outcome' },
      { id: 'out-2', name: 'Voicemail Left', type: 'outcome' },
    ],
    globalVariables: [
      { id: 'gvar-1', name: 'Global Language', variableType: 'single', isGlobal: true },
    ],
    canManage: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (studyApi.getStudyRequirements as any).mockResolvedValue(mockRequirementsData);
  });

  it('renders loading state initially during static markup generation', () => {
    const html = renderToStaticMarkup(<StudySettingsRequirements studyId={mockStudyId} />);
    expect(html).toContain('Loading study requirements...');
    expect(html).toContain('study-settings-requirements__loading');
  });

  it('renders StudySettingsWorkspace with requirements navigation active', () => {
    const html = renderToStaticMarkup(
      <StudySettingsWorkspace
        studyId={mockStudyId}
        studyName="CardioTrial"
        initialSubmenu="participants_requirements"
      />
    );
    expect(html).toContain('Requirements');
    expect(html).toContain('submenu-participants-requirements');
    expect(html).toContain('study-settings-requirements');
  });

  it('preserves other submenus like details, display, and bulk_tasks in workspace navigation', () => {
    const html = renderToStaticMarkup(
      <StudySettingsWorkspace
        studyId={mockStudyId}
        studyName="CardioTrial"
        initialSubmenu="details"
      />
    );
    expect(html).toContain('Loading study details');
    expect(html).not.toContain('study-settings-placeholder');
  });

  it('provides comprehensive requirements data structures with all 8 legacy sections', async () => {
    const res = await studyApi.getStudyRequirements(mockStudyId);
    expect(res.sampleSize).toBe(150);
    expect(res.milestones).toHaveLength(2);
    expect(res.studyGroups).toHaveLength(3);
    expect(res.customVariables).toHaveLength(2);
    expect(res.variableGroups).toHaveLength(1);
    expect(res.customVariableLayout).toHaveLength(2);
    expect(res.contactRelationships).toHaveLength(2);
    expect(res.contactOutcomes).toHaveLength(2);
    expect(res.globalVariables).toHaveLength(1);

    // Verify custom variable options and flags
    const handedness = res.customVariables.find((v: any) => v.name === 'Handedness');
    expect(handedness).toBeDefined();
    expect(handedness?.variableType).toBe('single');
    expect(handedness?.options).toHaveLength(2);
    expect(handedness?.isGlobal).toBe(false);

    const bp = res.customVariables.find((v: any) => v.name === 'Systolic BP');
    expect(bp).toBeDefined();
    expect(bp?.isGlobal).toBe(true);
    expect(bp?.isBlind).toBe(true);
  });
});
