// frontend/microfrontends/participant/src/components/AddParticipantModal.tsx - Add Participant Modal Dialog
import React, { useState } from 'react';
import { X, Plus, UserPlus } from 'lucide-react';
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
    let hasError = false;

    if (!firstName.trim()) {
      setFirstNameError('First Name is required');
      hasError = true;
    }

    if (!lastName.trim()) {
      setLastNameError('Last Name is required');
      hasError = true;
    }

    if (hasError) return;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 flex flex-col transform transition-all">
        <div className="bg-[#1976d2] px-6 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-black/15 text-black flex items-center justify-center shrink-0 shadow-2xs">
              <UserPlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h2 className="text-xl font-bold text-black tracking-tight m-0">Add Participant</h2>
          </div>
          
          <button
            type="button"
            onClick={handleClose}
            className="text-black/80 hover:text-black hover:bg-black/15 rounded-full p-1.5 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 flex flex-col gap-5 text-sm">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[100px] flex items-center gap-1">
              First Name <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (firstNameError) setFirstNameError('');
                }}
                placeholder={firstNameError ? firstNameError : "Enter First Name"}
                autoFocus
                className={`w-full border-2 rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all ${
                  firstNameError
                    ? 'border-red-500 bg-red-50/20 text-red-600 placeholder-red-500 font-medium pr-10 focus:border-red-600 focus:ring-4 focus:ring-red-500/10'
                    : 'border-gray-300 text-gray-800 placeholder-gray-400 focus:border-[#1976d2] focus:ring-4 focus:ring-blue-500/10'
                }`}
              />
              {firstNameError && (
                <div className="absolute right-3 pointer-events-none flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-fade-in">
                    <X className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[100px]">
              Middle Name
            </label>
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="Enter Middle Name"
                className="w-full border border-gray-300 focus:border-[#1976d2] focus:ring-4 focus:ring-blue-500/10 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 outline-none shadow-2xs transition-all placeholder-gray-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[100px] flex items-center gap-1">
              Last Name <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (lastNameError) setLastNameError('');
                }}
                placeholder={lastNameError ? lastNameError : "Enter Last Name"}
                className={`w-full border-2 rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all ${
                  lastNameError
                    ? 'border-red-500 bg-red-50/20 text-red-600 placeholder-red-500 font-medium pr-10 focus:border-red-600 focus:ring-4 focus:ring-red-500/10'
                    : 'border-gray-300 text-gray-800 placeholder-gray-400 focus:border-[#1976d2] focus:ring-4 focus:ring-blue-500/10'
                }`}
              />
              {lastNameError && (
                <div className="absolute right-3 pointer-events-none flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-fade-in">
                    <X className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 w-full">
            <button
              type="submit"
              className="bg-[#1976d2] hover:bg-[#1565c0] text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-sm font-medium transition-all cursor-pointer shadow-xs hover:shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Participant</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddParticipantModal;
