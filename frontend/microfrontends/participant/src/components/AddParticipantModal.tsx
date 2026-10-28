// frontend/microfrontends/participant/src/components/AddParticipantModal.tsx - Add Participant Modal Dialog
import React, { useState, useCallback, useEffect } from 'react';
import { Plus, AlertTriangle, Loader2 } from 'lucide-react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { AccessibleField } from '../../../../shared/accessibility/AccessibleField';
import { validateForm, validators } from '../../../../shared/design-system/validation';
import { participantApi, CreateParticipantPayload } from '../../../../shared/api/participantApi';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { ParticipantRecord } from '../types/participant';

export interface AddParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (participant: ParticipantRecord | any) => void;
  onSuccess?: (participant: any) => void;
  tenantId?: string;
  siteId?: string;
}

export const AddParticipantModal: React.FC<AddParticipantModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  onSuccess,
  tenantId,
  siteId,
}) => {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');

  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participantExists, setParticipantExists] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{ count: number; name: string } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleReset = useCallback(() => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setFirstNameError('');
    setLastNameError('');
    setIsCheckingDuplicate(false);
    setIsSubmitting(false);
    setParticipantExists(false);
    setDuplicateWarning(null);
    setServerError(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen, handleReset]);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  if (!isOpen) return null;

  const submitParticipant = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setServerError(null);

    const payload: CreateParticipantPayload = {
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim(),
    };

    try {
      const created = await participantApi.createParticipant(payload, {
        params: { tenantId, siteId },
      });

      handleReset();
      onClose();

      if (onSuccess) {
        onSuccess(created);
      } else if (onAdd) {
        onAdd(created);
      }
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to add participant to registry. Please try again.');
      setServerError(msg);
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validateForm(
      { firstName: firstName.trim(), lastName: lastName.trim() },
      {
        firstName: [validators.required('First Name'), validators.personName('First Name')],
        lastName: [validators.required('Last Name'), validators.personName('Last Name')],
      },
    );
    setFirstNameError(validationErrors.firstName || '');
    setLastNameError(validationErrors.lastName || '');
    if (Object.keys(validationErrors).length > 0) return;

    // If duplicate confirmation already shown and user submits, proceed with creation
    if (participantExists) {
      await submitParticipant();
      return;
    }

    // Phase 1: Duplicate check
    setIsCheckingDuplicate(true);
    try {
      const duplicates = await participantApi.checkDuplicates(firstName.trim(), lastName.trim(), {
        params: { tenantId, siteId },
      });

      if (duplicates && duplicates.length > 0) {
        setParticipantExists(true);
        setDuplicateWarning({
          count: duplicates.length,
          name: `${firstName.trim()} ${lastName.trim()}`,
        });
        setIsCheckingDuplicate(false);
        return;
      }
    } catch (err: any) {
      // Safe failure policy: do not silently bypass required duplicate check
      const msg = getApiErrorMessage(err, 'Failed to verify potential duplicates. Please check your connection and try again.');
      setServerError(msg);
      setIsCheckingDuplicate(false);
      return;
    } finally {
      setIsCheckingDuplicate(false);
    }

    // Phase 2: If no duplicates, submit immediately
    await submitParticipant();
  };

  const handleInputChange = (field: 'firstName' | 'middleName' | 'lastName', value: string) => {
    if (field === 'firstName') {
      setFirstName(value);
      if (firstNameError) setFirstNameError('');
    } else if (field === 'middleName') {
      setMiddleName(value);
    } else if (field === 'lastName') {
      setLastName(value);
      if (lastNameError) setLastNameError('');
    }

    // Reset duplicate state if user alters names
    if (participantExists) {
      setParticipantExists(false);
      setDuplicateWarning(null);
    }
    if (serverError) setServerError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Participant"
      footer={(
        <>
          {!participantExists ? (
            <button
              type="submit"
              form="add-participant-form"
              className="btn btn-primary"
              id="add-participant-submit-btn"
              disabled={isCheckingDuplicate || isSubmitting}
            >
              {isCheckingDuplicate ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Checking...
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Plus size={16} /> Add Participant
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              id="confirm-add-participant-btn"
              onClick={submitParticipant}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Plus size={16} /> Confirm Add Participant
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-secondary"
            id="add-participant-cancel-btn"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </>
      )}
    >
      <form id="add-participant-form" onSubmit={handleSubmit} noValidate>
        {serverError && (
          <div
            className="alert alert-error"
            role="alert"
            style={{
              marginBottom: '1.25rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #f87171',
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          >
            {serverError}
          </div>
        )}

        {duplicateWarning && (
          <div
            className="alert alert-warning"
            role="alert"
            style={{
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              backgroundColor: '#fffbeb',
              border: '1px solid #fcd34d',
              borderRadius: '6px',
            }}
          >
            <AlertTriangle size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#92400e', display: 'block', marginBottom: '0.25rem' }}>
                Potential Duplicate Participant
              </strong>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#b45309' }}>
                A matching participant with the same First Name &amp; Last Name already exits. Please confim that you still want to add this participant.
              </p>
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={submitParticipant}
                  disabled={isSubmitting}
                >
                  Confirm Add Participant
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setParticipantExists(false);
                    setDuplicateWarning(null);
                  }}
                  disabled={isSubmitting}
                >
                  Review Name
                </button>
              </div>
            </div>
          </div>
        )}

        <AccessibleField
          id="participant-first-name"
          label="First Name"
          required
          value={firstName}
          error={firstNameError}
          placeholder="Enter First Name"
        >
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="text"
              name="firstName"
              value={firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="form-input"
              autoFocus
            />
          )}
        </AccessibleField>

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label" htmlFor="participant-middle-name">Middle Name</label>
          <input
            id="participant-middle-name"
            name="middleName"
            type="text"
            value={middleName}
            onChange={(e) => handleInputChange('middleName', e.target.value)}
            placeholder="Enter Middle Name"
            className="form-input"
          />
        </div>

        <AccessibleField
          id="participant-last-name"
          label="Last Name"
          required
          value={lastName}
          error={lastNameError}
          placeholder="Enter Last Name"
        >
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="text"
              name="lastName"
              value={lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="form-input"
            />
          )}
        </AccessibleField>
      </form>
    </Modal>
  );
};

export default AddParticipantModal;
