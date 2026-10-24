// frontend/shared/design-system/components/AddStudyModal.tsx - Unified Add/Edit Study Modal
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Upload } from 'lucide-react';
import { Modal } from './Modal';
import { AccessibleField } from '../../accessibility/AccessibleField';
import { toast } from '../../toaster';
import { confirmation } from '../../confirmation';
import { studyApi } from '../../api/studyApi';
import { getApiErrorMessage } from '../../api-client';
import { validateField, validators, validateStudyName, STUDY_NAME_RULES } from '../validation';

export interface AddStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudyCreated?: (studyId: string, studyName: string) => void;
  studies?: any[];
  studyToEdit?: any | null;
}

export const AddStudyModal: React.FC<AddStudyModalProps> = ({
  isOpen,
  onClose,
  onStudyCreated,
  studies = [],
  studyToEdit = null,
}) => {
  const isEditMode = Boolean(studyToEdit);
  const [studyForm, setStudyForm] = useState({ shortName: '', templateId: '' });
  const [shortNameError, setShortNameError] = useState<string | null>(null);
  const [isSavingStudy, setIsSavingStudy] = useState(false);
  const [availableStudies, setAvailableStudies] = useState<any[]>(studies);

  const importInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens or studyToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (studyToEdit) {
        setStudyForm({
          shortName: (studyToEdit.shortName || studyToEdit.name || studyToEdit.title || '').slice(0, 15),
          templateId: '',
        });
      } else {
        setStudyForm({ shortName: '', templateId: '' });
      }
      setShortNameError(null);
      setIsSavingStudy(false);

      if (studies.length === 0) {
        studyApi
          .getStudies()
          .then((list) => {
            if (Array.isArray(list)) setAvailableStudies(list);
          })
          .catch(() => {});
      } else {
        setAvailableStudies(studies);
      }
    }
  }, [isOpen, studyToEdit, studies]);

  if (!isOpen) return null;

  const eligibleTemplates = availableStudies.filter(
    (s) => !s.archived && String(s.status || '').toUpperCase() !== 'ARCHIVED'
  );

  const handleCreateStudy = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = studyForm.shortName.trim();
    const currentId = studyToEdit ? String(studyToEdit.id ?? studyToEdit.studyId) : null;
    const validationError = validateStudyName(trimmedName, availableStudies, currentId);
    if (validationError) {
      setShortNameError(validationError);
      if (validationError.includes('already exists')) {
        toast.error(validationError);
      }
      document.getElementById('short-study-name')?.focus();
      return;
    }

    setIsSavingStudy(true);
    try {
      if (isEditMode && currentId) {
        await studyApi.updateStudy(currentId, {
          name: trimmedName,
          title: trimmedName,
          shortName: trimmedName,
        });
        toast.success(`Successfully updated study ${trimmedName}.`);
        onClose();
        onStudyCreated?.(currentId, trimmedName);
      } else if (studyForm.templateId) {
        const created = await studyApi.copyStudy({
          studyName: trimmedName,
          sourceStudyId: studyForm.templateId,
        });

        toast.success(`Successfully created study ${trimmedName}.`);
        const newId = String(
          created.id ?? created.studyId ?? created.studyCode ?? created.protocolNumber
        );
        onClose();
        onStudyCreated?.(newId, trimmedName);
      } else {
        const payload = {
          title: trimmedName,
          name: trimmedName,
          shortName: trimmedName,
          status: 'ACTIVE',
          sampleSize: 100,
        };

        const created = await studyApi.createStudy(payload);
        toast.success(`Successfully created study ${trimmedName}.`);
        const newId = String(
          created.id ?? created.studyId ?? created.studyCode ?? created.protocolNumber
        );
        onClose();
        onStudyCreated?.(newId, trimmedName);
      }
    } catch (err: any) {
      const msg = getApiErrorMessage(err) || 'Unable to save the study. Please try again.';
      toast.error(msg);
    } finally {
      setIsSavingStudy(false);
    }
  };

  const handleImportButtonClick = () => {
    importInputRef.current?.click();
  };

  const handleImportStudy = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const isJson = file.name.toLowerCase().endsWith('.json') || file.type === 'application/json';
    if (!isJson) {
      toast.error('Must select a .json file to import a study.');
      return;
    }

    let parsedJson: any = null;
    try {
      const fileText = await file.text();
      parsedJson = JSON.parse(fileText);
    } catch {
      const err = `File contents lack the proper format for file ${file.name}, please try again.`;
      toast.error(err);
      return;
    }

    let trimmedName = studyForm.shortName.trim();
    if (!trimmedName && parsedJson) {
      const extracted = (
        parsedJson.study?.name ||
        parsedJson.studyName ||
        parsedJson.name ||
        file.name.replace(/\.json$/i, '')
      ).trim();
      if (extracted) {
        trimmedName = extracted.slice(0, 15);
        setStudyForm((current) => ({ ...current, shortName: trimmedName }));
      }
    }

    const validationError = validateStudyName(trimmedName, availableStudies);
    if (validationError) {
      setShortNameError(validationError);
      toast.error(
        validationError.includes('already exists')
          ? validationError
          : 'Must provide a study name to import a new study.'
      );
      const input = document.getElementById('short-study-name') as HTMLInputElement | null;
      input?.focus();
      return;
    }

    const confirmed = await confirmation.confirm({
      title: 'Are you sure?',
      message: `Importing file ${file.name} will create study ${trimmedName} and populate it with the file contents.`,
      confirmText: 'Yes, import and create study',
      cancelText: 'Cancel',
      intent: 'warning',
    });

    if (!confirmed) {
      return;
    }

    setIsSavingStudy(true);
    try {
      const result = await studyApi.importStudy(trimmedName, file);
      toast.success(`Successfully created study ${trimmedName}.`);
      const newId = String(result.studyId ?? result.studyCode);
      onClose();
      onStudyCreated?.(newId, trimmedName);
    } catch (err: any) {
      const errMsg =
        getApiErrorMessage(err) ||
        `Something went wrong while importing file ${file.name}, please contact the site admin.`;
      toast.error(errMsg);
    } finally {
      setIsSavingStudy(false);
    }
  };

  const modalFooter = (
    <div className="study-modal__footer">
      {!isEditMode && (
        <button
          id="import-study-btn"
          type="button"
          className="btn btn-secondary study-modal__import-btn"
          onClick={handleImportButtonClick}
          disabled={isSavingStudy}
        >
          <Upload size={15} /> {isSavingStudy ? 'Importing…' : 'Import Study'}
        </button>
      )}
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleCreateStudy}
        disabled={isSavingStudy}
      >
        <Plus size={15} /> {isSavingStudy ? 'Saving…' : isEditMode ? 'Save Changes' : 'Submit'}
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onClose}
        disabled={isSavingStudy}
      >
        Cancel
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Study' : 'Add Study'}
      footer={modalFooter}
      className="study-form-modal"
    >
      <form onSubmit={handleCreateStudy} noValidate className="space-y-4">
        <AccessibleField
          id="short-study-name"
          label="Short Study Name"
          required
          value={studyForm.shortName}
          error={shortNameError}
          placeholder="max length 15 characters"
        >
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="text"
              className="form-input"
              maxLength={15}
              value={studyForm.shortName}
              onChange={(e) => {
                const val = e.target.value;
                setStudyForm((current) => ({ ...current, shortName: val }));
                if (shortNameError) setShortNameError(null);
              }}
              onBlur={() => {
                const trimmed = studyForm.shortName.trim();
                const err = validateField(trimmed, STUDY_NAME_RULES);
                if (err) setShortNameError(err);
              }}
            />
          )}
        </AccessibleField>

        {!isEditMode && (
          <div className="form-group">
            <label htmlFor="copy-from-study-select" className="form-label">
              Copy From Existing Study
            </label>
            <select
              id="copy-from-study-select"
              aria-label="Select study to copy"
              className="form-select"
              value={studyForm.templateId}
              onChange={(e) =>
                setStudyForm((current) => ({ ...current, templateId: e.target.value }))
              }
            >
              <option value="">
                {eligibleTemplates.length === 0
                  ? 'No existing studies available to copy'
                  : 'Select a template (optional)'}
              </option>
              {eligibleTemplates.map((study) => {
                const id = study.id ?? study.studyId ?? study.protocolId;
                return (
                  <option key={id} value={String(id)}>
                    {study.title || study.name}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <input
          ref={importInputRef}
          style={{ display: 'none' }}
          type="file"
          accept="application/json,.json"
          aria-label="Import study JSON file"
          onChange={handleImportStudy}
        />
      </form>
    </Modal>
  );
};

export default AddStudyModal;
