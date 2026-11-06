// frontend/microfrontends/study/src/test/studySettingsDisplayAndBulkTasks.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StudySettingsWorkspace } from '../components/StudySettingsWorkspace';
import { StudySettingsDisplay, formatLocaleSampleDate } from '../components/StudySettingsDisplay';
import { StudySettingsBulkTasks } from '../components/StudySettingsBulkTasks';
import {
  addColumn,
  removeColumn,
  replaceColumn,
  buildBulkTaskGroupPayload,
  validateTaskName,
  moveTask,
  resolveAssigneeNames,
  toggleAssignee,
  triggerActionLabel,
  MIN_COLUMN_MESSAGE,
} from '../components/studySettingsDisplayBulkTasksLogic';
import {
  studyApi,
  StudyDisplaySettings,
  StudyBulkTasksData,
  ParticipantColumn,
  BulkTask,
  BulkTaskTeamMember,
} from '../../../../shared/api/studyApi';

vi.mock('../../../../shared/api/studyApi', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    studyApi: {
      ...actual.studyApi,
      getStudyDetails: vi.fn(),
      getStudyDisplaySettings: vi.fn(),
      updateStudyDisplaySettings: vi.fn(),
      getStudyBulkTasks: vi.fn(),
      createBulkTaskGroup: vi.fn(),
      updateBulkTaskGroup: vi.fn(),
      deleteBulkTaskGroup: vi.fn(),
      createBulkTask: vi.fn(),
      updateBulkTask: vi.fn(),
      deleteBulkTask: vi.fn(),
      reorderBulkTasks: vi.fn(),
    },
  };
});

describe('Study Settings → Display and Bulk Tasks Migration Tests', () => {
  const mockDisplayData: StudyDisplaySettings = {
    studyId: 'study-123',
    locale: 'en-US',
    showGlobalComments: false,
    defaultGlobalLogs: false,
    statusPageCombinedView: false,
    enrolledParticipantColumnsShowEvents: true,
    potentialParticipantColumns: [
      { label: 'ID', value: 'psi.customId' },
      { label: 'Name', value: 'p.name' },
      { label: 'Next Appointment', value: 'a.next_appointment', title: 'Shows next chronological date' },
      { label: 'Contact Info', value: 'cm.information' },
      { label: 'Last Contact', value: 'psi.lastContactDate' },
      { label: 'Recruitment Source', value: 'psi.sourceId' },
    ],
    enrolledParticipantColumns: [
      { label: 'ID', value: 'psi.customId' },
      { label: 'Name', value: 'p.name' },
      { label: 'Next Appointment', value: 'a.next_appointment', title: 'Shows next chronological date' },
    ],
    availableColumnOptions: [
      { label: 'ID', value: 'psi.customId' },
      { label: 'Name', value: 'p.name' },
      { label: 'Next Appointment', value: 'a.next_appointment', title: 'Shows next chronological date' },
      { label: 'Contact Info', value: 'cm.information' },
      { label: 'Last Contact', value: 'psi.lastContactDate' },
      { label: 'Recruitment Source', value: 'psi.sourceId' },
      { label: 'Biomarker Status', value: 'cv.biomarker_status', cId: 'cv-1' },
    ],
    supportedLocales: [
      { value: 'en-US', label: 'English - United States' },
      { value: 'es-ES', label: 'Spanish - Spain' },
      { value: 'fr-FR', label: 'French - France' },
      { value: 'de-DE', label: 'German - Germany' },
    ],
    canManage: true,
  };

  const mockBulkTasksData: StudyBulkTasksData = {
    studyId: 'study-123',
    canManage: true,
    bulkTaskGroups: [
      {
        _id: 'group-1',
        studyId: 'study-123',
        name: 'Screening Follow-up Group',
        description: 'Standard screening checklist',
        triggerActive: true,
        trigger: { eventId: 'event-1', action: 'completed' },
        tasks: [
          {
            _id: 'task-1',
            bulkTaskGroupId: 'group-1',
            name: 'Verify Lab Reports',
            description: 'Check chemistry and CBC',
            assignedTo: ['user-1'],
            assignedToInitials: 'JD',
            rank: 0,
          },
          {
            _id: 'task-2',
            bulkTaskGroupId: 'group-1',
            name: 'Schedule Baseline MRI',
            description: 'Notify imaging facility',
            assignedTo: ['user-2'],
            assignedToInitials: 'AS',
            rank: 1,
          },
        ],
      },
    ],
    bulkTasks: [
      {
        _id: 'task-1',
        bulkTaskGroupId: 'group-1',
        name: 'Verify Lab Reports',
        description: 'Check chemistry and CBC',
        assignedTo: ['user-1'],
        assignedToInitials: 'JD',
        rank: 0,
      },
      {
        _id: 'task-2',
        bulkTaskGroupId: 'group-1',
        name: 'Schedule Baseline MRI',
        description: 'Notify imaging facility',
        assignedTo: ['user-2'],
        assignedToInitials: 'AS',
        rank: 1,
      },
    ],
    events: [
      { _id: 'event-1', name: 'Consent Visit' },
      { _id: 'event-2', name: 'Baseline Visit' },
    ],
    teamMembers: [
      { userId: 'user-1', name: 'John Doe', email: 'jdoe@example.com', initials: 'JD', role: 'STUDY_ADMIN' },
      { userId: 'user-2', name: 'Alice Smith', email: 'asmith@example.com', initials: 'AS', role: 'COORDINATOR' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(studyApi.getStudyDisplaySettings).mockResolvedValue(mockDisplayData);
    vi.mocked(studyApi.getStudyBulkTasks).mockResolvedValue(mockBulkTasksData);
  });

  describe('Submenu Navigation in Workspace', () => {
    it('renders the workspace with Display and Bulk Tasks in the sidebar nav', () => {
      const html = renderToStaticMarkup(
        <StudySettingsWorkspace
          studyId="study-123"
          studyName="Trial A"
          canManageSettings={true}
        />
      );

      expect(html).toContain('data-testid="submenu-display"');
      expect(html).toContain('data-testid="submenu-bulk-tasks"');
      expect(html).toContain('Display');
      expect(html).toContain('Bulk Tasks');
    });
  });

  describe('Display Settings Component & Logic', () => {
    it('formats sample date and placeholder accurately for diverse locales', () => {
      const enUS = formatLocaleSampleDate('en-US');
      expect(enUS.placeholder).toContain('MM');
      expect(enUS.placeholder).toContain('DD');
      expect(enUS.placeholder).toContain('YYYY');

      const deDE = formatLocaleSampleDate('de-DE');
      expect(deDE.placeholder).toBeDefined();

      const fallback = formatLocaleSampleDate('invalid-locale-code-xyz');
      expect(fallback.placeholder).toBeDefined();
    });

    it('enforces minimum 1 column guard when removing potential or enrolled columns', () => {
      const initialTwo: ParticipantColumn[] = [
        { label: 'ID', value: 'psi.customId' },
        { label: 'Name', value: 'p.name' },
      ];

      // Remove one when 2 remain -> success
      const result1 = removeColumn(initialTwo, 1);
      expect(result1.error).toBeNull();
      expect(result1.columns).toHaveLength(1);
      expect(result1.columns[0].value).toBe('psi.customId');

      // Remove when only 1 remains -> blocked with exact Ripple warning message
      const result2 = removeColumn(result1.columns, 0);
      expect(result2.error).toBe(MIN_COLUMN_MESSAGE);
      expect(result2.columns).toHaveLength(1);
    });

    it('adds the first available option when adding a column', () => {
      const current: ParticipantColumn[] = [{ label: 'ID', value: 'psi.customId' }];
      const options: ParticipantColumn[] = [
        { label: 'Custom ID', value: 'psi.customId' },
        { label: 'Name', value: 'p.name' },
      ];

      const next = addColumn(current, options);
      expect(next).toHaveLength(2);
      expect(next[1].value).toBe('psi.customId');
    });

    it('replaces a column at index correctly while preserving metadata', () => {
      const current: ParticipantColumn[] = [
        { label: 'ID', value: 'psi.customId' },
        { label: 'Name', value: 'p.name' },
      ];
      const options: ParticipantColumn[] = [
        { label: 'ID', value: 'psi.customId' },
        { label: 'Biomarker Status', value: 'cv.biomarker_status', cId: 'cv-1' },
      ];

      const replaced = replaceColumn(current, 1, 'cv.biomarker_status', options);
      expect(replaced[1].value).toBe('cv.biomarker_status');
      expect(replaced[1].cId).toBe('cv-1');
      expect(replaced[1].label).toBe('Biomarker Status');
    });

    it('renders initial loading state for StudySettingsDisplay', () => {
      const html = renderToStaticMarkup(
        <StudySettingsDisplay studyId="study-123" canManageSettings={true} />
      );
      expect(html).toContain('data-testid="study-display-loading"');
      expect(html).toContain('Loading display settings...');
    });
  });

  describe('Bulk Tasks Component & Logic', () => {
    it('validates bulk task group inputs according to legacy rules', () => {
      // Missing name
      const res1 = buildBulkTaskGroupPayload({
        name: '   ',
        description: 'Test',
        triggerActive: false,
        eventId: '',
        action: 'completed',
      });
      expect(res1.ok).toBe(false);
      if (!res1.ok) {
        expect(res1.error).toBe('Bulk task group name is required.');
      }

      // Trigger active but missing eventId
      const res2 = buildBulkTaskGroupPayload({
        name: 'Group A',
        description: 'Test',
        triggerActive: true,
        eventId: '',
        action: 'completed',
      });
      expect(res2.ok).toBe(false);
      if (!res2.ok) {
        expect(res2.error).toBe('Trigger event is required when trigger is active.');
      }

      // Trigger active with valid eventId and action
      const res3 = buildBulkTaskGroupPayload({
        name: 'Group A',
        description: 'Test desc',
        triggerActive: true,
        eventId: 'event-1',
        action: 'scheduled',
      });
      expect(res3.ok).toBe(true);
      if (res3.ok) {
        expect(res3.payload.triggerActive).toBe(true);
        expect(res3.payload.trigger).toEqual({ eventId: 'event-1', action: 'scheduled' });
      }

      // Trigger inactive -> trigger is null
      const res4 = buildBulkTaskGroupPayload({
        name: 'Group A',
        description: 'Test desc',
        triggerActive: false,
        eventId: 'event-1',
        action: 'scheduled',
      });
      expect(res4.ok).toBe(true);
      if (res4.ok) {
        expect(res4.payload.triggerActive).toBe(false);
        expect(res4.payload.trigger).toBeNull();
      }
    });

    it('validates task name non-empty', () => {
      expect(validateTaskName('')).toBe('Bulk task name is required.');
      expect(validateTaskName('   ')).toBe('Bulk task name is required.');
      expect(validateTaskName('Valid Task')).toBeNull();
    });

    it('reorders tasks within group and reindexes rank', () => {
      const tasks: BulkTask[] = [
        { _id: 't-1', bulkTaskGroupId: 'g-1', name: 'Task 1', assignedTo: [], rank: 0 },
        { _id: 't-2', bulkTaskGroupId: 'g-1', name: 'Task 2', assignedTo: [], rank: 1 },
        { _id: 't-3', bulkTaskGroupId: 'g-1', name: 'Task 3', assignedTo: [], rank: 2 },
      ];

      // Move task 2 to index 0 (top)
      const reordered = moveTask(tasks, 2, 0);
      expect(reordered).not.toBeNull();
      expect(reordered![0]._id).toBe('t-3');
      expect(reordered![0].rank).toBe(0);
      expect(reordered![1]._id).toBe('t-1');
      expect(reordered![1].rank).toBe(1);
      expect(reordered![2]._id).toBe('t-2');
      expect(reordered![2].rank).toBe(2);

      // Out of bounds move
      expect(moveTask(tasks, 0, 5)).toBeNull();
      expect(moveTask(tasks, 0, 0)).toBeNull();
    });

    it('resolves assignee names from team member list', () => {
      const members: BulkTaskTeamMember[] = [
        { userId: 'u-1', name: 'John Doe', email: 'jd@test.com' },
        { userId: 'u-2', name: 'Alice Smith', email: 'as@test.com' },
      ];

      expect(resolveAssigneeNames([], members)).toBe('Unassigned');
      expect(resolveAssigneeNames(['u-1'], members)).toBe('John Doe');
      expect(resolveAssigneeNames(['u-1', 'u-2'], members)).toBe('John Doe, Alice Smith');
      expect(resolveAssigneeNames(['u-unknown'], members)).toBe('u-unknown');
    });

    it('toggles assignees correctly', () => {
      const current = ['u-1'];
      const added = toggleAssignee(current, 'u-2');
      expect(added).toEqual(['u-1', 'u-2']);
      const removed = toggleAssignee(added, 'u-1');
      expect(removed).toEqual(['u-2']);
    });

    it('formats trigger action labels correctly', () => {
      expect(triggerActionLabel('scheduled')).toBe('Scheduled');
      expect(triggerActionLabel('completed')).toBe('Completed');
    });

    it('renders initial loading state for StudySettingsBulkTasks', () => {
      const html = renderToStaticMarkup(
        <StudySettingsBulkTasks studyId="study-123" canManageSettings={true} />
      );
      expect(html).toContain('data-testid="study-bulk-tasks-loading"');
      expect(html).toContain('Loading bulk tasks...');
    });
  });
});
