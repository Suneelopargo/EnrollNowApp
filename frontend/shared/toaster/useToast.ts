// frontend/shared/toaster/useToast.ts - React Hook for Toaster System
import { useState, useEffect } from 'react';
import { toast } from './toastManager';
import { ToastItem, ToastOptions } from './types';

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>(() => toast.getToasts());

  useEffect(() => {
    const unsubscribe = toast.subscribe((updatedToasts) => {
      setToasts(updatedToasts);
    });
    return unsubscribe;
  }, []);

  return {
    toasts,
    toast,
    success: (msg: string, opts?: ToastOptions) => toast.success(msg, opts),
    error: (msg: string, opts?: ToastOptions) => toast.error(msg, opts),
    warning: (msg: string, opts?: ToastOptions) => toast.warning(msg, opts),
    info: (msg: string, opts?: ToastOptions) => toast.info(msg, opts),
    dismiss: (id: string) => toast.dismiss(id),
    clear: () => toast.clear(),
  };
}

export default useToast;
