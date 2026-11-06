// frontend/microfrontends/identity/src/components/MyAccount/PersonalDetails/ChangePasswordModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../../../shared/design-system/components/Modal';
import { toast } from '../../../../../../shared/toaster';
import { accountApi } from '../../../../../../shared/api/accountApi';
import { securitySettingsApi, PasswordPolicy } from '../../../../../../shared/api';
import { Lock, Check, X, Eye, EyeOff } from 'lucide-react';

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [policy, setPolicy] = useState<PasswordPolicy | null>(null);

  // Load authoritative site password policy
  useEffect(() => {
    if (!isOpen) return;
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);

    securitySettingsApi
      .getPasswordPolicy()
      .then((p: PasswordPolicy) => setPolicy(p))
      .catch(() => {
        // Fallback default policy if endpoint unavailable
        setPolicy({
          minimumPasswordLength: 8,
          requireMixedCase: true,
          requireDigit: true,
          requireSymbol: true,
          minimumPasswordStrength: 'MODERATE',
        });
      });
  }, [isOpen]);

  // Dynamic policy evaluation against newPassword
  const minLength = policy?.minimumPasswordLength ?? 8;
  const hasMinLength = newPassword.length >= minLength;
  const hasMixedCase = !policy?.requireMixedCase || (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword));
  const hasDigit = !policy?.requireDigit || /\d/.test(newPassword);
  const hasSymbol = !policy?.requireSymbol || /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isDiffFromCurrent = currentPassword.length > 0 && newPassword.length > 0 && newPassword !== currentPassword;

  const isFormValid =
    currentPassword.length > 0 &&
    hasMinLength &&
    hasMixedCase &&
    hasDigit &&
    hasSymbol &&
    passwordsMatch &&
    isDiffFromCurrent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword) {
      setErrorMessage('Current password is required');
      return;
    }
    if (!passwordsMatch) {
      setErrorMessage('New password and confirm password do not match');
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMessage('New password must differ from current password');
      return;
    }
    if (!isFormValid) {
      setErrorMessage('Please ensure your new password satisfies all requirements');
      return;
    }

    setIsSubmitting(true);
    try {
      await accountApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success('Password changed successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to change password';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRequirement = (label: string, valid: boolean) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.8125rem',
        color: valid ? '#16a34a' : '#64748b',
        fontWeight: valid ? 600 : 400,
      }}
    >
      {valid ? (
        <Check size={14} color="#16a34a" aria-hidden="true" />
      ) : (
        <span
          style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#cbd5e1',
            margin: '0 4px',
          }}
        />
      )}
      <span>{label}</span>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Password"
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
            disabled={isSubmitting || !isFormValid}
          >
            <Lock size={16} aria-hidden="true" style={{ marginRight: '6px' }} />
            {isSubmitting ? 'Changing Password...' : 'Change Password'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {errorMessage && (
          <div className="alert alert-danger" role="alert" style={{ margin: 0, padding: '0.75rem 1rem' }}>
            {errorMessage}
          </div>
        )}

        {/* Current Password */}
        <div className="form-group">
          <label htmlFor="current-password-input" className="form-label">
            Current Password <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="current-password-input"
              type={showCurrent ? 'text' : 'password'}
              className="form-control"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoFocus
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              className="btn btn-link"
              onClick={() => setShowCurrent(!showCurrent)}
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '4px',
                color: '#64748b',
              }}
              aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="form-group">
          <label htmlFor="new-password-input" className="form-label">
            New Password <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="new-password-input"
              type={showNew ? 'text' : 'password'}
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              className="btn btn-link"
              onClick={() => setShowNew(!showNew)}
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '4px',
                color: '#64748b',
              }}
              aria-label={showNew ? 'Hide new password' : 'Show new password'}
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Password Requirements Checklist */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
            Password Policy Requirements
          </span>
          {renderRequirement(`At least ${minLength} characters in length`, hasMinLength)}
          {policy?.requireMixedCase && renderRequirement('Contains uppercase and lowercase letters', hasMixedCase)}
          {policy?.requireDigit && renderRequirement('Contains at least one number', hasDigit)}
          {policy?.requireSymbol && renderRequirement('Contains at least one special character', hasSymbol)}
          {renderRequirement('Differs from current password', isDiffFromCurrent)}
        </div>

        {/* Confirm Password */}
        <div className="form-group">
          <label htmlFor="confirm-password-input" className="form-label">
            Confirm Password <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="confirm-password-input"
              type={showConfirm ? 'text' : 'password'}
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              className="btn btn-link"
              onClick={() => setShowConfirm(!showConfirm)}
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '4px',
                color: '#64748b',
              }}
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <div style={{ fontSize: '0.8125rem', color: '#dc2626', marginTop: '0.25rem' }}>
              Passwords do not match
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};
