import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Folder,
  Loader2,
  Plus,
  RotateCcw,
  Star,
  Trash2,
} from 'lucide-react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { requestConfirmation } from '../../../../shared/confirmation';
import {
  participantApi,
  ParticipantAddressDetail,
  ParticipantContactDetail,
} from '../../../../shared/api/participantApi';

type ContactMethodType = 'email' | 'phone-cell' | 'phone-home' | 'phone-work' | 'phone-other';

interface ContactMethodDraft {
  key: string;
  id?: string;
  contactType: ContactMethodType;
  originalContactType?: string;
  typeChanged?: boolean;
  contactValue: string;
  label?: string;
  isPreferred: boolean;
  active: boolean;
  deleted?: boolean;
}

type AddressDraft = Omit<ParticipantAddressDetail, 'id'> & {
  id?: string;
  key: string;
  deleted?: boolean;
  changed?: boolean;
};

interface FieldErrors {
  contactName?: string;
  relationship?: string;
  otherRelationship?: string;
  methods?: Record<string, string>;
}

export interface ParticipantContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  participantName: string;
  contactToEdit?: ParticipantContactDetail | null;
  contactMethods?: ParticipantContactDetail[];
  addresses: ParticipantAddressDetail[];
  tenantId?: string;
  siteId?: string;
  onSaved: () => void;
}

const METHOD_TYPES: Array<{ value: ContactMethodType; label: string }> = [
  { value: 'email', label: 'Email' },
  { value: 'phone-cell', label: 'Phone (Cell)' },
  { value: 'phone-home', label: 'Phone (Home)' },
  { value: 'phone-work', label: 'Phone (Work)' },
  { value: 'phone-other', label: 'Phone (Other)' },
];

const isContactMethodType = (value: string): value is ContactMethodType =>
  METHOD_TYPES.some((method) => method.value === value);

const DEFAULT_RELATIONSHIPS = [
  'Participant',
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

const createKey = () => `contact-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const getContactActiveState = (
  isEditing: boolean,
  methods: ParticipantContactDetail[],
): boolean => !isEditing || methods.some((method) => method.active);

const methodTypeFromContact = (contact: ParticipantContactDetail): ContactMethodType => {
  if (contact.contactType.toUpperCase() === 'EMAIL') return 'email';
  const label = (contact.label ?? '').toLowerCase();
  if (label.includes('home')) return 'phone-home';
  if (label.includes('work')) return 'phone-work';
  if (label.includes('other')) return 'phone-other';
  return 'phone-cell';
};

const backendMethodType = (type: ContactMethodType) => (type === 'email' ? 'EMAIL' : 'PHONE');

const methodLabel = (type: ContactMethodType) => {
  if (type === 'email') return 'Email';
  return type.replace('phone-', '').replace(/^./, (letter) => letter.toUpperCase());
};

const toContactMethodDraft = (contact: ParticipantContactDetail): ContactMethodDraft => ({
  key: contact.id,
  id: contact.id,
  contactType: methodTypeFromContact(contact),
  originalContactType: contact.contactType,
  contactValue: contact.contactValue,
  label: contact.label,
  isPreferred: contact.isPreferred,
  active: contact.active,
});

const toAddressDraft = (address: ParticipantAddressDetail): AddressDraft => ({
  ...address,
  key: address.id,
  changed: false,
});

const emptyAddress = (): AddressDraft => ({
  key: createKey(),
  participantId: '',
  addressType: 'HOME',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateRegion: '',
  postalCode: '',
  countryCode: 'USA',
  primaryAddress: false,
  active: true,
  createdAt: '',
});

const isAddressBlank = (address: AddressDraft) =>
  !address.addressLine1?.trim()
  && !address.addressLine2?.trim()
  && !address.city?.trim()
  && !address.stateRegion?.trim()
  && !address.postalCode?.trim();

const getRelationshipSelection = (value: string) => {
  const knownRelationship = DEFAULT_RELATIONSHIPS.find(
    (option) => option.toLowerCase() === value.trim().toLowerCase(),
  );
  const isCustomRelationship = value !== '' && !knownRelationship;

  return {
    relationship: isCustomRelationship ? 'Other' : knownRelationship ?? value,
    otherRelationship: isCustomRelationship ? value : '',
  };
};

export const ParticipantContactModal: React.FC<ParticipantContactModalProps> = ({
  isOpen,
  onClose,
  participantId,
  participantName,
  contactToEdit,
  contactMethods = [],
  addresses,
  tenantId,
  siteId,
  onSaved,
}) => {
  const isEditing = Boolean(contactToEdit?.id);
  const initialMethods = contactMethods.length > 0
    ? contactMethods
    : contactToEdit
      ? [contactToEdit]
      : [];
  const initialRelationship = getRelationshipSelection(contactToEdit?.relationship ?? '');
  const [contactName, setContactName] = useState(contactToEdit?.contactName ?? '');
  const [relationship, setRelationship] = useState(initialRelationship.relationship);
  const [otherRelationship, setOtherRelationship] = useState(initialRelationship.otherRelationship);
  const [relationshipOptions, setRelationshipOptions] = useState(DEFAULT_RELATIONSHIPS);
  const [canLeaveMessage, setCanLeaveMessage] = useState(contactToEdit?.canLeaveMessage ?? false);
  const [notes, setNotes] = useState(contactToEdit?.notes ?? '');
  const [isPreferredContact, setIsPreferredContact] = useState(
    initialMethods.some((method) => method.primaryContact),
  );
  const [isContactActive, setIsContactActive] = useState(getContactActiveState(isEditing, initialMethods));
  const [methods, setMethods] = useState<ContactMethodDraft[]>(initialMethods.map(toContactMethodDraft));
  const [addressDrafts, setAddressDrafts] = useState<AddressDraft[]>(
    contactToEdit ? addresses.map(toAddressDraft) : [],
  );
  const [showArchived, setShowArchived] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionLock = useRef(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const normalizedRelationship = relationship.trim().toLowerCase();
  const isParticipantContact = normalizedRelationship === 'self'
    || normalizedRelationship === 'participant'
    || (
      !normalizedRelationship
      && isEditing
      && contactName.trim().toLowerCase() === participantName.trim().toLowerCase()
    );
  const isSelf = isParticipantContact;

  useEffect(() => {
    if (!isOpen) return;

    const currentMethods = contactMethods.length > 0
      ? contactMethods
      : contactToEdit
        ? [contactToEdit]
        : [];
    const currentRelationship = contactToEdit?.relationship ?? '';
    const relationshipSelection = getRelationshipSelection(currentRelationship);

    setContactName(contactToEdit?.contactName ?? '');
    setRelationship(relationshipSelection.relationship);
    setOtherRelationship(relationshipSelection.otherRelationship);
    setCanLeaveMessage(contactToEdit?.canLeaveMessage ?? false);
    setNotes(contactToEdit?.notes ?? '');
    setIsPreferredContact(currentMethods.some((method) => method.primaryContact));
    setIsContactActive(getContactActiveState(Boolean(contactToEdit?.id), currentMethods));
    setMethods(currentMethods.map(toContactMethodDraft));
    setAddressDrafts(contactToEdit ? addresses.map(toAddressDraft) : []);
    setShowArchived(false);
    setErrors({});

    let active = true;
    participantApi.getRelationshipOptions({ tenantId, siteId }).then((options) => {
      if (!active || !Array.isArray(options) || options.length === 0) return;
      const merged = [...options];
      if (!merged.includes('Other')) merged.push('Other');
      if (currentRelationship && !merged.includes(currentRelationship)) merged.push(currentRelationship);
      setRelationshipOptions(merged);
    }).catch((error: unknown) => {
      if (active) {
        toast.error(getApiErrorMessage(error, 'Could not load relationship options'));
      }
    });

    return () => {
      active = false;
    };
  }, [isOpen, contactToEdit, contactMethods, addresses, tenantId, siteId]);

  const displayedMethods = useMemo(
    () => methods.filter((method) => (
      !method.deleted
      && (!isParticipantContact || !method.id || Boolean(method.contactValue.trim()))
      && (showArchived || method.active)
    )),
    [isParticipantContact, methods, showArchived],
  );
  const displayedAddresses = useMemo(
    () => addressDrafts.filter((address) => (
      !address.deleted
      && (!isParticipantContact || !address.id || !isAddressBlank(address))
      && (showArchived || address.active)
    )),
    [addressDrafts, isParticipantContact, showArchived],
  );
  const hasArchivedItems = methods.some((method) => !method.active && !method.deleted)
    || addressDrafts.some((address) => !address.active && !address.deleted);

  const addMethod = () => {
    setMethods((current) => [...current, {
      key: createKey(),
      contactType: 'email',
      contactValue: '',
      isPreferred: false,
      active: true,
    }]);
  };

  const updateMethod = (key: string, change: Partial<ContactMethodDraft>) => {
    setMethods((current) => current.map((method) => (
      method.key === key ? { ...method, ...change } : method
    )));
  };

  const toggleMethodPreferred = (key: string) => {
    setMethods((current) => current.map((method) => {
      if (method.key === key) {
        const isPreferred = !method.isPreferred;
        return { ...method, isPreferred, active: isPreferred || method.active };
      }
      return { ...method, isPreferred: false };
    }));
  };

  const removeMethod = (key: string) => {
    const method = methods.find((item) => item.key === key);
    if (!method) return;

    void requestConfirmation({
      title: 'Remove Contact Method',
      message: method.contactValue.trim()
        ? `Remove ${methodLabel(method.contactType)} "${method.contactValue.trim()}" from this contact?`
        : 'Remove this contact method?',
      details: method.id ? 'The removal will be saved when you save the contact.' : undefined,
      intent: 'danger',
      confirmText: 'Remove',
      onConfirm: async () => {
        setMethods((current) => current.flatMap((item) => {
          if (item.key !== key) return [item];
          return item.id ? [{ ...item, deleted: true }] : [];
        }));
      },
    });
  };

  const toggleMethodActive = (key: string) => {
    setMethods((current) => current.map((method) => (
      method.key === key
        ? { ...method, active: !method.active, isPreferred: method.active ? false : method.isPreferred }
        : method
    )));
  };

  const addAddress = () => setAddressDrafts((current) => [...current, emptyAddress()]);

  const updateAddress = (key: string, change: Partial<AddressDraft>) => {
    setAddressDrafts((current) => current.map((address) => (
      address.key === key ? { ...address, ...change, changed: true } : address
    )));
  };

  const toggleAddressActive = (key: string) => {
    setAddressDrafts((current) => current.map((address) => (
      address.key === key ? { ...address, active: !address.active, changed: true } : address
    )));
  };

  const removeAddress = (key: string) => {
    const address = addressDrafts.find((item) => item.key === key);
    if (!address) return;

    void requestConfirmation({
      title: 'Remove Address',
      message: address.addressLine1?.trim()
        ? `Remove "${address.addressLine1.trim()}" from this contact?`
        : 'Remove this address?',
      details: address.id ? 'The removal will be saved when you save the contact.' : undefined,
      intent: 'danger',
      confirmText: 'Remove',
      onConfirm: async () => {
        setAddressDrafts((current) => current.flatMap((item) => {
          if (item.key !== key) return [item];
          return item.id ? [{ ...item, deleted: true }] : [];
        }));
      },
    });
  };

  const toggleContactActive = () => {
    if (!isContactActive) {
      setMethods((current) => current.map((method) => ({ ...method, active: true })));
    }
    setIsContactActive((active) => !active);
  };

  const validate = (): boolean => {
    const nextErrors: FieldErrors = { methods: {} };
    if (!contactName.trim()) nextErrors.contactName = 'Contact name is required';
    if (relationship === 'Other' && !otherRelationship.trim()) {
      nextErrors.otherRelationship = 'Please specify the relationship';
    }
    methods.filter((method) => !method.deleted && (!method.id || method.contactValue.trim())).forEach((method) => {
      const value = method.contactValue.trim();
      if (!value) {
        nextErrors.methods![method.key] = 'Contact method is required';
      } else if (method.contactType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        nextErrors.methods![method.key] = 'Please enter a valid email address';
      } else if (method.contactType !== 'email'
        && !/^(?:(\+\d{1,3})\s?)?(\(\d{1,4}\)|\d{1,4})[-.*\s]?\d{1,}[-.*\s]?\d{1,}[-.*\s]?\d{1,}$/.test(value)) {
        nextErrors.methods![method.key] = 'Please enter a valid phone number';
      }
    });

    if (Object.keys(nextErrors.methods!).length === 0) delete nextErrors.methods;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submissionLock.current || !validate()) return;

    submissionLock.current = true;
    setIsSubmitting(true);
    const options = { tenantId, siteId };
    const resolvedRelationship = relationship === 'Other' ? otherRelationship.trim() : relationship;
    try {
      const methodsWithValues = methods.filter((method) => !method.deleted && method.contactValue.trim());
      const savedMethodIds = new Set<string>();
      const buildContactPayload = (method?: ContactMethodDraft): Partial<ParticipantContactDetail> => ({
          contactType: method
            ? (method.typeChanged || !method.originalContactType
              ? backendMethodType(method.contactType)
              : method.originalContactType)
            : '',
          contactValue: method?.contactValue.trim() ?? '',
          label: method
            ? (method.typeChanged ? methodLabel(method.contactType) : (method.label || methodLabel(method.contactType)))
            : '',
          contactName: contactName.trim(),
          relationship: resolvedRelationship,
          canLeaveMessage,
          notes: notes.trim() || undefined,
          primaryContact: isPreferredContact,
          isPreferred: method?.isPreferred ?? false,
          active: (method?.active ?? true) && isContactActive,
        });

      if (methodsWithValues.length > 0) {
        for (const method of methodsWithValues) {
          const saved = method.id
            ? await participantApi.updateContact(participantId, method.id, buildContactPayload(method), options)
            : await participantApi.createContact(participantId, buildContactPayload(method), options);
          savedMethodIds.add(saved.id);
        }
      } else {
        const existingContact = methods.find((method) => method.id);
        const saved = existingContact?.id
          ? await participantApi.updateContact(
            participantId,
            existingContact.id,
            buildContactPayload(),
            options,
          )
          : await participantApi.createContact(participantId, buildContactPayload(), options);
        savedMethodIds.add(saved.id);
      }

      for (const method of methods) {
        if (method.id && !savedMethodIds.has(method.id)) {
          await participantApi.deleteContact(participantId, method.id, options);
        }
      }

      for (const address of addressDrafts.filter((item) => !item.deleted && !isAddressBlank(item))) {
        if (address.id && !address.changed) continue;
        const payload: Partial<ParticipantAddressDetail> = {
          addressType: address.addressType || 'HOME',
          addressLine1: address.addressLine1?.trim(),
          addressLine2: address.addressLine2?.trim() || undefined,
          city: address.city?.trim(),
          stateRegion: address.stateRegion?.trim(),
          postalCode: address.postalCode?.trim(),
          countryCode: address.countryCode?.trim() || 'USA',
          primaryAddress: address.primaryAddress,
          active: address.active,
        };
        const saved = address.id
          ? await participantApi.updateAddress(participantId, address.id, payload, options)
          : await participantApi.createAddress(participantId, payload, options);
        setAddressDrafts((current) => current.map((item) => (
          item.key === address.key ? { ...item, ...saved, key: saved.id, changed: false } : item
        )));
      }

      for (const address of addressDrafts) {
        if (address.deleted && address.id) {
          await participantApi.deleteAddress(participantId, address.id, options);
          setAddressDrafts((current) => current.filter((item) => item.key !== address.key));
        }
      }

      toast.success(isEditing ? 'Contact updates saved' : 'Contact added');
      onSaved();
      onClose();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, isEditing ? 'Failed to save contact updates' : 'Failed to add contact'));
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = () => {
    if (!isEditing || isSelf) return;
    void requestConfirmation({
      entityName: contactName,
      intent: 'danger',
      confirmText: 'Delete Contact',
      loadingText: 'Deleting contact...',
      title: 'Delete Contact',
      message: `Delete contact "${contactName}" and its contact methods?`,
      confirmWord: 'DELETE',
      onConfirm: async () => {
        try {
          for (const method of methods) {
            if (method.id) await participantApi.deleteContact(participantId, method.id, { tenantId, siteId });
          }
          toast.success('Contact deleted');
          onSaved();
          onClose();
        } catch (error: unknown) {
          toast.error(getApiErrorMessage(error, 'Failed to delete contact'));
        }
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title={isEditing ? (isParticipantContact ? 'Edit Contact Methods' : 'Edit Contact') : 'Add Contact'}
      size="wide"
      className="participant-contact-modal"
      footer={(
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowArchived((show) => !show)}
              disabled={isSubmitting}
              aria-pressed={showArchived}
            >
              {showArchived ? 'Hide Archived Methods' : 'Show Archived Methods'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && !isSelf && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleDeleteContact}
                disabled={isSubmitting}
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" form="participant-contact-form" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    >
      <form id="participant-contact-form" onSubmit={handleSubmit} className="space-y-4">
        <section className="participant-contact-modal__section">
          <div className="participant-contact-modal__row">
            <label htmlFor="participant-contact-name">{isParticipantContact ? 'Preferred Name' : 'Contact Name'}</label>
            <div>
              <input
                id="participant-contact-name"
                className="form-input"
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
                placeholder={`e.g. ${participantName}`}
                required
                aria-invalid={Boolean(errors.contactName)}
              />
              <span className="participant-contact-modal__required">*required</span>
              {errors.contactName && <span className="text-red-600 text-xs">{errors.contactName}</span>}
            </div>
            <button
              type="button"
              className={`btn btn-ghost participant-contact-modal__icon ${isPreferredContact ? 'text-amber-600' : ''}`}
              onClick={() => setIsPreferredContact((preferred) => !preferred)}
              data-tooltip={isPreferredContact ? 'Preferred Contact' : 'Mark as Preferred Contact'}
              aria-label={isPreferredContact ? 'Remove preferred contact status' : 'Mark as preferred contact'}
            >
              <Star size={18} fill={isPreferredContact ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              className={`btn btn-ghost participant-contact-modal__icon ${!isContactActive ? 'text-amber-600' : ''}`}
              onClick={toggleContactActive}
              data-tooltip={!isContactActive ? 'Restore Contact' : 'Archive Contact'}
              aria-label={!isContactActive ? 'Restore contact' : 'Archive contact'}
            >
              {!isContactActive ? <RotateCcw size={18} /> : <Folder size={18} />}
            </button>
          </div>
          {!isParticipantContact && (
            <div className="participant-contact-modal__row">
              <label htmlFor="participant-contact-relationship">Relationship to Participant</label>
              <div>
                <select
                  id="participant-contact-relationship"
                  className="form-select"
                  value={relationship}
                  onChange={(event) => setRelationship(event.target.value)}
                >
                  <option value="">Relationship</option>
                  {relationshipOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {relationship === 'Other' && (
                  <input
                    className="form-input mt-2"
                    value={otherRelationship}
                    onChange={(event) => setOtherRelationship(event.target.value)}
                    placeholder="Other relationship"
                    aria-label="Other relationship"
                    aria-invalid={Boolean(errors.otherRelationship)}
                  />
                )}
                {errors.otherRelationship && <span className="text-red-600 text-xs">{errors.otherRelationship}</span>}
              </div>
              <span />
              <span />
            </div>
          )}
          <div className="participant-contact-modal__row">
            <label htmlFor="contact-can-leave-message">Can Leave a Message</label>
            <input
              id="contact-can-leave-message"
              type="checkbox"
              checked={canLeaveMessage}
              onChange={(event) => setCanLeaveMessage(event.target.checked)}
            />
            <span />
            <span />
          </div>
          <div className="participant-contact-modal__row">
            <label htmlFor="participant-contact-notes">Notes</label>
            <textarea
              id="participant-contact-notes"
              className="form-textarea"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Notes"
            />
            <span />
            <span />
          </div>
        </section>

        <section className="participant-contact-modal__collection">
          <h4>Contact Methods</h4>
          <div className="participant-contact-modal__collection-content">
            {displayedMethods.map((method) => (
              <div className="participant-contact-modal__item" key={method.key}>
                <select
                  className="form-select"
                  aria-label="Contact method type"
                  value={method.contactType}
                  onChange={(event) => {
                    if (isContactMethodType(event.target.value)) {
                      updateMethod(method.key, { contactType: event.target.value, typeChanged: true });
                    }
                  }}
                >
                  {METHOD_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
                <div>
                  <input
                    className="form-input"
                    value={method.contactValue}
                    onChange={(event) => updateMethod(method.key, { contactValue: event.target.value })}
                    placeholder="Information"
                    aria-label={`${METHOD_TYPES.find((type) => type.value === method.contactType)?.label ?? 'Contact'} information`}
                    aria-invalid={Boolean(errors.methods?.[method.key])}
                  />
                  {errors.methods?.[method.key] && <span className="text-red-600 text-xs">{errors.methods[method.key]}</span>}
                </div>
                <button
                  type="button"
                  className={`btn btn-ghost participant-contact-modal__icon ${method.isPreferred ? 'text-amber-600' : ''}`}
                  onClick={() => toggleMethodPreferred(method.key)}
                  data-tooltip={method.isPreferred ? 'Preferred Contact Method' : 'Mark as Preferred Contact Method'}
                  aria-label={method.isPreferred ? 'Remove preferred method' : 'Mark as preferred method'}
                >
                  <Star size={17} fill={method.isPreferred ? 'currentColor' : 'none'} />
                </button>
                <button
                  type="button"
                  className={`btn btn-ghost participant-contact-modal__icon ${method.active ? '' : 'text-amber-600'}`}
                  onClick={() => toggleMethodActive(method.key)}
                  data-tooltip={method.active ? 'Archive Contact Method' : 'Restore Contact Method'}
                  aria-label={method.active ? 'Archive contact method' : 'Restore contact method'}
                >
                  {method.active ? <Folder size={17} /> : <RotateCcw size={17} />}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost participant-contact-modal__icon text-red-600"
                  onClick={() => removeMethod(method.key)}
                  data-tooltip="Delete Contact Method"
                  aria-label="Delete contact method"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className={`participant-contact-modal__add-action ${displayedMethods.length > 0 ? 'participant-contact-modal__add-action--after-items' : ''}`}
              onClick={addMethod}
            >
              <Plus size={14} /> Add Contact Method
            </button>
          </div>
        </section>

        <section className="participant-contact-modal__collection">
          <h4>Address</h4>
          <div className="participant-contact-modal__collection-content">
            {displayedAddresses.map((address) => (
              <div className="participant-contact-modal__address" key={address.key}>
                <div>
                  <input
                    className="form-input"
                    value={address.addressLine1 ?? ''}
                    onChange={(event) => updateAddress(address.key, { addressLine1: event.target.value })}
                    placeholder="Address 1"
                    aria-label="Address 1"
                  />
                </div>
                <button
                  type="button"
                  className={`btn btn-ghost participant-contact-modal__icon ${address.active ? '' : 'text-amber-600'}`}
                  onClick={() => toggleAddressActive(address.key)}
                  data-tooltip={address.active ? 'Archive Address' : 'Restore Address'}
                  aria-label={address.active ? 'Archive address' : 'Restore address'}
                >
                  {address.active ? <Folder size={17} /> : <RotateCcw size={17} />}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost participant-contact-modal__icon text-red-600"
                  onClick={() => removeAddress(address.key)}
                  data-tooltip="Delete Address"
                  aria-label="Delete address"
                >
                  <Trash2 size={17} />
                </button>
                <input
                  className="form-input participant-contact-modal__address-line2"
                  value={address.addressLine2 ?? ''}
                  onChange={(event) => updateAddress(address.key, { addressLine2: event.target.value })}
                  placeholder="Address 2"
                  aria-label="Address 2"
                />
                <div className="participant-contact-modal__address-fields">
                  <input
                    className="form-input"
                    value={address.city ?? ''}
                    onChange={(event) => updateAddress(address.key, { city: event.target.value })}
                    placeholder="City"
                    aria-label="City"
                  />
                  <input
                    className="form-input"
                    value={address.stateRegion ?? ''}
                    onChange={(event) => updateAddress(address.key, { stateRegion: event.target.value })}
                    placeholder="State/Province"
                    aria-label="State or province"
                  />
                  <input
                    className="form-input"
                    value={address.postalCode ?? ''}
                    onChange={(event) => updateAddress(address.key, { postalCode: event.target.value })}
                    placeholder="ZIP/Postcode"
                    aria-label="ZIP or postcode"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              className={`participant-contact-modal__add-action ${displayedAddresses.length > 0 ? 'participant-contact-modal__add-action--after-items' : ''}`}
              onClick={addAddress}
            >
              <Plus size={14} /> Add Address
            </button>
          </div>
        </section>
      </form>
    </Modal>
  );
};

export default ParticipantContactModal;
