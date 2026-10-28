// frontend/microfrontends/participant/src/components/AddAddressModal.tsx - Add Participant Address
import React, { useState } from 'react';
import { MapPin, Check, Loader2 } from 'lucide-react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { participantApi, ParticipantAddressDetail } from '../../../../shared/api/participantApi';

export interface AddAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  participantName: string;
  tenantId?: string;
  siteId?: string;
  onAddressAdded: (addr: ParticipantAddressDetail) => void;
}

export const AddAddressModal: React.FC<AddAddressModalProps> = ({
  isOpen,
  onClose,
  participantId,
  participantName,
  tenantId,
  siteId,
  onAddressAdded,
}) => {
  const [addressType, setAddressType] = useState('HOME');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [countryCode, setCountryCode] = useState('USA');
  const [primaryAddress, setPrimaryAddress] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine1.trim()) {
      setErrors({ addressLine1: 'Street address line 1 is required' });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await participantApi.createAddress(
        participantId,
        {
          addressType,
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || undefined,
          city: city.trim(),
          stateRegion: stateRegion.trim(),
          postalCode: postalCode.trim(),
          countryCode,
          primaryAddress,
        },
        { tenantId, siteId }
      );

      toast.success('Address saved successfully');
      onAddressAdded(created);
      onClose();
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to save address');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Address — ${participantName}`}
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
                <Check size={15} /> Save Address
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

        <div className="pt-2 border-t border-gray-100">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
            <input
              type="checkbox"
              checked={primaryAddress}
              onChange={(e) => setPrimaryAddress(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300"
            />
            <span>Mark as primary mailing address</span>
          </label>
        </div>
      </form>
    </Modal>
  );
};
