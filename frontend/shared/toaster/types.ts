// frontend/shared/toaster/types.ts - Type Definitions for Global Toaster System

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick?: () => void;
  route?: string;
}

export interface ToastOptions {
  title?: string;
  duration?: number; // Duration in ms before auto-dismiss (0 for sticky)
  dismissible?: boolean;
  sticky?: boolean;
  critical?: boolean;
  action?: ToastAction;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
  timestamp: number;
  sticky?: boolean;
  action?: ToastAction;
}
