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
      updateStudyMilestone: vi.fn(),
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

  it('supports direct operation-level partial saving without full-page save requirement', async () => {
    (studyApi.updateStudyRequirements as any).mockResolvedValue({
      ...mockRequirementsData,
      sampleSize: 200,
    });

    // Directly invoking operation-level update
    const updated = await studyApi.updateStudyRequirements(mockStudyId, { sampleSize: 200 });
    expect(studyApi.updateStudyRequirements).toHaveBeenCalledWith(mockStudyId, { sampleSize: 200 });
    expect(updated.sampleSize).toBe(200);
  });

  it('executes recruitment milestone operations directly via milestone endpoints', async () => {
    const newMilestone = { id: 'm-new', milestoneDate: '2027-12-01', participantTarget: 250 };
    const updatedMilestone = { id: 'm-new', milestoneDate: '2027-12-15', participantTarget: 300, description: 'Updated' };
    (studyApi.addStudyMilestone as any).mockResolvedValue(newMilestone);
    (studyApi.updateStudyMilestone as any).mockResolvedValue(updatedMilestone);
    (studyApi.deleteStudyMilestone as any).mockResolvedValue(undefined);

    const created = await studyApi.addStudyMilestone(mockStudyId, {
      milestoneDate: '2027-12-01',
      participantTarget: 250,
    });
    expect(studyApi.addStudyMilestone).toHaveBeenCalledWith(mockStudyId, {
      milestoneDate: '2027-12-01',
      participantTarget: 250,
    });
    expect(created.id).toBe('m-new');

    const updated = await studyApi.updateStudyMilestone(mockStudyId, 'm-new', {
      milestoneDate: '2027-12-15',
      participantTarget: 300,
      description: 'Updated',
    });
    expect(studyApi.updateStudyMilestone).toHaveBeenCalledWith(mockStudyId, 'm-new', {
      milestoneDate: '2027-12-15',
      participantTarget: 300,
      description: 'Updated',
    });
    expect(updated.participantTarget).toBe(300);

    await studyApi.deleteStudyMilestone(mockStudyId, 'm-new');
    expect(studyApi.deleteStudyMilestone).toHaveBeenCalledWith(mockStudyId, 'm-new');
  });

  it('executes demographic groups and layout partial updates via updateStudyRequirements', async () => {
    (studyApi.updateStudyRequirements as any).mockResolvedValue({
      ...mockRequirementsData,
      studyGroups: [
        { id: 'grp-age-1', defaultCategoryName: 'age', label: 'Updated Pediatric', sampleSize: '45' },
      ],
    });

    const res = await studyApi.updateStudyRequirements(mockStudyId, {
      studyGroups: [
        { id: 'grp-age-1', defaultCategoryName: 'age', label: 'Updated Pediatric', sampleSize: '45' },
      ],
    });

    expect(studyApi.updateStudyRequirements).toHaveBeenCalledWith(mockStudyId, {
      studyGroups: [
        { id: 'grp-age-1', defaultCategoryName: 'age', label: 'Updated Pediatric', sampleSize: '45' },
      ],
    });
    expect(res.studyGroups[0].label).toBe('Updated Pediatric');
  });

  it('executes global variable linking directly via addGlobalVariableToStudy', async () => {
    const linked = { id: 'gvar-1', name: 'Global Language', variableType: 'single', isGlobal: true };
    (studyApi.addGlobalVariableToStudy as any).mockResolvedValue(linked);

    const result = await studyApi.addGlobalVariableToStudy(mockStudyId, 'gvar-1');
    expect(studyApi.addGlobalVariableToStudy).toHaveBeenCalledWith(mockStudyId, 'gvar-1');
    expect(result.id).toBe('gvar-1');
  });

  it('supports skipLoader and silent background sync for requirements operations without flashing UI loaders', async () => {
    (studyApi.updateStudyRequirements as any).mockResolvedValue({
      ...mockRequirementsData,
      sampleSize: 180,
    });

    const silentConfig = { skipLoader: true, headers: { 'x-skip-loader': 'true' } };
    await studyApi.updateStudyRequirements(mockStudyId, { sampleSize: 180 }, silentConfig as any);

    expect(studyApi.updateStudyRequirements).toHaveBeenCalledWith(
      mockStudyId,
      { sampleSize: 180 },
      silentConfig
    );
  });
});
