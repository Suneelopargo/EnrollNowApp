// frontend/shared/toaster/types.ts - Type Definitions for Global Toaster System

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  duration?: number; // Duration in ms before auto-dismiss (0 for sticky)
  dismissible?: boolean;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
  timestamp: number;
}
