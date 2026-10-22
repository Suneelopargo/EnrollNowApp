// frontend/shared/toaster/toastManager.ts - Global Event-Driven Toast Manager
// Supports WCAG 2.2 AA (Color Contrast, Non-Text Contrast, Timing & Dismissal)

import { ToastItem, ToastOptions, ToastType } from './types';

type ToastListener = (toasts: ToastItem[]) => void;

interface ToastTimerEntry {
  timeoutId: any;
  startTime: number;
  remaining: number;
  paused: boolean;
}

export const DEFAULT_TOAST_DURATIONS: Record<ToastType, number> = {
  success: 4000, // ~4 seconds
  info: 5000,    // ~5 seconds
  warning: 6000, // ~6 seconds
  error: 7000,   // ~7 seconds for standard recoverable errors
};

export const MAX_CONCURRENT_TOASTS = 4;

class ToastManager {
  private readonly instanceId = `toast-manager-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();
  private timers: Map<string, ToastTimerEntry> = new Map();

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
    // 1. Deduplication: Prevent rapid identical duplicate notifications within 1500ms
    const existingDuplicate = this.toasts.find(
      (t) => t.type === type && t.message === message && Date.now() - t.timestamp < 1500
    );

    if (existingDuplicate) {
      this.restartTimer(existingDuplicate.id, existingDuplicate.duration);
      return existingDuplicate.id;
    }

    // 2. Determine duration: sticky/critical notifications have duration = 0 (manual dismiss only)
    const isSticky = options.sticky === true || options.critical === true || options.duration === 0;
    let computedDuration = options.duration !== undefined ? options.duration : DEFAULT_TOAST_DURATIONS[type];
    // Automatically scale reading duration for long messages (e.g. legacy multi-sentence instructions)
    if (options.duration === undefined && message && message.length > 90) {
      computedDuration = Math.max(computedDuration, 12000);
    }
    const duration = isSticky ? 0 : computedDuration;

    // 3. Stacking limit: Retire oldest non-sticky toast if reaching MAX_CONCURRENT_TOASTS
    while (this.toasts.length >= MAX_CONCURRENT_TOASTS) {
      const oldestDismissibleIndex = this.toasts.findIndex((t) => t.duration > 0);
      if (oldestDismissibleIndex !== -1) {
        this.dismiss(this.toasts[oldestDismissibleIndex].id);
      } else {
        this.dismiss(this.toasts[0].id);
      }
    }

    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
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
      sticky: isSticky,
      action: options.action,
    };

    this.toasts.push(item);
    this.notify();

    // 4. Start auto-dismiss timer if duration > 0
    if (duration > 0) {
      const timeoutId = setTimeout(() => {
        this.dismiss(id);
      }, duration);

      this.timers.set(id, {
        timeoutId,
        startTime: Date.now(),
        remaining: duration,
        paused: false,
      });
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

  /**
   * Pauses the auto-dismiss timer when the user hovers over or focuses a toast.
   */
  public pause(id: string): void {
    const entry = this.timers.get(id);
    if (entry && !entry.paused) {
      clearTimeout(entry.timeoutId);
      const elapsed = Date.now() - entry.startTime;
      entry.remaining = Math.max(1000, entry.remaining - elapsed);
      entry.paused = true;
    }
  }

  /**
   * Resumes the auto-dismiss timer when the user moves focus or mouse away.
   */
  public resume(id: string): void {
    const entry = this.timers.get(id);
    if (entry && entry.paused && entry.remaining > 0) {
      entry.startTime = Date.now();
      entry.paused = false;
      entry.timeoutId = setTimeout(() => {
        this.dismiss(id);
      }, entry.remaining);
    }
  }

  private restartTimer(id: string, duration: number): void {
    const existing = this.timers.get(id);
    if (existing) {
      clearTimeout(existing.timeoutId);
      this.timers.delete(id);
    }
    if (duration > 0) {
      const timeoutId = setTimeout(() => {
        this.dismiss(id);
      }, duration);
      this.timers.set(id, {
        timeoutId,
        startTime: Date.now(),
        remaining: duration,
        paused: false,
      });
    }
  }

  public dismiss(id: string): void {
    const entry = this.timers.get(id);
    if (entry) {
      clearTimeout(entry.timeoutId);
      this.timers.delete(id);
    }
    const prevLen = this.toasts.length;
    this.toasts = this.toasts.filter((t) => t.id !== id);
    if (this.toasts.length !== prevLen) {
      this.notify();
    }
  }

  public clear(): void {
    this.timers.forEach((entry) => clearTimeout(entry.timeoutId));
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
