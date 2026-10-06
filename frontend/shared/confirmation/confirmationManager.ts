// frontend/shared/confirmation/confirmationManager.ts - Global Confirmation Modal Manager
import { ConfirmationDialogState, ConfirmationOptions, ConfirmationIntent } from './types';

type ConfirmationListener = (state: ConfirmationDialogState | null) => void;

class ConfirmationManager {
  private currentState: ConfirmationDialogState | null = null;
  private listeners: Set<ConfirmationListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      // Cross-MFE window event bus listener
      window.addEventListener('enrollnow_confirm_request', (event: any) => {
        const detail = event.detail;
        if (detail && detail.id && detail.options) {
          this.confirm(detail.options).then((confirmed) => {
            window.dispatchEvent(
              new CustomEvent('enrollnow_confirm_response', {
                detail: { id: detail.id, confirmed },
              })
            );
          });
        }
      });
    }
  }

  public subscribe(listener: ConfirmationListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state = this.currentState ? { ...this.currentState } : null;
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch {
        // Ignore subscriber runtime errors
      }
    });
  }

  public getState(): ConfirmationDialogState | null {
    return this.currentState ? { ...this.currentState } : null;
  }

  /**
   * Opens the confirmation dialog and returns a Promise that resolves to:
   * - true: user confirmed and any async onConfirm action resolved
   * - false: user cancelled or dismissed the dialog
   */
  public confirm(options: ConfirmationOptions | string): Promise<boolean> {
    const normalized: ConfirmationOptions =
      typeof options === 'string'
        ? { message: options, intent: 'danger' }
        : { ...options };

    return new Promise<boolean>((resolve) => {
      // If a dialog is already open, cancel it first
      if (this.currentState && this.currentState.resolve) {
        this.currentState.resolve(false);
      }

      const id = `confirm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const intent: ConfirmationIntent = normalized.intent || 'danger';

      let defaultConfirmText = 'Confirm';
      let defaultLoadingText = 'Processing...';

      if (intent === 'danger') {
        defaultConfirmText = normalized.entityName ? `Delete ${normalized.entityName}` : 'Delete';
        defaultLoadingText = 'Deleting...';
      } else if (intent === 'warning') {
        defaultConfirmText = 'Proceed';
        defaultLoadingText = 'Updating...';
      } else if (intent === 'info') {
        defaultConfirmText = 'OK';
        defaultLoadingText = 'Working...';
      }

      this.currentState = {
        ...normalized,
        id,
        isOpen: true,
        isLoading: false,
        intent,
        title: normalized.title || (intent === 'danger' ? 'Confirm Deletion' : 'Confirmation'),
        confirmText: normalized.confirmText || defaultConfirmText,
        cancelText: normalized.cancelText || 'Cancel',
        loadingText: normalized.loadingText || defaultLoadingText,
        autoClose: normalized.autoClose !== false,
        errorMessage: null,
        resolve,
      };

      this.notify();
    });
  }

  /** Convenience helper for destructive / delete confirmations */
  public danger(
    messageOrOptions: string | Partial<ConfirmationOptions>,
    extraOptions?: Partial<ConfirmationOptions>
  ): Promise<boolean> {
    if (typeof messageOrOptions === 'string') {
      return this.confirm({
        message: messageOrOptions,
        intent: 'danger',
        ...extraOptions,
      });
    }
    return this.confirm({
      ...messageOrOptions,
      message: messageOrOptions.message || 'Are you sure you want to proceed?',
      intent: 'danger',
    });
  }

  /** Convenience helper for standard entity deletions */
  public delete(
    entityName: string,
    options: Partial<ConfirmationOptions> = {}
  ): Promise<boolean> {
    return this.confirm({
      title: `Delete ${entityName}`,
      message: `Are you sure you want to delete "${entityName}"? This action cannot be reversed.`,
      entityName,
      intent: 'danger',
      confirmText: `Delete ${entityName}`,
      loadingText: 'Deleting...',
      ...options,
    });
  }

  /** Convenience helper for warnings (e.g., discard changes) */
  public warning(
    messageOrOptions: string | Partial<ConfirmationOptions>,
    extraOptions?: Partial<ConfirmationOptions>
  ): Promise<boolean> {
    if (typeof messageOrOptions === 'string') {
      return this.confirm({
        title: 'Warning',
        message: messageOrOptions,
        intent: 'warning',
        confirmText: 'Proceed',
        ...extraOptions,
      });
    }
    return this.confirm({
      title: 'Warning',
      message: messageOrOptions.message || 'Please review before proceeding.',
      intent: 'warning',
      confirmText: 'Proceed',
      ...messageOrOptions,
    });
  }

  /** Convenience helper for info/confirmation prompts */
  public info(
    messageOrOptions: string | Partial<ConfirmationOptions>,
    extraOptions?: Partial<ConfirmationOptions>
  ): Promise<boolean> {
    if (typeof messageOrOptions === 'string') {
      return this.confirm({
        title: 'Information',
        message: messageOrOptions,
        intent: 'info',
        confirmText: 'Confirm',
        ...extraOptions,
      });
    }
    return this.confirm({
      title: 'Information',
      message: messageOrOptions.message || 'Please confirm your selection.',
      intent: 'info',
      confirmText: 'Confirm',
      ...messageOrOptions,
    });
  }

  /** Triggers the confirm execution flow (with async loader handling) */
  public async handleConfirm(): Promise<void> {
    if (!this.currentState || this.currentState.isLoading) {
      return;
    }

    const { onConfirm, autoClose, resolve } = this.currentState;

    if (typeof onConfirm === 'function') {
      this.currentState.isLoading = true;
      this.currentState.errorMessage = null;
      this.notify();

      try {
        await onConfirm();
        if (autoClose) {
          this.close(true);
        } else {
          this.currentState.isLoading = false;
          this.notify();
          if (resolve) resolve(true);
        }
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message ||
          err?.message ||
          'Operation failed. Please try again.';
        this.currentState.isLoading = false;
        this.currentState.errorMessage = errorMsg;
        this.notify();
      }
    } else {
      this.close(true);
    }
  }

  /** Cancels the dialog */
  public handleCancel(): void {
    if (!this.currentState || this.currentState.isLoading) {
      return;
    }

    if (typeof this.currentState.onCancel === 'function') {
      try {
        this.currentState.onCancel();
      } catch {
        // Ignore onCancel error
      }
    }

    this.close(false);
  }

  /** Closes and clears the current confirmation dialog */
  public close(result = false): void {
    if (!this.currentState) {
      return;
    }

    const resolver = this.currentState.resolve;
    this.currentState = null;
    this.notify();

    if (resolver) {
      resolver(result);
    }
  }
}

export const confirmation = new ConfirmationManager();
export default confirmation;
