// frontend/microfrontends/identity/src/components/MyAccount/PersonalDetails/UpdateEmailModal.tsx
import React, { useState } from 'react';
import { Modal } from '../../../../../../shared/design-system/components/Modal';
import { toast } from '../../../../../../shared/toaster';
import { accountApi } from '../../../../../../shared/api/accountApi';
import { Mail, Check } from 'lucide-react';

export interface UpdateEmailModalProps {
  isOpen: boolean;
  currentEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const UpdateEmailModal: React.FC<UpdateEmailModalProps> = ({
  isOpen,
  currentEmail,
  onClose,
  onSuccess,
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) {
      setError('Please enter an email address');
      return;
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }

    if (trimmed === currentEmail.trim().toLowerCase()) {
      setError('New email must be different from current email');
      return;
    }

    setIsSubmitting(true);
    try {
      await accountApi.requestEmailChange(trimmed);
      toast.success('Verification email sent! Please check your inbox to confirm.');
      setNewEmail('');
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to request email change';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Email"
      footer={
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', width: '100%' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <Check size={16} aria-hidden="true" style={{ marginRight: '6px' }} />
            {isSubmitting ? 'Sending Request...' : 'Update Email'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
          Enter your new email address. A secure verification link will be sent to the new address.
          Your current email will remain active until the new one is verified.
        </p>

        <div className="form-group">
          <label htmlFor="update-email-input" className="form-label">
            New Email Address
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="update-email-input"
              type="email"
              className={`form-control ${error ? 'is-invalid' : ''}`}
              placeholder="e.g. user@yourcompany.com"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                if (error) setError(null);
              }}
              required
              autoFocus
              maxLength={120}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Mail
              size={18}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            />
          </div>
          {error && (
            <div className="invalid-feedback" style={{ display: 'block', marginTop: '0.25rem' }}>
              {error}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};
