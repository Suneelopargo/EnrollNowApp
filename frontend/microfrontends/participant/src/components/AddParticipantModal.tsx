// frontend/microfrontends/participant/src/components/AddParticipantModal.tsx - Add Participant Modal Dialog
import React, { useState, useCallback, useEffect } from 'react';
import { Plus, AlertTriangle, Loader2 } from 'lucide-react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { AccessibleField } from '../../../../shared/accessibility/AccessibleField';
import { validateForm, validators } from '../../../../shared/design-system/validation';
import { participantApi } from '../../../../shared/api/participantApi';
import { ParticipantRecord } from '../types/participant';

interface AddParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (participant: ParticipantRecord) => void;
}

export const AddParticipantModal: React.FC<AddParticipantModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{ count: number; name: string } | null>(null);

  const handleReset = useCallback(() => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setFirstNameError('');
    setLastNameError('');
    setIsCheckingDuplicate(false);
    setDuplicateWarning(null);
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

  const executeAdd = () => {
    const fullName = `${firstName.trim()} ${middleName.trim() ? middleName.trim() + ' ' : ''}${lastName.trim()}`;

    const newParticipant: ParticipantRecord = {
      id: String(Date.now()),
      name: fullName,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      familyId: `FAM-${Math.floor(10000 + Math.random() * 90000)}`,
      dateCreated: new Date().toLocaleDateString('en-GB') + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      globalId: firstName.trim().slice(0, 4).toUpperCase() + Math.floor(10 + Math.random() * 90),
      timezone: 'America/New_York (EDT)',
      tags: ['New Participant'],
      contactForFutureStudies: true,
      availableToAddStudy: true,
      gender: 'Unspecified',
      age: 'N/A',
      lastContact: 'Just now',
      status: 'Active',
      studies: [],
      globalDateOfLastContact: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) + ' 09:00 AM',
      contactMethods: {
        primaryEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.org`,
        phone: '+1 (555) 019-2831',
        address: 'Clinical Center, Suite 400',
        preferredMethod: 'Email',
      },
      demographics: {
        dob: '01/01/1995',
        gender: 'Unspecified',
        ethnicity: 'Not Disclosed',
        race: 'Not Disclosed',
        primaryLanguage: 'English',
      },
      family: {
        familyRole: 'Proband',
        membersCount: 1,
        pedigreeTreeId: `PED-${Math.floor(1000 + Math.random() * 9000)}`,
        guardianName: 'N/A',
      },
      variables: []
    };

    onAdd(newParticipant);
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(
      { firstName, lastName },
      {
        firstName: [validators.required('First Name'), validators.personName('First Name')],
        lastName: [validators.required('Last Name'), validators.personName('Last Name')],
      },
    );
    setFirstNameError(validationErrors.firstName || '');
    setLastNameError(validationErrors.lastName || '');
    if (Object.keys(validationErrors).length > 0) return;

    // Perform duplicate check before adding
    setIsCheckingDuplicate(true);
    try {
      const duplicates = await participantApi.checkDuplicates(firstName.trim(), lastName.trim());
      if (duplicates && duplicates.length > 0) {
        setDuplicateWarning({
          count: duplicates.length,
          name: `${firstName.trim()} ${lastName.trim()}`,
        });
        setIsCheckingDuplicate(false);
        return;
      }
    } catch {
      // If duplicate check endpoint fails or is unavailable, allow continuing
    } finally {
      setIsCheckingDuplicate(false);
    }

    executeAdd();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Participant"
      footer={(
        <>
          <button
            type="submit"
            form="add-participant-form"
            className="btn btn-primary"
            disabled={isCheckingDuplicate}
          >
            {isCheckingDuplicate ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Checking...
              </>
            ) : (
              <>
                <Plus size={16} /> Add Participant
              </>
            )}
          </button>
          <button type="button" onClick={handleClose} className="btn btn-secondary">Cancel</button>
        </>
      )}
    >
      <form id="add-participant-form" onSubmit={handleSubmit} noValidate>
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
                Found {duplicateWarning.count} existing participant(s) named &ldquo;{duplicateWarning.name}&rdquo;.
                Would you like to proceed with creating another participant?
              </p>
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={executeAdd}
                >
                  Proceed Anyway
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setDuplicateWarning(null)}
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
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (firstNameError) setFirstNameError('');
                if (duplicateWarning) setDuplicateWarning(null);
              }}
              className="form-input"
            />
          )}
        </AccessibleField>

        <div className="form-group">
          <label className="form-label" htmlFor="participant-middle-name">Middle Name</label>
          <input
            id="participant-middle-name"
            type="text"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
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
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (lastNameError) setLastNameError('');
                if (duplicateWarning) setDuplicateWarning(null);
              }}
              className="form-input"
            />
          )}
        </AccessibleField>
      </form>
    </Modal>
  );
};

export default AddParticipantModal;
