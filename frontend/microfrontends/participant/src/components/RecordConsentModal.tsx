// frontend/microfrontends/participant/src/components/RecordConsentModal.tsx - Add/Edit Participant Consent Modal
import React, { useState, useEffect, useCallback } from 'react';
import { Check, Loader2, Paperclip, X, FileText, AlertCircle } from 'lucide-react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import {
  participantApi,
  ConsentLogItem,
  CreateConsentLogPayload,
  UpdateConsentLogPayload,
  ConsentTypeOption,
} from '../../../../shared/api/participantApi';

export const MAX_CONSENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface RecordConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  participantName: string;
  studyId?: string;
  tenantId?: string;
  siteId?: string;
  logToEdit?: ConsentLogItem | null;
  onConsentSaved?: (savedLog: ConsentLogItem) => void;
  onConsentRecorded?: (savedLog: ConsentLogItem) => void;
}

export const RecordConsentModal: React.FC<RecordConsentModalProps> = ({
  isOpen,
  onClose,
  participantId,
  participantName,
  studyId,
  tenantId,
  siteId,
  logToEdit,
  onConsentSaved,
  onConsentRecorded,
}) => {
  const isEditMode = Boolean(logToEdit?.id);

  const formatDateTimeLocal = (date: Date): string => {
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  };

  const formatDateLocal = (date: Date): string => {
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    return `${yyyy}-${MM}-${dd}`;
  };

  // Form Fields
  const [consentTitle, setConsentTitle] = useState<string>('');
  const [consentDate, setConsentDate] = useState<string>('');
  const [consentType, setConsentType] = useState<string>('');
  const [customConsentType, setCustomConsentType] = useState<string>('');
  const [isCreatingCustomType, setIsCreatingCustomType] = useState<boolean>(false);
  const [version, setVersion] = useState<string>('');
  const [consentedBy, setConsentedBy] = useState<string>('');
  const [expiration, setExpiration] = useState<string>('');
  const [comments, setComments] = useState<string>('');

  // Attachment
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeExistingAttachment, setRemoveExistingAttachment] = useState<boolean>(false);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);

  // Checkboxes
  const [lastContact, setLastContact] = useState<boolean>(false);
  const [sticky, setSticky] = useState<boolean>(false);
  const [notify, setNotify] = useState<boolean>(false);
  const [global, setGlobal] = useState<boolean>(true);

  // Options & States
  const [consentTypeOptions, setConsentTypeOptions] = useState<ConsentTypeOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const initializeForm = useCallback(() => {
    setErrors({});
    setIsCreatingCustomType(false);
    setCustomConsentType('');
    setSelectedFile(null);
    setRemoveExistingAttachment(false);

    if (logToEdit) {
      setConsentTitle(logToEdit.consentTitle || '');
      setConsentType(logToEdit.consentType || '');
      setVersion(logToEdit.version || '');
      setConsentedBy(logToEdit.consentedBy || '');
      setComments(logToEdit.comments || '');
      setSticky(Boolean(logToEdit.sticky));
      setNotify(Boolean(logToEdit.notify));
      setGlobal(Boolean(logToEdit.global));
      setLastContact(Boolean(logToEdit.lastContact));
      setExistingFileName(logToEdit.fileName || (logToEdit.fileAttached ? 'Attached Document' : null));

      if (logToEdit.consentDate) {
        try {
          setConsentDate(formatDateTimeLocal(new Date(logToEdit.consentDate)));
        } catch {
          setConsentDate(formatDateTimeLocal(new Date()));
        }
      } else {
        setConsentDate(formatDateTimeLocal(new Date()));
      }

      if (logToEdit.expiration) {
        try {
          setExpiration(formatDateLocal(new Date(logToEdit.expiration)));
        } catch {
          setExpiration('');
        }
      } else {
        setExpiration('');
      }
    } else {
      setConsentTitle('');
      setConsentDate(formatDateTimeLocal(new Date()));
      setConsentType('Initial Consent');
      setVersion('');
      setConsentedBy('');
      setExpiration('');
      setComments('');
      setSticky(false);
      setNotify(false);
      setGlobal(true);
      setLastContact(false);
      setExistingFileName(null);
    }
  }, [logToEdit]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingOptions(true);

    participantApi
      .getConsentTypeOptions({ studyId, tenantId })
      .then((opts) => {
        if (!isMounted) return;
        setConsentTypeOptions(opts);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Failed to load consent type options:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingOptions(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, studyId, tenantId]);

  useEffect(() => {
    if (isOpen) {
      initializeForm();
    }
  }, [isOpen, initializeForm]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_CONSENT_SIZE_BYTES) {
        toast.error(`Maximum size of a consent attachment is ${Math.round(MAX_CONSENT_SIZE_BYTES / (1024 * 1024))} megabytes`);
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
      setRemoveExistingAttachment(false);
    }
  };

  const handleClearSelectedFile = () => {
    setSelectedFile(null);
  };

  const handleRemoveExistingAttachment = () => {
    setRemoveExistingAttachment(true);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!consentTitle.trim()) {
      errs.consentTitle = 'Consent Title is required';
    }

    if (!consentDate) {
      errs.consentDate = 'Consent Date/Time is required';
    }

    const effectiveType = isCreatingCustomType ? customConsentType.trim() : consentType.trim();
    if (!effectiveType) {
      errs.consentType = 'Consent Type is required';
    }

    if (expiration && consentDate) {
      const expD = new Date(expiration);
      const conD = new Date(consentDate);
      if (expD < conD) {
        errs.expiration = 'Expiration date cannot be prior to Consent Date';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const effectiveType = isCreatingCustomType ? customConsentType.trim() : consentType.trim();
    const isoConsentDate = new Date(consentDate).toISOString();
    const isoExpiration = expiration ? new Date(expiration).toISOString() : undefined;

    setIsSaving(true);
    try {
      if (isEditMode && logToEdit?.id) {
        const payload: UpdateConsentLogPayload = {
          consentDate: isoConsentDate,
          consentType: effectiveType,
          consentTitle: consentTitle.trim(),
          consentedBy: consentedBy.trim() || undefined,
          version: version.trim() || undefined,
          expiration: isoExpiration,
          comments: comments.trim() || undefined,
          sticky,
          notify,
          global,
          lastContact,
          removeAttachment: removeExistingAttachment,
        };

        const updated = await participantApi.updateConsentLog(
          participantId,
          logToEdit.id,
          payload,
          selectedFile,
          { tenantId, siteId }
        );

        toast.success('Success! Consent log updated.');
        onConsentSaved?.(updated);
        onConsentRecorded?.(updated);
        onClose();
      } else {
        const payload: CreateConsentLogPayload = {
          studyId: studyId?.trim() || undefined,
          consentDate: isoConsentDate,
          consentType: effectiveType,
          consentTitle: consentTitle.trim(),
          consentedBy: consentedBy.trim() || undefined,
          version: version.trim() || undefined,
          expiration: isoExpiration,
          comments: comments.trim() || undefined,
          sticky,
          notify,
          global,
          lastContact,
        };

        const created = await participantApi.createConsentLog(
          participantId,
          payload,
          selectedFile,
          { tenantId, siteId }
        );

        toast.success('Success! Consent log added.');
        onConsentSaved?.(created);
        onConsentRecorded?.(created);
        onClose();
      }
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to save consent log.');
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
      title={isEditMode ? 'Edit Participant Consent' : 'Add Participant Consent — Record Consent Decision'}
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
            form="addParticipantConsentForm"
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
        id="addParticipantConsentForm"
        onSubmit={handleSubmit}
        className="form space-y-3.5 text-xs"
        noValidate
      >
        {/* 1. Consent Title */}
        <div className="form-group" data-error={Boolean(errors.consentTitle)}>
          <label className="form-label font-semibold text-gray-700" htmlFor="consent-title-field">
            Consent Title <span className="text-red-500">*</span>
          </label>
          <input
            id="consent-title-field"
            type="text"
            value={consentTitle}
            onChange={(e) => setConsentTitle(e.target.value)}
            placeholder="Consent title..."
            className={`form-input ${errors.consentTitle ? 'border-red-500' : ''}`}
            aria-invalid={Boolean(errors.consentTitle)}
            required
            autoFocus
          />
          {errors.consentTitle && (
            <span className="text-xs text-red-500 block mt-1" role="alert">
              {errors.consentTitle}
            </span>
          )}
        </div>

        {/* 2. Consent Date/Time */}
        <div className="form-group" data-error={Boolean(errors.consentDate)}>
          <label className="form-label font-semibold text-gray-700" htmlFor="consent-date-field">
            Consent Date <span className="text-red-500">*</span>
          </label>
          <input
            id="consent-date-field"
            type="datetime-local"
            value={consentDate}
            onChange={(e) => setConsentDate(e.target.value)}
            className={`form-input ${errors.consentDate ? 'border-red-500' : ''}`}
            aria-invalid={Boolean(errors.consentDate)}
            required
          />
          {errors.consentDate && (
            <span className="text-xs text-red-500 block mt-1" role="alert">
              {errors.consentDate}
            </span>
          )}
        </div>

        {/* 3. Consent Type */}
        <div className="form-group" data-error={Boolean(errors.consentType)}>
          <div className="flex items-center justify-between">
            <label className="form-label font-semibold text-gray-700" htmlFor="consent-type-field">
              Consent Type <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              className="text-xs text-blue-600 hover:underline cursor-pointer"
              onClick={() => {
                setIsCreatingCustomType(!isCreatingCustomType);
                if (!isCreatingCustomType) setCustomConsentType('');
              }}
            >
              {isCreatingCustomType ? 'Select from list' : '+ Add custom type'}
            </button>
          </div>

          {isCreatingCustomType ? (
            <input
              id="consent-type-custom"
              type="text"
              value={customConsentType}
              onChange={(e) => setCustomConsentType(e.target.value)}
              placeholder="Enter new consent type..."
              className={`form-input ${errors.consentType ? 'border-red-500' : ''}`}
              aria-invalid={Boolean(errors.consentType)}
            />
          ) : (
            <select
              id="consent-type-field"
              value={consentType}
              onChange={(e) => setConsentType(e.target.value)}
              className={`form-select ${errors.consentType ? 'border-red-500' : ''}`}
              aria-invalid={Boolean(errors.consentType)}
            >
              <option value="">Select...</option>
              {consentTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
          {errors.consentType && (
            <span className="text-xs text-red-500 block mt-1" role="alert">
              {errors.consentType}
            </span>
          )}
        </div>

        {/* 4. Version */}
        <div className="form-group">
          <label className="form-label font-semibold text-gray-700" htmlFor="consent-version-field">
            Version
          </label>
          <input
            id="consent-version-field"
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="e.g. 1.0, 2026-A"
            className="form-input"
          />
        </div>

        {/* 5. Consented By */}
        <div className="form-group">
          <label className="form-label font-semibold text-gray-700" htmlFor="consented-by-field">
            Consented By
          </label>
          <input
            id="consented-by-field"
            type="text"
            value={consentedBy}
            onChange={(e) => setConsentedBy(e.target.value)}
            placeholder="Consented by whom..."
            className="form-input"
          />
        </div>

        {/* 6. Expiration */}
        <div className="form-group" data-error={Boolean(errors.expiration)}>
          <label className="form-label font-semibold text-gray-700" htmlFor="consent-expiration-field">
            Expiration
          </label>
          <input
            id="consent-expiration-field"
            type="date"
            value={expiration}
            min={consentDate ? consentDate.slice(0, 10) : undefined}
            onChange={(e) => setExpiration(e.target.value)}
            className={`form-input ${errors.expiration ? 'border-red-500' : ''}`}
            aria-invalid={Boolean(errors.expiration)}
          />
          {errors.expiration && (
            <span className="text-xs text-red-500 block mt-1" role="alert">
              {errors.expiration}
            </span>
          )}
        </div>

        {/* 7. Attachment */}
        <div className="form-group">
          <label className="form-label font-semibold text-gray-700" htmlFor="consent-file-upload">
            Attachment <span className="text-gray-400 font-normal">(Max 5 MB)</span>
          </label>

          {/* Existing Attachment in Edit Mode */}
          {isEditMode && existingFileName && !removeExistingAttachment && (
            <div className="flex items-center justify-between p-2 rounded-md bg-gray-50 border border-gray-200 mb-2">
              <span className="flex items-center gap-1.5 text-gray-700 truncate">
                <FileText size={14} className="text-blue-600 shrink-0" />
                <span className="truncate">{existingFileName}</span>
              </span>
              <button
                type="button"
                onClick={handleRemoveExistingAttachment}
                className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 p-1"
                title="Remove attachment"
              >
                <X size={13} /> Remove
              </button>
            </div>
          )}

          {/* Newly Selected File */}
          {selectedFile ? (
            <div className="flex items-center justify-between p-2 rounded-md bg-blue-50 border border-blue-200">
              <span className="flex items-center gap-1.5 text-blue-900 truncate">
                <Paperclip size={14} className="text-blue-600 shrink-0" />
                <span className="truncate">{selectedFile.name}</span>
                <span className="text-blue-500 text-[10px]">
                  ({Math.round(selectedFile.size / 1024)} KB)
                </span>
              </span>
              <button
                type="button"
                onClick={handleClearSelectedFile}
                className="text-gray-400 hover:text-red-500 p-1"
                title="Clear selection"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <label
                htmlFor="consent-file-upload"
                className="btn btn-secondary btn-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Paperclip size={14} />
                {isEditMode && existingFileName && !removeExistingAttachment ? 'Replace Attachment' : 'Choose File'}
              </label>
              <input
                id="consent-file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.jpg,.jpeg,.png"
              />
              <span className="text-gray-400 text-[11px]">PDF, Word, or image</span>
            </div>
          )}
        </div>

        {/* 8. Comments */}
        <div className="form-group">
          <label className="form-label font-semibold text-gray-700" htmlFor="consent-comments-field">
            Comments
          </label>
          <textarea
            id="consent-comments-field"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            placeholder="Consent log comments..."
            className="form-textarea"
          />
        </div>

        {/* 9. Mark Consent As Checkboxes */}
        <div className="pt-2 border-t border-gray-200">
          <label className="form-label font-semibold text-gray-700 block mb-2">
            Mark Consent As
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Last Contact */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lastContact}
                onChange={(e) => setLastContact(e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-600 rounded-sm"
              />
              <span className="text-gray-700 font-medium">Contact</span>
            </label>

            {/* Pin Consent */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sticky}
                onChange={(e) => setSticky(e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-600 rounded-sm"
              />
              <span className="text-gray-700 font-medium">Pin Consent</span>
            </label>

            {/* Notify */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-600 rounded-sm"
              />
              <span className="text-gray-700 font-medium">Notify</span>
            </label>

            {/* Global */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={global}
                onChange={(e) => setGlobal(e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-600 rounded-sm"
              />
              <span className="text-gray-700 font-medium">Global</span>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default RecordConsentModal;
