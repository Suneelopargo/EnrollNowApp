// frontend/microfrontends/participant/src/components/ParticipantContactManagement.tsx - Full Contact Management
import React, { useState, useEffect, useCallback } from 'react';
import { Phone, Mail, MapPin, Plus, Trash2, Loader2, Star, AlertCircle, RefreshCw, CheckCircle2, User } from 'lucide-react';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { requestConfirmation } from '../../../../shared/confirmation';
import {
  participantApi,
  ParticipantContactDetail,
  ParticipantAddressDetail,
} from '../../../../shared/api/participantApi';
import { AddContactModal } from './AddContactModal';
import { AddAddressModal } from './AddAddressModal';

export interface ParticipantContactManagementProps {
  participantId: string;
  participantName: string;
  tenantId?: string;
  siteId?: string;
  onUpdated?: () => void;
}

export const ParticipantContactManagement: React.FC<ParticipantContactManagementProps> = ({
  participantId,
  participantName,
  tenantId,
  siteId,
  onUpdated,
}) => {
  const [contacts, setContacts] = useState<ParticipantContactDetail[]>([]);
  const [addresses, setAddresses] = useState<ParticipantAddressDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);

  const fetchContactDetails = useCallback(async () => {
    if (!participantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [cData, aData] = await Promise.all([
        participantApi.getContacts(participantId, { tenantId, siteId }),
        participantApi.getAddresses(participantId, { tenantId, siteId }),
      ]);
      setContacts(Array.isArray(cData) ? cData : []);
      setAddresses(Array.isArray(aData) ? aData : []);
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to load contact information');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [participantId, tenantId, siteId]);

  useEffect(() => {
    fetchContactDetails();
  }, [fetchContactDetails]);

  const handleDeleteContact = (c: ParticipantContactDetail) => {
    void requestConfirmation({
      entityName: c.contactValue,
      intent: 'danger',
      confirmText: 'Delete Contact',
      loadingText: 'Deleting contact...',
      title: 'Delete Contact',
      message: `Delete contact "${c.contactValue}" (${c.contactName || c.relationship})?`,
      confirmWord: 'DELETE',
      onConfirm: async () => {
        try {
          await participantApi.deleteContact(participantId, c.id, { tenantId, siteId });
          toast.success('Contact deleted');
          await fetchContactDetails();
          onUpdated?.();
        } catch (err: any) {
          const msg = getApiErrorMessage(err, 'Failed to delete contact');
          toast.error(msg);
        }
      },
    });
  };

  const handleDeleteAddress = (a: ParticipantAddressDetail) => {
    void requestConfirmation({
      entityName: a.addressLine1 || 'Address',
      intent: 'danger',
      confirmText: 'Delete Address',
      loadingText: 'Deleting address...',
      title: 'Delete Address',
      message: `Delete address "${a.addressLine1}"?`,
      confirmWord: 'DELETE',
      onConfirm: async () => {
        try {
          await participantApi.deleteAddress(participantId, a.id, { tenantId, siteId });
          toast.success('Address deleted');
          await fetchContactDetails();
          onUpdated?.();
        } catch (err: any) {
          const msg = getApiErrorMessage(err, 'Failed to delete address');
          toast.error(msg);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: CONTACT METHODS & PERSONS */}
      <section className="card record-detail__panel">
        <div className="card-header flex items-center justify-between">
          <div>
            <h3>Contact Methods & Authorized Contacts</h3>
            <p>Phone numbers, emails, and relationships for outreach.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchContactDetails}
              disabled={isLoading}
              className="btn btn-ghost btn-xs text-gray-500 hover:text-gray-900"
              title="Refresh contacts"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={() => setIsAddContactOpen(true)}
              className="btn btn-sm btn-primary flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Contact
            </button>
          </div>
        </div>

        <div className="record-detail__panel-content">
          {isLoading && contacts.length === 0 && (
            <div className="p-6 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
              <Loader2 size={20} className="animate-spin text-blue-600" />
              <span className="text-xs">Loading contact methods...</span>
            </div>
          )}

          {!isLoading && contacts.length === 0 && (
            <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              No contacts recorded yet. Click &ldquo;Add Contact&rdquo; to register phone numbers or email addresses.
            </div>
          )}

          {!isLoading && contacts.length > 0 && (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              {contacts.map((c) => (
                <div key={c.id} className="p-3 flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 p-1.5 rounded-full bg-blue-50 text-blue-700">
                      {c.contactType === 'EMAIL' ? <Mail size={14} /> : <Phone size={14} />}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-gray-900 font-semibold">{c.contactValue}</strong>
                        {c.isPreferred && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-0.5">
                            <Star size={10} className="fill-amber-500" /> Preferred
                          </span>
                        )}
                        {c.primaryContact && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Primary
                          </span>
                        )}
                        {c.label && <span className="badge badge-neutral text-[10px]">{c.label}</span>}
                      </div>

                      <div className="text-[11px] text-gray-500 mt-0.5">
                        <span className="font-medium text-gray-700">{c.contactName || participantName}</span>
                        {c.relationship && ` • ${c.relationship}`}
                        {c.canLeaveMessage ? ' • Can Leave Voicemail' : ' • Do Not Leave Message'}
                      </div>

                      {c.notes && (
                        <p className="text-[11px] text-gray-600 bg-gray-50 p-1.5 rounded mt-1 border border-gray-100">
                          {c.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteContact(c)}
                    className="btn btn-ghost btn-xs text-gray-400 hover:text-red-600 p-1"
                    title="Remove contact"
                    aria-label={`Remove contact ${c.contactValue}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: PARTICIPANT ADDRESSES */}
      <section className="card record-detail__panel">
        <div className="card-header flex items-center justify-between">
          <div>
            <h3>Participant Addresses</h3>
            <p>Mailing and residential addresses associated with this record.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddAddressOpen(true)}
            className="btn btn-sm btn-primary flex items-center gap-1.5"
          >
            <Plus size={14} /> Add Address
          </button>
        </div>

        <div className="record-detail__panel-content">
          {isLoading && addresses.length === 0 && (
            <div className="p-6 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
              <Loader2 size={20} className="animate-spin text-blue-600" />
              <span className="text-xs">Loading addresses...</span>
            </div>
          )}

          {!isLoading && addresses.length === 0 && (
            <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              No addresses recorded. Click &ldquo;Add Address&rdquo; to add residential or mailing addresses.
            </div>
          )}

          {!isLoading && addresses.length > 0 && (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              {addresses.map((a) => (
                <div key={a.id} className="p-3 flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 p-1.5 rounded-full bg-emerald-50 text-emerald-700">
                      <MapPin size={14} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-gray-900 font-semibold">{a.addressLine1}</strong>
                        {a.addressLine2 && <span className="text-xs text-gray-600">{a.addressLine2}</span>}
                        {a.primaryAddress && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Primary
                          </span>
                        )}
                        <span className="badge badge-neutral text-[10px]">{a.addressType}</span>
                      </div>

                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {[a.city, a.stateRegion, a.postalCode, a.countryCode].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(a)}
                    className="btn btn-ghost btn-xs text-gray-400 hover:text-red-600 p-1"
                    title="Remove address"
                    aria-label={`Remove address ${a.addressLine1}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modals */}
      <AddContactModal
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
        participantId={participantId}
        participantName={participantName}
        tenantId={tenantId}
        siteId={siteId}
        onContactAdded={() => {
          fetchContactDetails();
          onUpdated?.();
        }}
      />

      <AddAddressModal
        isOpen={isAddAddressOpen}
        onClose={() => setIsAddAddressOpen(false)}
        participantId={participantId}
        participantName={participantName}
        tenantId={tenantId}
        siteId={siteId}
        onAddressAdded={() => {
          fetchContactDetails();
          onUpdated?.();
        }}
      />
    </div>
  );
};

export default ParticipantContactManagement;
