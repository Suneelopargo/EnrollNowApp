// frontend/microfrontends/participant/src/components/AddContactModal.tsx - Add Participant Contact Person & Method
import React, { useState } from 'react';
import { User, Check, Loader2 } from 'lucide-react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { participantApi, ParticipantContactDetail } from '../../../../shared/api/participantApi';

export interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  participantName: string;
  tenantId?: string;
  siteId?: string;
  onContactAdded: (contact: ParticipantContactDetail) => void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  participantId,
  participantName,
  tenantId,
  siteId,
  onContactAdded,
}) => {
  const [contactName, setContactName] = useState('');
  const [relationship, setRelationship] = useState('Self');
  const [contactType, setContactType] = useState('PHONE');
  const [contactValue, setContactValue] = useState('');
  const [label, setLabel] = useState('Mobile');
  const [canLeaveMessage, setCanLeaveMessage] = useState(true);
  const [notes, setNotes] = useState('');
  const [isPreferred, setIsPreferred] = useState(false);
  const [primaryContact, setPrimaryContact] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!contactValue.trim()) {
      newErrors.contactValue = 'Contact value (phone or email) is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await participantApi.createContact(
        participantId,
        {
          contactName: contactName.trim() || participantName,
          relationship: relationship || 'Self',
          contactType,
          contactValue: contactValue.trim(),
          label,
          canLeaveMessage,
          notes: notes.trim(),
          isPreferred,
          primaryContact,
        },
        { tenantId, siteId }
      );

      toast.success('Contact added successfully');
      onContactAdded(created);
      onClose();
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to add contact');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Contact Method — ${participantName}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="submit"
            form="addContactPersonForm"
            className="btn btn-primary flex items-center gap-1.5"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check size={15} /> Save Contact
              </>
            )}
          </button>
        </div>
      }
    >
      <form id="addContactPersonForm" onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Contact Person Name */}
          <div className="form-group">
            <label className="form-label font-semibold text-gray-700" htmlFor="contact-person-name">
              Contact Person Name
            </label>
            <input
              id="contact-person-name"
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Mary Doe (or leave blank if self)"
              className="form-input"
            />
          </div>

          {/* Relationship */}
          <div className="form-group">
            <label className="form-label font-semibold text-gray-700" htmlFor="contact-relationship">
              Relationship to Participant
            </label>
            <select
              id="contact-relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="form-select"
            >
              <option value="Self">Self (Participant)</option>
              <option value="Mother">Mother</option>
              <option value="Father">Father</option>
              <option value="Parent / Guardian">Parent / Guardian</option>
              <option value="Spouse / Partner">Spouse / Partner</option>
              <option value="Sibling">Sibling</option>
              <option value="Caregiver">Caregiver</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Method Type */}
          <div className="form-group">
            <label className="form-label font-semibold text-gray-700" htmlFor="method-type">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              id="method-type"
              value={contactType}
              onChange={(e) => setContactType(e.target.value)}
              className="form-select"
            >
              <option value="PHONE">Phone</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Value */}
          <div className="form-group sm:col-span-2" data-error={Boolean(errors.contactValue)}>
            <label className="form-label font-semibold text-gray-700" htmlFor="method-value">
              Phone Number or Email <span className="text-red-500">*</span>
            </label>
            <input
              id="method-value"
              type="text"
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              placeholder={contactType === 'EMAIL' ? 'name@example.com' : '+1 (555) 000-0000'}
              className={`form-input ${errors.contactValue ? 'border-red-500' : ''}`}
            />
            {errors.contactValue && <span className="text-red-500 text-xs block mt-1">{errors.contactValue}</span>}
          </div>
        </div>

        {/* Label */}
        <div className="form-group">
          <label className="form-label font-semibold text-gray-700" htmlFor="method-label">
            Label
          </label>
          <input
            id="method-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Mobile, Home, Work, School"
            className="form-input"
          />
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="form-label font-semibold text-gray-700" htmlFor="contact-notes">
            Notes & Outreach Instructions
          </label>
          <textarea
            id="contact-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Best times to call, preferred language, voicemail instructions..."
            className="form-textarea text-xs"
          />
        </div>

        {/* Checkboxes */}
        <div className="pt-2 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={canLeaveMessage}
              onChange={(e) => setCanLeaveMessage(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300"
            />
            <span>Can Leave Message?</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPreferred}
              onChange={(e) => setIsPreferred(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300"
            />
            <span>Preferred Method</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={primaryContact}
              onChange={(e) => setPrimaryContact(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300"
            />
            <span>Primary Contact</span>
          </label>
        </div>
      </form>
    </Modal>
  );
};
