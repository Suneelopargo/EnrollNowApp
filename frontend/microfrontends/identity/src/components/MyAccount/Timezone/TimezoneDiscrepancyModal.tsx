// frontend/microfrontends/identity/src/components/MyAccount/Timezone/TimezoneDiscrepancyModal.tsx
import React, { useState } from 'react';
import { Modal } from '../../../../../../shared/design-system/components/Modal';
import { toast } from '../../../../../../shared/toaster';
import { accountApi } from '../../../../../../shared/api/accountApi';
import { Check, X, Clock } from 'lucide-react';

export interface TimezoneDiscrepancyModalProps {
  isOpen: boolean;
  detectedTimezone: string;
  configuredTimezone: string;
  onClose: () => void;
  onTimezoneUpdated?: (newTz: string) => void;
  currentFirstName?: string | null;
  currentLastName?: string | null;
}

export const TimezoneDiscrepancyModal: React.FC<TimezoneDiscrepancyModalProps> = ({
  isOpen,
  detectedTimezone,
  configuredTimezone,
  onClose,
  onTimezoneUpdated,
  currentFirstName,
  currentLastName,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleConfirmChange = async () => {
    setIsUpdating(true);
    try {
      await accountApi.updateProfile({
        timezone: detectedTimezone,
        ...(currentFirstName ? { firstName: currentFirstName } : {}),
        ...(currentLastName ? { lastName: currentLastName } : {}),
      });
      toast.success(`Time zone updated to ${detectedTimezone}`);
      onTimezoneUpdated?.(detectedTimezone);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update time zone');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNeverAskAgain = async () => {
    setIsUpdating(true);
    try {
      await accountApi.updateProfile({
        ignoreTimezoneMismatch: true,
        ...(currentFirstName ? { firstName: currentFirstName } : {}),
        ...(currentLastName ? { lastName: currentLastName } : {}),
      });
      toast.success('Preference saved: Will not prompt for timezone discrepancy');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save preference');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Timezone Discrepancy Detected"
      footer={
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', width: '100%', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isUpdating}
          >
            <X size={15} aria-hidden="true" style={{ marginRight: '6px' }} />
            No
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleNeverAskAgain}
            disabled={isUpdating}
          >
            Never Ask Me Again
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirmChange}
            disabled={isUpdating}
          >
            <Check size={15} aria-hidden="true" style={{ marginRight: '6px' }} />
            {isUpdating ? 'Updating...' : 'Yes, Update Timezone'}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: '#e0f2fe',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Clock size={22} aria-hidden="true" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0, fontSize: '0.9375rem', color: '#1e293b' }}>
            Your account is currently set to <strong>{configuredTimezone}</strong>, but your browser reports{' '}
            <strong>{detectedTimezone}</strong>.
          </p>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
            Would you like to change your account time zone to <strong>{detectedTimezone}</strong>?
          </p>
        </div>
      </div>
    </Modal>
  );
};
