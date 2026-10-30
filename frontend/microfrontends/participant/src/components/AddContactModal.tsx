// frontend/microfrontends/participant/src/components/AddContactModal.tsx - Add/Edit Participant Contact Person & Method
import React, { useState, useEffect } from 'react';
import { Check, Loader2, Archive, RotateCcw } from 'lucide-react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { participantApi, ParticipantContactDetail } from '../../../../shared/api/participantApi';

export interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  participantName: string;
  contactToEdit?: ParticipantContactDetail | null;
  tenantId?: string;
  siteId?: string;
  onContactAdded: (contact: ParticipantContactDetail) => void;
}

const DEFAULT_RELATIONSHIPS = [
  'Self',
  'Mother',
  'Father',
  'Parent / Guardian',
  'Spouse / Partner',
  'Sibling',
  'Child',
  'Caregiver',
  'Friend',
  'Other',
];

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  participantId,
  participantName,
  contactToEdit,
  tenantId,
  siteId,
  onContactAdded,
}) => {
  const isEditing = Boolean(contactToEdit?.id);

  const [contactName, setContactName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [otherRelationship, setOtherRelationship] = useState('');
  const [relationshipOptions, setRelationshipOptions] = useState<string[]>(DEFAULT_RELATIONSHIPS);
  const [contactType, setContactType] = useState('');
  const [contactValue, setContactValue] = useState('');
  const [label, setLabel] = useState('Mobile');
  const [canLeaveMessage, setCanLeaveMessage] = useState(true);
  const [notes, setNotes] = useState('');
  const [isPreferred, setIsPreferred] = useState(false);
  const [primaryContact, setPrimaryContact] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    participantApi
      .getRelationshipOptions({ tenantId, siteId })
      .then((opts) => {
        if (isMounted && Array.isArray(opts) && opts.length > 0) {
          const merged = [...opts];
          if (!merged.includes('Other')) merged.push('Other');
          setRelationshipOptions(merged);
        }
      })
      .catch(() => {});

    if (contactToEdit) {
      setContactName(contactToEdit.contactName || '');
      const rel = contactToEdit.relationship || '';
      if (!rel || DEFAULT_RELATIONSHIPS.includes(rel)) {
        setRelationship(rel);
        setOtherRelationship('');
      } else {
        setRelationship('Other');
        setOtherRelationship(rel);
      }
      setContactType(contactToEdit.contactType || '');
      setContactValue(contactToEdit.contactValue || '');
      setLabel(contactToEdit.label || '');
      setCanLeaveMessage(contactToEdit.canLeaveMessage !== false);
      setNotes(contactToEdit.notes || '');
      setIsPreferred(Boolean(contactToEdit.isPreferred));
      setPrimaryContact(Boolean(contactToEdit.primaryContact));
      setIsActive(contactToEdit.active !== false);
    } else {
      setContactName('');
      setRelationship('');
      setOtherRelationship('');
      setContactType('');
      setContactValue('');
      setLabel('Mobile');
      setCanLeaveMessage(true);
      setNotes('');
      setIsPreferred(false);
      setPrimaryContact(false);
      setIsActive(true);
    }
    setErrors({});

    return () => {
      isMounted = false;
    };
  }, [isOpen, contactToEdit, tenantId, siteId]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!contactType) {
      newErrors.contactType = 'Contact type is required';
    }

    if (!contactValue.trim()) {
      newErrors.contactValue = 'Contact value (phone or email) is required';
    } else if (contactType === 'EMAIL') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactValue.trim())) {
        newErrors.contactValue = 'Please enter a valid email address';
      }
    } else if (contactType === 'PHONE' || contactType === 'SMS') {
      const digitsOnly = contactValue.replace(/\D/g, '');
      if (digitsOnly.length < 7) {
        newErrors.contactValue = 'Please enter a valid phone number (at least 7 digits)';
      }
    }

    if (relationship === 'Other' && !otherRelationship.trim()) {
      newErrors.otherRelationship = 'Please enter the specific relationship';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const resolvedRelationship = relationship === 'Other' ? otherRelationship.trim() : relationship;
      const payload: Partial<ParticipantContactDetail> = {
        contactName: contactName.trim() || participantName,
        relationship: resolvedRelationship,
        contactType,
        contactValue: contactValue.trim(),
        label: label.trim() || undefined,
        canLeaveMessage,
        notes: notes.trim() || undefined,
        isPreferred,
        primaryContact,
        active: isActive,
      };

      let result: ParticipantContactDetail;
      if (isEditing && contactToEdit?.id) {
        result = await participantApi.updateContact(participantId, contactToEdit.id, payload, { tenantId, siteId });
        toast.success('Contact updates saved');
      } else {
        result = await participantApi.createContact(participantId, payload, { tenantId, siteId });
        toast.success('Contact added successfully');
      }

      onContactAdded(result);
      onClose();
    } catch (err: any) {
      const msg = getApiErrorMessage(err, isEditing ? 'Failed to update contact' : 'Failed to add contact');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle = isEditing
    ? `Edit Contact Methods — ${participantName}`
    : `Add Contact Method — ${participantName}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
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
                <Check size={15} /> {isEditing ? 'Save Updates' : 'Save Contact'}
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
              <option value="">Select relationship...</option>
              {relationshipOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Other Relationship input when Other is selected */}
        {relationship === 'Other' && (
          <div className="form-group" data-error={Boolean(errors.otherRelationship)}>
            <label className="form-label font-semibold text-gray-700" htmlFor="other-relationship">
              Specify Relationship <span className="text-red-500">*</span>
            </label>
            <input
              id="other-relationship"
              type="text"
              value={otherRelationship}
              onChange={(e) => setOtherRelationship(e.target.value)}
              placeholder="e.g. Case Worker, Neighbor, Grandparent"
              className={`form-input ${errors.otherRelationship ? 'border-red-500' : ''}`}
            />
            {errors.otherRelationship && (
              <span className="text-red-500 text-xs block mt-1">{errors.otherRelationship}</span>
            )}
          </div>
        )}

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
              aria-invalid={Boolean(errors.contactType)}
            >
              <option value="">Select contact type...</option>
              <option value="PHONE">Phone (Cell / Home / Work)</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="OTHER">Other</option>
            </select>
            {errors.contactType && <span className="text-red-500 text-xs block mt-1">{errors.contactType}</span>}
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

        {/* Edit mode: Archive/Active toggle */}
        {isEditing && (
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-gray-500 font-medium">Contact Status</span>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`btn btn-xs flex items-center gap-1.5 ${
                isActive ? 'btn-ghost text-amber-700 hover:bg-amber-50' : 'btn-ghost text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {isActive ? (
                <>
                  <Archive size={13} /> Archive Contact
                </>
              ) : (
                <>
                  <RotateCcw size={13} /> Restore Contact
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </Modal>
  );
};
