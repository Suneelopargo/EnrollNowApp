// frontend/shared/confirmation/types.ts - Enterprise Global Confirmation Modal Types
import React from 'react';

export type ConfirmationIntent = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmationOptions {
  /** Title of the confirmation dialog (e.g., "Delete Study Protocol") */
  title?: string;

  /** Primary descriptive message or question */
  message: string | React.ReactNode;

  /** Sub-details or list of consequences */
  details?: string[] | string;

  /** Visual intent and styling theme (default: 'danger') */
  intent?: ConfirmationIntent;

  /** Label for the confirmation action button (e.g., "Delete", "Confirm", "Yes, Proceed") */
  confirmText?: string;

  /** Label for the cancel/dismiss button (default: "Cancel") */
  cancelText?: string;

  /** Text displayed on the confirm button while the async operation is running (e.g., "Deleting...", "Saving...") */
  loadingText?: string;

  /** Optional safety confirmation phrase the user must type before confirming (e.g., "DELETE" or entity code) */
  confirmWord?: string;

  /** Optional entity name for standardized delete prompts */
  entityName?: string;

  /**
   * Async or sync callback executed when user clicks confirm.
   * If a Promise is returned, the dialog displays an inline spinning loader and disables buttons
   * until the Promise resolves. If the Promise rejects, the loader stops and an error is shown.
   */
  onConfirm?: () => Promise<unknown> | unknown;

  /** Callback executed when user cancels or dismisses the dialog */
  onCancel?: () => void;

  /** Whether to automatically close the dialog after a successful onConfirm (default: true) */
  autoClose?: boolean;
}

export interface ConfirmationDialogState extends ConfirmationOptions {
  id: string;
  isOpen: boolean;
  isLoading: boolean;
  errorMessage?: string | null;
  resolve?: (value: boolean) => void;
}
