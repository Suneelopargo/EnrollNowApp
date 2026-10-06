// frontend/shared/confirmation/useConfirmation.ts - React Hook for Global Confirmation
import { useState, useEffect, useCallback } from 'react';
import { confirmation } from './confirmationManager';
import { ConfirmationDialogState, ConfirmationOptions } from './types';

export function useConfirmation() {
  const [state, setState] = useState<ConfirmationDialogState | null>(() =>
    confirmation.getState()
  );

  useEffect(() => {
    return confirmation.subscribe(setState);
  }, []);

  const confirm = useCallback(
    (options: ConfirmationOptions | string) => confirmation.confirm(options),
    []
  );

  const danger = useCallback(
    (
      messageOrOptions: string | Partial<ConfirmationOptions>,
      extra?: Partial<ConfirmationOptions>
    ) => confirmation.danger(messageOrOptions, extra),
    []
  );

  const deletePrompt = useCallback(
    (entityName: string, options?: Partial<ConfirmationOptions>) =>
      confirmation.delete(entityName, options),
    []
  );

  const warning = useCallback(
    (
      messageOrOptions: string | Partial<ConfirmationOptions>,
      extra?: Partial<ConfirmationOptions>
    ) => confirmation.warning(messageOrOptions, extra),
    []
  );

  const info = useCallback(
    (
      messageOrOptions: string | Partial<ConfirmationOptions>,
      extra?: Partial<ConfirmationOptions>
    ) => confirmation.info(messageOrOptions, extra),
    []
  );

  const close = useCallback((result = false) => {
    confirmation.close(result);
  }, []);

  return {
    state,
    isOpen: !!state?.isOpen,
    isLoading: !!state?.isLoading,
    confirm,
    danger,
    delete: deletePrompt,
    warning,
    info,
    close,
  };
}

export default useConfirmation;
