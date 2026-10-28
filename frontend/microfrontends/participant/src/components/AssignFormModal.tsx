// frontend/microfrontends/participant/src/components/AssignFormModal.tsx - Assign Survey / Form Modal
import React, { useState, useEffect } from 'react';
import { ClipboardList, Check, Loader2, Calendar } from 'lucide-react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { participantApi, SurveyOptionItem, SurveyAssignmentItem } from '../../../../shared/api/participantApi';

export interface AssignFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  participantName: string;
  defaultStudyId?: string;
  tenantId?: string;
  siteId?: string;
  onFormAssigned: (assignment: SurveyAssignmentItem) => void;
}

export const AssignFormModal: React.FC<AssignFormModalProps> = ({
  isOpen,
  onClose,
  participantId,
  participantName,
  defaultStudyId,
  tenantId,
  siteId,
  onFormAssigned,
}) => {
  const [availableForms, setAvailableForms] = useState<SurveyOptionItem[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && participantId) {
      setIsLoadingOptions(true);
      participantApi
        .getAvailableForms(participantId, { tenantId, siteId })
        .then((forms) => {
          setAvailableForms(forms);
          if (forms.length > 0) {
            setSelectedFormId(forms[0].surveyDefinitionId);
          }
        })
        .catch((err) => {
          console.warn('Failed to load available forms:', err);
        })
        .finally(() => {
          setIsLoadingOptions(false);
        });
      setErrors({});
      setDueDate('');
      setNotes('');
    }
  }, [isOpen, participantId, tenantId, siteId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFormId) {
      setErrors({ form: 'Please select a form to assign' });
      return;
    }

    const selectedForm = availableForms.find((f) => f.surveyDefinitionId === selectedFormId);

    setIsSubmitting(true);
    try {
      const assigned = await participantApi.assignForm(
        participantId,
        {
          surveyDefinitionId: selectedFormId,
          studyId: defaultStudyId?.trim() || undefined,
          dueAt: dueDate ? new Date(dueDate).toISOString() : undefined,
        },
        { tenantId, siteId }
      );

      toast.success(`Form "${selectedForm?.name || 'Form'}" assigned successfully`);
      onFormAssigned(assigned);
      onClose();
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to assign form');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Form / Survey — ${participantName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isLoadingOptions ? (
          <div className="flex items-center justify-center p-8 space-x-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Loading available questionnaires...</span>
          </div>
        ) : availableForms.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
            No questionnaire templates or forms are currently available for assignment.
          </div>
        ) : (
          <>
            {/* Form Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Select Questionnaire / Form <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
                className={`w-full text-sm border rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.form ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {availableForms.map((f) => (
                  <option key={f.surveyDefinitionId} value={f.surveyDefinitionId}>
                    {f.name} ({f.code || 'FORM'})
                  </option>
                ))}
              </select>
              {errors.form && <p className="text-xs text-red-500 mt-1">{errors.form}</p>}
            </div>

            {/* Selected Form Description */}
            {selectedFormId && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-gray-600">
                <span className="font-semibold text-gray-700">Description: </span>
                {availableForms.find((f) => f.surveyDefinitionId === selectedFormId)?.description || 'Standard participant assessment form.'}
              </div>
            )}

            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Due Date (Optional)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Specify an expected completion deadline for this participant survey.</p>
            </div>
          </>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoadingOptions || availableForms.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Assign Form
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
