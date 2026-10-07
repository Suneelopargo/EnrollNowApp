// frontend/shared/toaster/toastManager.ts - Global Event-Driven Toast Manager
import { ToastItem, ToastOptions, ToastType } from './types';

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private readonly instanceId = `toast-manager-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();
  private timers: Map<string, any> = new Map();

  constructor() {
    // Inter-module window event bus listener for cross-MFE toast dispatches
    if (typeof window !== 'undefined') {
      window.addEventListener('enrollnow_toast_dispatch', (event: any) => {
        const detail = event.detail;
        if (detail && detail.message && detail.type && detail.sourceId !== this.instanceId) {
          this.addToast(detail.type, detail.message, detail.options, false);
        }
      });
    }
  }

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const current = [...this.toasts];
    this.listeners.forEach((listener) => {
      try {
        listener(current);
      } catch {
        // Ignore subscriber errors
      }
    });
  }

  private addToast(
    type: ToastType,
    message: string,
    options: ToastOptions = {},
    dispatchGlobally = true
  ): string {
    // Keep a single active notification. A newer message replaces the current one
    // instead of stacking multiple toasts on top of the page.
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.toasts = [];

    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const duration = options.duration !== undefined ? options.duration : 6000;
    const defaultTitles: Record<ToastType, string> = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information',
    };

    const item: ToastItem = {
      id,
      type,
      title: options.title || defaultTitles[type],
      message,
      duration,
      timestamp: Date.now(),
    };

    this.toasts.push(item);
    this.notify();

    if (duration > 0) {
      const timer = setTimeout(() => {
        this.dismiss(id);
      }, duration);
      this.timers.set(id, timer);
    }

    // Broadcast across windows/microfrontends if needed
    if (dispatchGlobally && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('enrollnow_toast_dispatch', {
          detail: { type, message, options, sourceId: this.instanceId },
        })
      );
    }

    return id;
  }

  public show(type: ToastType, message: string, options?: ToastOptions): string {
    return this.addToast(type, message, options);
  }

  public success(message: string, options?: ToastOptions): string {
    return this.addToast('success', message, options);
  }

  public error(message: string, options?: ToastOptions): string {
    return this.addToast('error', message, options);
  }

  public warning(message: string, options?: ToastOptions): string {
    return this.addToast('warning', message, options);
  }

  public info(message: string, options?: ToastOptions): string {
    return this.addToast('info', message, options);
  }

  public dismiss(id: string): void {
    if (this.timers.has(id)) {
      clearTimeout(this.timers.get(id));
      this.timers.delete(id);
    }
    const prevLen = this.toasts.length;
    this.toasts = this.toasts.filter((t) => t.id !== id);
    if (this.toasts.length !== prevLen) {
      this.notify();
    }
  }

  public clear(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
    this.toasts = [];
    this.notify();
  }

  public getToasts(): ToastItem[] {
    return [...this.toasts];
  }
}

export const toast = new ToastManager();
export default toast;
