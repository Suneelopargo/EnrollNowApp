// frontend/microfrontends/administration/src/components/ResetAllPasswordsModal.tsx
import React from 'react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { Clock } from 'lucide-react';

export interface ResetAllPasswordsModalProps {
  isOpen: boolean;
  onForceReset: () => Promise<void> | void;
  onLeaveIntact: () => void;
  isResetting?: boolean;
}

export const ResetAllPasswordsModal: React.FC<ResetAllPasswordsModalProps> = ({
  isOpen,
  onForceReset,
  onLeaveIntact,
  isResetting = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isResetting ? () => {} : onLeaveIntact}
      title="Reset Password for All Users in Team"
      className="sec-reset-passwords-global-modal"
      footer={
        <div className="sec-modal-footer-row">
          <button
            type="button"
            className="sec-btn-force-reset"
            onClick={onForceReset}
            disabled={isResetting}
          >
            {isResetting ? (
              <>
                <Clock className="animate-spin" size={14} style={{ display: 'inline', marginRight: 6 }} />
                <span>Resetting All Passwords...</span>
              </>
            ) : (
              <>
                <span className="sec-btn-minus-icon" aria-hidden="true">—</span>
                <span>Force reset all passwords</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="sec-btn-leave-intact report-action-button"
            onClick={onLeaveIntact}
            disabled={isResetting}
          >
            Leave existing passwords intact
          </button>
        </div>
      }
    >
      <p className="sec-modal-body-copy">
        You just changed the password requirements for the team. New passwords will have to comply with
        the new requirements, but current passwords can&apos;t be checked. You can choose to reset all
        passwords in the team, or do nothing and wait for users to create new passwords.
      </p>
    </Modal>
  );
};

export default ResetAllPasswordsModal;
