// frontend/microfrontends/survey/src/components/AddEditSurveyModal.tsx - Common Modal for Add / Edit Survey
import React, { useState, useEffect } from 'react';
import { Plus, Save } from 'lucide-react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { AccessibleField } from '../../../../shared/accessibility/AccessibleField';
import { toast } from '../../../../shared/toaster';
import { surveyApi } from '../api/surveyApi';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { validateField, validators } from '../../../../shared/design-system/validation';
import { SurveyListItem } from '../types/survey';

export interface AddEditSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSurveySaved?: (survey: any) => void;
  surveyToEdit?: SurveyListItem | null;
}

const SURVEY_NAME_RULES = [
  validators.required('Survey name'),
  validators.maxLength(100, 'Survey name'),
];

export const AddEditSurveyModal: React.FC<AddEditSurveyModalProps> = ({
  isOpen,
  onClose,
  onSurveySaved,
  surveyToEdit = null,
}) => {
  const isEditMode = Boolean(surveyToEdit);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [studyId, setStudyId] = useState<number | string>('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (surveyToEdit) {
        setTitle(surveyToEdit.title || '');
        setDescription(surveyToEdit.description || '');
        setStudyId(surveyToEdit.studyId || '');
      } else {
        setTitle('');
        setDescription('');
        setStudyId('');
      }
      setTitleError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, surveyToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const validationError = validateField(trimmedTitle, SURVEY_NAME_RULES);
    if (validationError) {
      setTitleError(validationError);
      document.getElementById('survey-title-field')?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: trimmedTitle,
        description: description.trim(),
        studyId: studyId ? Number(studyId) : null,
      };

      if (isEditMode && surveyToEdit) {
        const updated = await surveyApi.updateSurvey(surveyToEdit.id, payload);
        toast.success(`Successfully updated survey "${trimmedTitle}".`);
        onClose();
        onSurveySaved?.(updated);
      } else {
        payload.status = 'DRAFT';
        payload.questions = [];
        const created = await surveyApi.createSurvey(payload);
        toast.success(`Successfully created survey "${trimmedTitle}".`);
        onClose();
        onSurveySaved?.(created);
      }
    } catch (err: any) {
      const msg = getApiErrorMessage(err) || 'Failed to save survey. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalFooter = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isEditMode ? (
          <>
            <Save size={15} /> <span>{isSubmitting ? 'Saving…' : 'Save Changes'}</span>
          </>
        ) : (
          <>
            <Plus size={15} /> <span>{isSubmitting ? 'Creating…' : 'Create Survey'}</span>
          </>
        )}
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onClose}
        disabled={isSubmitting}
      >
        Cancel
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Survey: ${surveyToEdit?.title || ''}` : 'Add Survey'}
      footer={modalFooter}
      className="survey-form-modal"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AccessibleField
          id="survey-title-field"
          label="Survey Name"
          required
          value={title}
          error={titleError}
          placeholder="Enter Survey Name"
        >
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => {
                const val = e.target.value;
                setTitle(val);
                if (titleError) setTitleError(null);
              }}
              onBlur={() => {
                const trimmed = title.trim();
                const err = validateField(trimmed, SURVEY_NAME_RULES);
                if (err) setTitleError(err);
              }}
            />
          )}
        </AccessibleField>

        <div className="form-group">
          <label htmlFor="survey-desc-field" className="form-label">
            Description / Instructions
          </label>
          <textarea
            id="survey-desc-field"
            rows={3}
            className="form-textarea"
            placeholder="Explain the purpose of this survey and instructions for respondents..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="survey-study-field" className="form-label">
            Clinical Study ID / Protocol Number (Optional)
          </label>
          <input
            id="survey-study-field"
            type="number"
            className="form-input"
            placeholder="e.g. 101"
            value={studyId}
            onChange={(e) => setStudyId(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};

export default AddEditSurveyModal;
