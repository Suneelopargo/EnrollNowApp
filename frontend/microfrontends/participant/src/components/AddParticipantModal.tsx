// frontend/microfrontends/participant/src/components/AddParticipantModal.tsx - Add Participant Modal Dialog
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { validateForm, validators } from '../../../../shared/design-system/validation';
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
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

  const handleReset = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setFirstNameError('');
    setLastNameError('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Participant"
      footer={(
        <>
          <button type="submit" form="add-participant-form" className="btn btn-primary">
            <Plus size={16} /> Add Participant
          </button>
          <button type="button" onClick={handleClose} className="btn btn-secondary">Cancel</button>
        </>
      )}
    >
      <form id="add-participant-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="participant-first-name">
            First Name <span className="form-required-marker" aria-hidden="true">*</span>
          </label>
          <input
            id="participant-first-name"
            type="text"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (firstNameError) setFirstNameError('');
            }}
            placeholder={firstNameError || 'Enter First Name'}
            autoFocus
            required
            className="form-input"
            aria-invalid={!!firstNameError}
          />
        </div>

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

        <div className="form-group">
          <label className="form-label" htmlFor="participant-last-name">
            Last Name <span className="form-required-marker" aria-hidden="true">*</span>
          </label>
          <input
            id="participant-last-name"
            type="text"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              if (lastNameError) setLastNameError('');
            }}
            placeholder={lastNameError || 'Enter Last Name'}
            required
            className="form-input"
            aria-invalid={!!lastNameError}
          />
        </div>
      </form>
    </Modal>
  );
};

export default AddParticipantModal;
