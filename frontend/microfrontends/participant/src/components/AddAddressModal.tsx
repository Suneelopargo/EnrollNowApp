// frontend/microfrontends/participant/src/components/AddAddressModal.tsx - Add/Edit Participant Address
import React, { useState, useEffect } from 'react';
import { Check, Loader2, Archive, RotateCcw } from 'lucide-react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { participantApi, ParticipantAddressDetail } from '../../../../shared/api/participantApi';

export interface AddAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  participantName: string;
  addressToEdit?: ParticipantAddressDetail | null;
  tenantId?: string;
  siteId?: string;
  onAddressAdded: (addr: ParticipantAddressDetail) => void;
}

export const AddAddressModal: React.FC<AddAddressModalProps> = ({
  isOpen,
  onClose,
  participantId,
  participantName,
  addressToEdit,
  tenantId,
  siteId,
  onAddressAdded,
}) => {
  const isEditing = Boolean(addressToEdit?.id);

  const [addressType, setAddressType] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [countryCode, setCountryCode] = useState('USA');
  const [primaryAddress, setPrimaryAddress] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    if (addressToEdit) {
      setAddressType(addressToEdit.addressType || '');
      setAddressLine1(addressToEdit.addressLine1 || '');
      setAddressLine2(addressToEdit.addressLine2 || '');
      setCity(addressToEdit.city || '');
      setStateRegion(addressToEdit.stateRegion || '');
      setPostalCode(addressToEdit.postalCode || '');
      setCountryCode(addressToEdit.countryCode || 'USA');
      setPrimaryAddress(Boolean(addressToEdit.primaryAddress));
      setIsActive(addressToEdit.active !== false);
    } else {
      setAddressType('');
      setAddressLine1('');
      setAddressLine2('');
      setCity('');
      setStateRegion('');
      setPostalCode('');
      setCountryCode('USA');
      setPrimaryAddress(false);
      setIsActive(true);
    }
    setErrors({});
  }, [isOpen, addressToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine1.trim()) {
      setErrors({ addressLine1: 'Street address line 1 is required' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<ParticipantAddressDetail> = {
        addressType,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim(),
        stateRegion: stateRegion.trim(),
        postalCode: postalCode.trim(),
        countryCode: countryCode.trim() || 'USA',
        primaryAddress,
        active: isActive,
      };

      let created: ParticipantAddressDetail;
      if (isEditing && addressToEdit?.id) {
        created = await participantApi.updateAddress(participantId, addressToEdit.id, payload, { tenantId, siteId });
        toast.success('Address updates saved');
      } else {
        created = await participantApi.createAddress(participantId, payload, { tenantId, siteId });
        toast.success('Address saved successfully');
      }

      onAddressAdded(created);
      onClose();
    } catch (err: any) {
      const msg = getApiErrorMessage(err, isEditing ? 'Failed to update address' : 'Failed to save address');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle = isEditing
    ? `Edit Address — ${participantName}`
    : `Add Address — ${participantName}`;

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
            form="addAddressForm"
            className="btn btn-primary flex items-center gap-1.5"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check size={15} /> {isEditing ? 'Save Updates' : 'Save Address'}
              </>
            )}
          </button>
        </div>
      }
    >
      <form id="addAddressForm" onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label font-semibold text-gray-700" htmlFor="address-type">
              Address Type
            </label>
            <select
              id="address-type"
              value={addressType}
              onChange={(e) => setAddressType(e.target.value)}
              className="form-select"
            >
              <option value="">Select address type...</option>
              <option value="HOME">Home</option>
              <option value="MAILING">Mailing</option>
              <option value="TEMPORARY">Temporary</option>
              <option value="WORK">Work</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label font-semibold text-gray-700" htmlFor="country-code">
              Country
            </label>
            <input
              id="country-code"
              type="text"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group" data-error={Boolean(errors.addressLine1)}>
          <label className="form-label font-semibold text-gray-700" htmlFor="addr-line1">
            Street Address Line 1 <span className="text-red-500">*</span>
          </label>
          <input
            id="addr-line1"
            type="text"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            placeholder="e.g. 123 University Ave"
            className={`form-input ${errors.addressLine1 ? 'border-red-500' : ''}`}
          />
          {errors.addressLine1 && <span className="text-red-500 text-xs block mt-1">{errors.addressLine1}</span>}
        </div>

        <div className="form-group">
          <label className="form-label font-semibold text-gray-700" htmlFor="addr-line2">
            Address Line 2 (Apt, Suite, Unit)
          </label>
          <input
            id="addr-line2"
            type="text"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            placeholder="Apt 4B"
            className="form-input"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="form-group">
            <label className="form-label font-semibold text-gray-700" htmlFor="addr-city">City</label>
            <input
              id="addr-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Philadelphia"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label font-semibold text-gray-700" htmlFor="addr-state">State / Region</label>
            <input
              id="addr-state"
              type="text"
              value={stateRegion}
              onChange={(e) => setStateRegion(e.target.value)}
              placeholder="PA"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label font-semibold text-gray-700" htmlFor="addr-zip">ZIP / Postal Code</label>
            <input
              id="addr-zip"
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="19104"
              className="form-input"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
            <input
              type="checkbox"
              checked={primaryAddress}
              onChange={(e) => setPrimaryAddress(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300"
            />
            <span>Mark as primary mailing address</span>
          </label>

          {isEditing && (
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`btn btn-xs flex items-center gap-1.5 ${
                isActive ? 'btn-ghost text-amber-700 hover:bg-amber-50' : 'btn-ghost text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {isActive ? (
                <>
                  <Archive size={13} /> Archive Address
                </>
              ) : (
                <>
                  <RotateCcw size={13} /> Restore Address
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};
