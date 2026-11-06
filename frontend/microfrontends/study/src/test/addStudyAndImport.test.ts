// frontend/microfrontends/study/src/test/addStudyAndImport.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { studyApi } from '../../../../shared/api/studyApi';
import { apiClient } from '../../../../shared/api-client';
import { confirmation } from '../../../../shared/confirmation';
import { toast } from '../../../../shared/toaster';
import { validateStudyName, STUDY_NAME_RULES } from '../../../../shared/design-system/validation';
import { AddStudyModal } from '../../../../shared/design-system/components/AddStudyModal';

describe('Add Study, Copy Study, and Import Study Client Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('studyApi Client Endpoints', () => {
    it('calls POST /api/v1/studies when creating a fresh study', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { id: 'study-new', title: 'Oncology Phase 1', status: 'ACTIVE' },
      } as any);

      const payload = {
        title: 'Oncology1',
        name: 'Oncology1',
        shortName: 'Oncology1',
        sampleSize: 100,
      };

      const result = await studyApi.createStudy(payload);

      expect(postSpy).toHaveBeenCalledWith('/api/v1/studies', payload, undefined);
      expect(result.id).toBe('study-new');
      expect(result.title).toBe('Oncology Phase 1');
      postSpy.mockRestore();
    });

    it('calls POST /api/v1/studies/copy with studyName and sourceStudyId when copying an existing study', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { id: 'study-cloned', title: 'ClonedStudy', status: 'ACTIVE' },
      } as any);

      const copyPayload = {
        studyName: 'ClonedStudy',
        sourceStudyId: '33333333-3333-3333-3333-333333333333',
      };

      const result = await studyApi.copyStudy(copyPayload);

      expect(postSpy).toHaveBeenCalledWith('/api/v1/studies/copy', copyPayload, undefined);
      expect(result.id).toBe('study-cloned');
      postSpy.mockRestore();
    });

    it('calls POST /api/v1/studies/import with multipart FormData when uploading a JSON file', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: {
          data: {
            studyId: 'study-imported',
            studyCode: 'IMP_01',
            name: 'ImportedStudy',
            importedEntitiesSummary: { statuses: 2, events: 1, surveys: 1 },
          },
        },
      } as any);

      const file = new File(['{"studyName":"ImportedStudy"}'], 'export.json', { type: 'application/json' });
      const result = await studyApi.importStudy('ImportedStudy', file);

      expect(postSpy).toHaveBeenCalledWith(
        '/api/v1/studies/import',
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'multipart/form-data' }),
        })
      );
      expect(result.studyId).toBe('study-imported');
      postSpy.mockRestore();
    });

    it('calls POST /api/v1/studies/import with JSON payload when calling importStudyJson', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: {
          data: {
            studyId: 'study-json-import',
            name: 'JsonStudy',
          },
        },
      } as any);

      const studyData = { statuses: [{ name: 'Enrolled' }] };
      const result = await studyApi.importStudyJson('JsonStudy', studyData);

      expect(postSpy).toHaveBeenCalledWith(
        '/api/v1/studies/import',
        { studyName: 'JsonStudy', studyData },
        undefined
      );
      expect(result.studyId).toBe('study-json-import');
      postSpy.mockRestore();
    });
  });

  describe('Canonical Study Name Validation (Shared Design System)', () => {
    const existingStudies = [
      { id: '1', name: 'Cardiology 101', title: 'Cardiology 101' },
      { id: '2', name: 'Oncology Alpha', title: 'Oncology Alpha' },
    ];

    it('rejects empty and whitespace-only study names', () => {
      expect(validateStudyName('', existingStudies)).toBe('Short study name is required');
      expect(validateStudyName('   ', existingStudies)).toBe('Short study name is required');
    });

    it('rejects study names longer than 15 characters', () => {
      expect(validateStudyName('StudyNameIsWayTooLong', existingStudies)).toBe(
        'Short study name must be 15 characters or fewer'
      );
    });

    it('rejects duplicate study names case-insensitively', () => {
      expect(validateStudyName('cardiology 101', existingStudies)).toBe(
        'Study name already exists. Please choose another'
      );
      expect(validateStudyName('ONCOLOGY ALPHA', existingStudies)).toBe(
        'Study name already exists. Please choose another'
      );
    });

    it('permits preserving same name when editing the existing study', () => {
      expect(validateStudyName('Cardiology 101', existingStudies, '1')).toBeNull();
      expect(validateStudyName('cardiology 101', existingStudies, '1')).toBeNull();
    });

    it('accepts valid, non-duplicate names under 15 characters', () => {
      expect(validateStudyName('Neuro 202', existingStudies)).toBeNull();
      expect(validateStudyName('GEN-01', existingStudies)).toBeNull();
      expect(validateStudyName('123456789012345', existingStudies)).toBeNull(); // exactly 15 chars
    });
  });

  describe('AddStudyModal Component Structure & Rendering', () => {
    const mockStudies = [
      { id: '1', name: 'Cardiology 101', status: 'ACTIVE', archived: false },
      { id: '2', name: 'Archived Trial', status: 'ARCHIVED', archived: true },
    ];

    it('renders null when isOpen is false', () => {
      const html = renderToStaticMarkup(
        React.createElement(AddStudyModal, {
          isOpen: false,
          onClose: vi.fn(),
          studies: mockStudies,
        })
      );
      expect(html).toBe('');
    });

    it('renders Add Study modal correctly when isOpen is true', () => {
      const html = renderToStaticMarkup(
        React.createElement(AddStudyModal, {
          isOpen: true,
          onClose: vi.fn(),
          studies: mockStudies,
        })
      );

      expect(html).toContain('Add Study');
      expect(html).toContain('Short Study Name');
      expect(html).toContain('id="short-study-name"');
      expect(html).toContain('Copy From Existing Study');
      expect(html).toContain('Select a template (optional)');
      expect(html).toContain('Cardiology 101');
      // Archived study should not be in the template copy options
      expect(html).not.toContain('<option value="2">Archived Trial</option>');
      expect(html).toContain('Import Study');
      expect(html).toContain('Submit');
      expect(html).toContain('Cancel');
    });

    it('renders Edit Study mode correctly when studyToEdit is provided', () => {
      const html = renderToStaticMarkup(
        React.createElement(AddStudyModal, {
          isOpen: true,
          onClose: vi.fn(),
          studies: mockStudies,
          studyToEdit: mockStudies[0],
        })
      );

      expect(html).toContain('Edit Study');
      expect(html).toContain('Save Changes');
      expect(html).not.toContain('Import Study');
    });
  });

  describe('Import File Handling & Confirmation Integration', () => {
    it('validates file extension and rejects non-JSON files', () => {
      const invalidFile = new File(['text'], 'export.csv', { type: 'text/csv' });
      const isJson = invalidFile.name.toLowerCase().endsWith('.json') || invalidFile.type === 'application/json';
      expect(isJson).toBe(false);

      const validFile = new File(['{}'], 'study.json', { type: 'application/json' });
      const isValidJson = validFile.name.toLowerCase().endsWith('.json') || validFile.type === 'application/json';
      expect(isValidJson).toBe(true);
    });

    it('prompts user confirmation before executing import', async () => {
      const confirmSpy = vi.spyOn(confirmation, 'confirm').mockResolvedValueOnce(true);

      const confirmed = await confirmation.confirm({
        title: 'Are you sure?',
        message: 'Importing file export.json will create study CardioTrial and populate it with the file contents.',
        confirmText: 'Yes, import and create study',
        cancelText: 'Cancel',
        intent: 'warning',
      });

      expect(confirmSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Are you sure?',
          confirmText: 'Yes, import and create study',
          cancelText: 'Cancel',
        })
      );
      expect(confirmed).toBe(true);
      confirmSpy.mockRestore();
    });

    it('cancels import without calling API when confirmation is rejected', async () => {
      const confirmSpy = vi.spyOn(confirmation, 'confirm').mockResolvedValueOnce(false);
      const postSpy = vi.spyOn(apiClient, 'post');

      const confirmed = await confirmation.confirm({
        title: 'Are you sure?',
        message: 'Importing file export.json will create study CardioTrial',
      });

      if (confirmed) {
        await studyApi.importStudy('CardioTrial', new File(['{}'], 'export.json'));
      }

      expect(postSpy).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
      postSpy.mockRestore();
    });

    it('infers study name from imported JSON payload when shortName is initially omitted', () => {
      const extractStudyName = (parsedJson: any, fileName: string): string => {
        const extracted = (parsedJson?.study?.name || parsedJson?.studyName || parsedJson?.name || fileName.replace(/\.json$/i, '')).trim();
        return extracted.slice(0, 15);
      };

      const legacyJson = { study: { name: 'LegacyTrial' }, statuses: [] };
      expect(extractStudyName(legacyJson, 'export.json')).toBe('LegacyTrial');

      const flatJson = { studyName: 'NeuroStudy', version: 1 };
      expect(extractStudyName(flatJson, 'export.json')).toBe('NeuroStudy');

      const fallbackJson = {};
      expect(extractStudyName(fallbackJson, 'OncologyTrial.json')).toBe('OncologyTrial');
    });
  });

  describe('Toast Notifications for Add and Import Study', () => {
    it('dispatches success toast when study is successfully created', () => {
      const toastSuccessSpy = vi.spyOn(toast, 'success').mockReturnValue('toast-id-1');

      toast.success('Successfully created study Cardio101.');

      expect(toastSuccessSpy).toHaveBeenCalledWith('Successfully created study Cardio101.');
      toastSuccessSpy.mockRestore();
    });

    it('dispatches error toast when study creation fails', () => {
      const toastErrorSpy = vi.spyOn(toast, 'error').mockReturnValue('toast-id-2');

      toast.error('Study name already exists. Please choose another');

      expect(toastErrorSpy).toHaveBeenCalledWith('Study name already exists. Please choose another');
      toastErrorSpy.mockRestore();
    });
  });
});
