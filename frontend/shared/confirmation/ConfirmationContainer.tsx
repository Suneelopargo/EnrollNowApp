// frontend/shared/confirmation/ConfirmationContainer.tsx - Global Confirmation Dialog Host UI
import React, { useEffect, useState } from 'react';
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

export interface ConfirmationContainerProps {
  className?: string;
}

export const ConfirmationContainer: React.FC<ConfirmationContainerProps> = ({
  className = '',
}) => {
  const { state, isOpen, isLoading } = useConfirmation();
  const [confirmInput, setConfirmInput] = useState('');

  // Reset confirmation input when dialog opens or changes
  useEffect(() => {
    setConfirmInput('');
  }, [state?.id]);

  // Lock background scrolling and attach keyboard shortcuts
  useEffect(() => {
    if (!isOpen) {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('enl-body-freeze');
      }
      return;
    }

    if (typeof document !== 'undefined') {
      document.body.classList.add('enl-body-freeze');
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        confirmation.handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (typeof document !== 'undefined') {
        document.body.classList.remove('enl-body-freeze');
      }
    };
  }, [isOpen, isLoading]);

  if (!isOpen || !state) {
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

  return (
    <div
      className={`enl-confirm-backdrop ${className}`}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className={`enl-confirm-dialog enl-confirm-dialog--${intent}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="enl-confirm-title"
        aria-describedby="enl-confirm-message"
        aria-busy={isLoading}
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
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* Body Content */}
        <div className="enl-confirm-body">
          <div id="enl-confirm-message" className="enl-confirm-message">
            {message}
          </div>

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
              <label htmlFor="enl-confirm-input" className="enl-confirm-input-label">
                To confirm, please type{' '}
                <strong className="enl-confirm-input-code">{confirmWord}</strong> below:
              </label>
              <input
                id="enl-confirm-input"
                type="text"
                className="enl-confirm-input"
                placeholder={confirmWord}
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
            </div>
          )}

          {/* Inline Error Banner if onConfirm Rejected */}
          {errorMessage && (
            <div className="enl-confirm-error" role="alert">
              <AlertCircle size={17} className="enl-confirm-error-icon" />
              <div className="enl-confirm-error-text">{errorMessage}</div>
            </div>
          )}
        </div>

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
                <Loader2 size={16} className="enl-confirm-spinner" />
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
};

export default ConfirmationContainer;
