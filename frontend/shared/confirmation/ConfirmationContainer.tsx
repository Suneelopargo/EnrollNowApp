// frontend/shared/confirmation/ConfirmationContainer.tsx - Global Confirmation Dialog Host UI
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Trash2,
  Info,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { confirmation } from './confirmationManager';
import { useConfirmation } from './useConfirmation';
import { ConfirmationIntent } from './types';
import { useFocusTrap } from '../accessibility/useFocusTrap';

// Singleton registry to prevent multiple active ConfirmationContainers from colliding
let primaryHostInstanceId: string | null = null;
const registeredHosts = new Set<string>();

export interface ConfirmationContainerProps {
  className?: string;
}

export const ConfirmationContainer: React.FC<ConfirmationContainerProps> = ({
  className = '',
}) => {
  const instanceId = React.useId();
  const [isPrimaryHost, setIsPrimaryHost] = useState(true);

  useEffect(() => {
    registeredHosts.add(instanceId);
    if (!primaryHostInstanceId) {
      primaryHostInstanceId = instanceId;
      setIsPrimaryHost(true);
    } else {
      setIsPrimaryHost(primaryHostInstanceId === instanceId);
    }

    return () => {
      registeredHosts.delete(instanceId);
      if (primaryHostInstanceId === instanceId) {
        primaryHostInstanceId = registeredHosts.values().next().value || null;
      }
    };
  }, [instanceId]);

  const { state, isOpen, isLoading } = useConfirmation();
  const [confirmInput, setConfirmInput] = useState('');

  const trapRef = useFocusTrap<HTMLDivElement>({
    active: isOpen && isPrimaryHost,
    onEscape: () => {
      if (!isLoading) confirmation.handleCancel();
    },
    returnFocus: true,
  });

  // Reset confirmation input when dialog opens or changes
  useEffect(() => {
    setConfirmInput('');
  }, [state?.id]);

  // Note: Background scroll-lock & inert are handled via useFocusTrap reference counting

  if (!isOpen || !state || !isPrimaryHost) {
    return null;
  }

  const {
    intent = 'danger',
    title,
    message,
    details,
    confirmText,
    cancelText,
    loadingText,
    confirmWord,
    confirmInputLabel,
    confirmInputPlaceholder,
    confirmInputSubtext,
    errorMessage,
  } = state;

  const isWordRequirementSatisfied = confirmWord
    ? confirmInput.trim().toLowerCase() === confirmWord.trim().toLowerCase()
    : true;

  const isConfirmDisabled = isLoading || !isWordRequirementSatisfied;

  const renderIcon = (dialogIntent: ConfirmationIntent) => {
    switch (dialogIntent) {
      case 'danger':
        return state.entityName ? (
          <Trash2 size={24} strokeWidth={2.2} />
        ) : (
          <AlertTriangle size={24} strokeWidth={2.2} />
        );
      case 'warning':
        return <AlertTriangle size={24} strokeWidth={2.2} />;
      case 'info':
        return <Info size={24} strokeWidth={2.2} />;
      case 'success':
        return <CheckCircle2 size={24} strokeWidth={2.2} />;
      default:
        return <AlertTriangle size={24} strokeWidth={2.2} />;
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      confirmation.handleCancel();
    }
  };

  const detailsList = Array.isArray(details)
    ? details
    : typeof details === 'string'
    ? [details]
    : [];

  const dialogContent = (
    <div
      className={`enl-confirm-backdrop ${className}`}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={trapRef}
        tabIndex={-1}
        className={`enl-confirm-dialog enl-confirm-dialog--${intent}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="enl-confirm-title"
        aria-describedby="enl-confirm-message"
        aria-busy={isLoading}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Icon, Title, and Close Button */}
        <div className="enl-confirm-header">
          <div
            className={`enl-confirm-icon-wrap enl-confirm-icon-wrap--${intent}`}
            aria-hidden="true"
          >
            {renderIcon(intent)}
          </div>
          <div className="enl-confirm-title-area">
            <h2 id="enl-confirm-title" className="enl-confirm-title">
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="enl-confirm-close"
            onClick={() => confirmation.handleCancel()}
            disabled={isLoading}
            aria-label="Dismiss dialog"
          >
            <X size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>

        {/* Body Content */}
        {(message || detailsList.length > 0 || confirmWord || errorMessage) && (
          <div className="enl-confirm-body">
            {message && (
              <div id="enl-confirm-message" className="enl-confirm-message">
                {message}
              </div>
            )}

          {/* Optional Consequence / Details Callout */}
          {detailsList.length > 0 && (
            <div
              className={`enl-confirm-details enl-confirm-details--${intent}`}
            >
              <ul className="enl-confirm-details-list">
                {detailsList.map((item, index) => (
                  <li key={index} className="enl-confirm-details-item">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Optional Phrase Confirmation Input */}
          {confirmWord && (
            <div className="enl-confirm-input-section">
              {confirmInputLabel !== '' && (
                <label htmlFor="enl-confirm-input" className="enl-confirm-input-label">
                  {confirmInputLabel ? (
                    confirmInputLabel
                  ) : (
                    <>
                      To confirm, please type{' '}
                      <strong className="enl-confirm-input-code">{confirmWord}</strong> below:
                    </>
                  )}
                </label>
              )}
              <input
                id="enl-confirm-input"
                type="text"
                className="enl-confirm-input"
                placeholder={confirmInputPlaceholder !== undefined ? confirmInputPlaceholder : confirmWord}
                value={confirmInput}
                disabled={isLoading}
                autoFocus
                onChange={(e) => setConfirmInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isConfirmDisabled) {
                    confirmation.handleConfirm();
                  }
                }}
              />
              {confirmInputSubtext && (
                <div className="text-xs text-gray-500 mt-2 text-center font-normal tracking-wide">
                  {confirmInputSubtext}
                </div>
              )}
            </div>
          )}

          {/* Inline Error Banner if onConfirm Rejected */}
          {errorMessage && (
            <div className="enl-confirm-error" role="alert">
              <AlertCircle size={17} className="enl-confirm-error-icon" aria-hidden="true" />
              <div className="enl-confirm-error-text">{errorMessage}</div>
            </div>
          )}
        </div>
        )}

        {/* Footer with Actions */}
        <div className="enl-confirm-footer">
          <button
            type="button"
            className="enl-confirm-btn enl-confirm-btn--cancel"
            onClick={() => confirmation.handleCancel()}
            disabled={isLoading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`enl-confirm-btn enl-confirm-btn--confirm enl-confirm-btn--${intent}`}
            onClick={() => confirmation.handleConfirm()}
            disabled={isConfirmDisabled}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="enl-confirm-spinner" aria-hidden="true" />
                <span>{loadingText}</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return dialogContent;
  }

  return createPortal(dialogContent, document.body);
};

export default ConfirmationContainer;
