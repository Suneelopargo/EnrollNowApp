// frontend/microfrontends/participant/src/components/AddContactLogModal.tsx - Add/Edit Participant Contact Modal
import React, { useState, useEffect, useCallback } from 'react';
import { Check, Star, Loader2 } from 'lucide-react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import {
  participantApi,
  ContactLogItem,
  CreateContactLogPayload,
  UpdateContactLogPayload,
  ContactTypeOption,
  ContactOutcomeOption,
  ContactMethodOption,
  ContactTeamMember,
} from '../../../../shared/api/participantApi';

export interface AddContactLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  studyId?: string;
  logToEdit?: ContactLogItem | null;
  onSaved: (savedLog: ContactLogItem) => void;
  tenantId?: string;
  siteId?: string;
}

export const AddContactLogModal: React.FC<AddContactLogModalProps> = ({
  isOpen,
  onClose,
  participantId,
  studyId,
  logToEdit,
  onSaved,
  tenantId,
  siteId,
}) => {
  const isEditMode = Boolean(logToEdit?.id);

  // Helper to format Date into datetime-local string YYYY-MM-DDTHH:mm
  const formatDateTimeLocal = (date: Date): string => {
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  };

  // Form Fields
  const [contactType, setContactType] = useState<string>(logToEdit?.contactType || '');
  const [customContactType, setCustomContactType] = useState<string>('');
  const [isCreatingCustomType, setIsCreatingCustomType] = useState<boolean>(false);

  const [dateTimeOfContact, setDateTimeOfContact] = useState<string>(() => {
    if (logToEdit?.dateTimeOfContact) {
      try {
        return formatDateTimeLocal(new Date(logToEdit.dateTimeOfContact));
      } catch {
        return logToEdit.dateTimeOfContact;
      }
    }
    return '';
  });
  const [contactedBy, setContactedBy] = useState<string>(logToEdit?.contactedBy || '');
  const [contactMethod, setContactMethod] = useState<string>(logToEdit?.contactMethod || '');
  const [customContactMethod, setCustomContactMethod] = useState<string>('');
  const [isCreatingCustomMethod, setIsCreatingCustomMethod] = useState<boolean>(false);

  const [spokeTo, setSpokeTo] = useState<string>(logToEdit?.spokeTo || '');
  const [regarding, setRegarding] = useState<string>(logToEdit?.regarding || '');
  const [outcome, setOutcome] = useState<string>(logToEdit?.outcome || '');
  const [otherOutcome, setOtherOutcome] = useState<string>('');
  const [comments, setComments] = useState<string>(logToEdit?.comments || '');

  // Checkboxes
  const [lastContact, setLastContact] = useState<boolean>(logToEdit?.lastContact ?? true);
  const [sticky, setSticky] = useState<boolean>(Boolean(logToEdit?.sticky));
  const [notify, setNotify] = useState<boolean>(Boolean(logToEdit?.notify));
  const [global, setGlobal] = useState<boolean>(logToEdit?.global ?? true);

  // Dynamic Options
  const [contactTypeOptions, setContactTypeOptions] = useState<ContactTypeOption[]>([]);
  const [outcomeOptions, setOutcomeOptions] = useState<ContactOutcomeOption[]>([]);
  const [contactMethodOptions, setContactMethodOptions] = useState<ContactMethodOption[]>([]);
  const [teamMembers, setTeamMembers] = useState<ContactTeamMember[]>([]);

  // States
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form or populate from logToEdit
  const initializeForm = useCallback(() => {
    setErrors({});
    setIsCreatingCustomType(false);
    setCustomContactType('');
    setIsCreatingCustomMethod(false);
    setCustomContactMethod('');

    if (logToEdit) {
      setContactType(logToEdit.contactType || '');
      setContactedBy(logToEdit.contactedBy || '');
      setContactMethod(logToEdit.contactMethod || '');
      setSpokeTo(logToEdit.spokeTo || '');
      setRegarding(logToEdit.regarding || '');
      setComments(logToEdit.comments || '');
      setSticky(Boolean(logToEdit.sticky));
      setNotify(Boolean(logToEdit.notify));
      setGlobal(Boolean(logToEdit.global));
      setLastContact(Boolean(logToEdit.lastContact));

      if (logToEdit.dateTimeOfContact) {
        try {
          const d = new Date(logToEdit.dateTimeOfContact);
          setDateTimeOfContact(formatDateTimeLocal(d));
        } catch {
          setDateTimeOfContact(formatDateTimeLocal(new Date()));
        }
      } else {
        setDateTimeOfContact(formatDateTimeLocal(new Date()));
      }

      // Check if outcome matches standard or other
      const knownOutcome = outcomeOptions.some((o) => o.outcome === logToEdit.outcome);
      if (knownOutcome || !logToEdit.outcome) {
        setOutcome(logToEdit.outcome || '');
        setOtherOutcome('');
      } else {
        setOutcome('Other');
        setOtherOutcome(logToEdit.outcome);
      }
    } else {
      setContactType('Phone Call');
      setDateTimeOfContact(formatDateTimeLocal(new Date()));
      setContactMethod('');
      setSpokeTo('');
      setRegarding('');
      setOutcome('');
      setOtherOutcome('');
      setComments('');
      setLastContact(true);
      setSticky(false);
      setNotify(false);
      setGlobal(true);
      if (teamMembers.length > 0) {
        setContactedBy(teamMembers[0].id);
      }
    }
  }, [logToEdit, outcomeOptions, teamMembers]);

  // Load dropdown options from backend APIs
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingOptions(true);

    Promise.all([
      participantApi.getContactTypeOptions({ studyId, tenantId }),
      participantApi.getContactOutcomes({ tenantId }),
      participantApi.getParticipantContactMethods(participantId, { studyId, tenantId }),
      participantApi.getContactTeamMembers({ studyId, tenantId }),
    ])
      .then(([types, outcomes, methods, members]) => {
        if (!isMounted) return;
        setContactTypeOptions(types);
        setOutcomeOptions(outcomes);
        setContactMethodOptions(methods);
        setTeamMembers(members);

        if (!logToEdit && members.length > 0 && !contactedBy) {
          setContactedBy(members[0].id);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Failed to load contact log options:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingOptions(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, participantId, studyId, tenantId]);

  useEffect(() => {
    if (isOpen) {
      initializeForm();
    }
  }, [isOpen, initializeForm]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    const effectiveType = isCreatingCustomType ? customContactType.trim() : contactType.trim();
    if (!effectiveType) {
      errs.contactType = 'Contact Type is required';
    }

    if (!dateTimeOfContact) {
      errs.dateTimeOfContact = 'Contact Date/Time is required';
    }

    if (!contactedBy) {
      errs.contactedBy = 'Contacted By is required';
    }

    if (!outcome) {
      errs.outcome = 'Outcome is required';
    } else if (outcome === 'Other' && !otherOutcome.trim()) {
      errs.otherOutcome = 'Other is required when Outcome is Other';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const effectiveType = isCreatingCustomType ? customContactType.trim() : contactType.trim();
    const effectiveMethod = isCreatingCustomMethod
      ? customContactMethod.trim()
      : contactMethod.trim();
    const effectiveOutcome = outcome === 'Other' ? otherOutcome.trim() : outcome.trim();

    const isoDateTime = new Date(dateTimeOfContact).toISOString();

    setIsSaving(true);
    try {
      if (isEditMode && logToEdit?.id) {
        const payload: UpdateContactLogPayload = {
          dateTimeOfContact: isoDateTime,
          contactType: effectiveType,
          contactMethod: effectiveMethod || undefined,
          contactedBy,
          spokeTo: spokeTo.trim() || undefined,
          regarding: regarding.trim() || undefined,
          outcome: effectiveOutcome,
          comments: comments.trim() || undefined,
          sticky,
          notify,
          global,
          lastContact,
        };

        const updated = await participantApi.updateContactLog(participantId, logToEdit.id, payload, {
          tenantId,
          siteId,
        });

        toast.success('Success! Contact log updated.');
        onSaved(updated);
        onClose();
      } else {
        const payload: CreateContactLogPayload = {
          studyId: studyId?.trim() || undefined,
          dateTimeOfContact: isoDateTime,
          contactType: effectiveType,
          contactMethod: effectiveMethod || undefined,
          contactedBy,
          spokeTo: spokeTo.trim() || undefined,
          regarding: regarding.trim() || undefined,
          outcome: effectiveOutcome,
          comments: comments.trim() || undefined,
          sticky,
          notify,
          global,
          lastContact,
        };

        const created = await participantApi.createContactLog(participantId, payload, {
          tenantId,
          siteId,
        });

        toast.success('Success! Contact log added.');
        onSaved(created);
        onClose();
      }
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to save contact log.');
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Participant Contact' : 'Add Participant Contact'}
      size="default"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="addParticipantContactForm"
            className="btn btn-primary flex items-center gap-1.5"
            disabled={isSaving || isLoadingOptions}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {isEditMode ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              <>
                <Check size={16} /> {isEditMode ? 'Update' : 'Save'}
              </>
            )}
          </button>
        </div>
      }
    >
      <form
        id="addParticipantContactForm"
        onSubmit={handleSubmit}
        className="form space-y-4"
        noValidate
      >
        {/* Contact Type */}
        <div className="form-group" data-error={Boolean(errors.contactType)}>
          <div className="flex items-center justify-between">
            <label className="form-label" htmlFor="contact-type-select">
              Contact Type <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              className="text-xs text-blue-600 hover:underline cursor-pointer"
              onClick={() => {
                setIsCreatingCustomType(!isCreatingCustomType);
                if (!isCreatingCustomType) setCustomContactType('');
              }}
            >
              {isCreatingCustomType ? 'Select from list' : '+ Add custom type'}
            </button>
          </div>

          {isCreatingCustomType ? (
            <input
              id="contact-type-custom"
              type="text"
              value={customContactType}
              onChange={(e) => setCustomContactType(e.target.value)}
              placeholder="Enter new contact type..."
              className={`form-input ${errors.contactType ? 'border-red-500' : ''}`}
              aria-invalid={Boolean(errors.contactType)}
              autoFocus
            />
          ) : (
            <select
              id="contact-type-select"
              value={contactType}
              onChange={(e) => setContactType(e.target.value)}
              className={`form-select ${errors.contactType ? 'border-red-500' : ''}`}
              aria-invalid={Boolean(errors.contactType)}
            >
              <option value="">Select contact type...</option>
              {contactTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
          {errors.contactType && (
            <span className="text-xs text-red-500 block mt-1" role="alert">
              {errors.contactType}
            </span>
          )}
        </div>

        {/* Contact Date/Time */}
        <div className="form-group" data-error={Boolean(errors.dateTimeOfContact)}>
          <label className="form-label" htmlFor="contact-datetime">
            Contact Date/Time <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-datetime"
            type="datetime-local"
            value={dateTimeOfContact}
            onChange={(e) => setDateTimeOfContact(e.target.value)}
            className={`form-input ${errors.dateTimeOfContact ? 'border-red-500' : ''}`}
            aria-invalid={Boolean(errors.dateTimeOfContact)}
          />
          {errors.dateTimeOfContact && (
            <span className="text-xs text-red-500 block mt-1" role="alert">
              {errors.dateTimeOfContact}
            </span>
          )}
        </div>

        {/* Contacted By */}
        <div className="form-group" data-error={Boolean(errors.contactedBy)}>
          <label className="form-label" htmlFor="contacted-by-select">
            Contacted By <span className="text-red-500">*</span>
          </label>
          <select
            id="contacted-by-select"
            value={contactedBy}
            onChange={(e) => setContactedBy(e.target.value)}
            className={`form-select ${errors.contactedBy ? 'border-red-500' : ''}`}
            aria-invalid={Boolean(errors.contactedBy)}
          >
            <option value="">Select who contacted the participant...</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} {m.email ? `(${m.email})` : ''}
              </option>
            ))}
          </select>
          {errors.contactedBy && (
            <span className="text-xs text-red-500 block mt-1" role="alert">
              {errors.contactedBy}
            </span>
          )}
        </div>

        {/* Method */}
        <div className="form-group">
          <div className="flex items-center justify-between">
            <label className="form-label" htmlFor="contact-method-select">
              Method
            </label>
            <button
              type="button"
              className="text-xs text-blue-600 hover:underline cursor-pointer"
              onClick={() => {
                setIsCreatingCustomMethod(!isCreatingCustomMethod);
                if (!isCreatingCustomMethod) setCustomContactMethod('');
              }}
            >
              {isCreatingCustomMethod ? 'Select known method' : '+ Add custom method'}
            </button>
          </div>

          {isCreatingCustomMethod ? (
            <input
              id="contact-method-custom"
              type="text"
              value={customContactMethod}
              onChange={(e) => setCustomContactMethod(e.target.value)}
              placeholder="Enter contact method (e.g. Work Phone)..."
              className="form-input"
            />
          ) : (
            <select
              id="contact-method-select"
              value={contactMethod}
              onChange={(e) => setContactMethod(e.target.value)}
              className="form-select"
            >
              <option value="">Select contact method...</option>
              {contactMethodOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} {opt.isPreferred ? '★ (Preferred)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Spoke To */}
        <div className="form-group">
          <label className="form-label" htmlFor="spoke-to-input">
            Spoke To
          </label>
          <input
            id="spoke-to-input"
            type="text"
            value={spokeTo}
            onChange={(e) => setSpokeTo(e.target.value)}
            placeholder="e.g. Participant, Mother, Spouse..."
            className="form-input"
          />
        </div>

        {/* Regarding */}
        <div className="form-group">
          <label className="form-label" htmlFor="regarding-textarea">
            Regarding
          </label>
          <textarea
            id="regarding-textarea"
            rows={2}
            value={regarding}
            onChange={(e) => setRegarding(e.target.value)}
            placeholder="Contact subject or topic..."
            className="form-textarea"
          />
        </div>

        {/* Outcome */}
        <div className="form-group" data-error={Boolean(errors.outcome)}>
          <label className="form-label" htmlFor="outcome-select">
            Outcome <span className="text-red-500">*</span>
          </label>
          <select
            id="outcome-select"
            value={outcome}
            onChange={(e) => {
              setOutcome(e.target.value);
              if (e.target.value !== 'Other') setOtherOutcome('');
            }}
            className={`form-select ${errors.outcome ? 'border-red-500' : ''}`}
            aria-invalid={Boolean(errors.outcome)}
          >
            <option value="">Select contact outcome...</option>
            {outcomeOptions.map((o) => (
              <option key={o.id || o.outcome} value={o.outcome}>
                {o.outcome}
              </option>
            ))}
            <option value="Other">Other</option>
          </select>
          {errors.outcome && (
            <span className="text-xs text-red-500 block mt-1" role="alert">
              {errors.outcome}
            </span>
          )}

          {outcome === 'Other' && (
            <div className="mt-2" data-error={Boolean(errors.otherOutcome)}>
              <label className="form-label text-xs" htmlFor="other-outcome-input">
                Specify Other Outcome <span className="text-red-500">*</span>
              </label>
              <input
                id="other-outcome-input"
                type="text"
                value={otherOutcome}
                onChange={(e) => setOtherOutcome(e.target.value)}
                placeholder="Enter outcome..."
                className={`form-input ${errors.otherOutcome ? 'border-red-500' : ''}`}
                aria-invalid={Boolean(errors.otherOutcome)}
                autoFocus
              />
              {errors.otherOutcome && (
                <span className="text-xs text-red-500 block mt-1" role="alert">
                  {errors.otherOutcome}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="form-group">
          <label className="form-label" htmlFor="comments-textarea">
            Comments
          </label>
          <textarea
            id="comments-textarea"
            rows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Detailed notes or follow-up instructions..."
            className="form-textarea"
          />
        </div>

        {/* Checkboxes: Mark Contact As */}
        <div className="pt-2 border-t border-gray-100">
          <span className="form-label font-medium text-xs text-gray-700 block mb-2">
            Mark Contact As:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lastContact}
                onChange={(e) => setLastContact(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <span>Date of Last Contact</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sticky}
                onChange={(e) => setSticky(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <span>Pin Contact</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <span>Notify Team</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={global}
                onChange={(e) => setGlobal(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <span>Global Registry Record</span>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddContactLogModal;
