// frontend/shared/loader/loaderManager.ts - Global Centralized Loader State Manager
import { LoaderState, LoaderOptions } from './types';

type LoaderListener = (state: LoaderState) => void;

class LoaderManager {
  private readonly instanceId = `loader-manager-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  private activeRequests = 0;
  private message = 'Processing Request & Syncing Data...';
  private title = 'EnrollNow';
  private subtitle = 'Please wait while the server responds';
  private listeners: Set<LoaderListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('enrollnow_loader_show', (e: any) => {
        if (e.detail?.sourceId !== this.instanceId) {
          this.show(
            e.detail?.message,
            {
              title: e.detail?.title,
              subtitle: e.detail?.subtitle,
            },
            false
          );
        }
      });
      window.addEventListener('enrollnow_loader_hide', (e: any) => {
        if (e.detail?.sourceId !== this.instanceId) {
          this.hide(false);
        }
      });
      window.addEventListener('enrollnow_loader_force_hide', (e: any) => {
        if (e.detail?.sourceId !== this.instanceId) {
          this.forceHide(false);
        }
      });
    }
  }

  public subscribe(listener: LoaderListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch {
        // Safe callback execution
      }
    });
  }

  public getState(): LoaderState {
    return {
      visible: this.activeRequests > 0,
      message: this.message,
      title: this.title,
      subtitle: this.subtitle,
      activeRequests: this.activeRequests,
    };
  }

  public show(message?: string, options?: LoaderOptions, dispatchGlobally = true): void {
    this.activeRequests += 1;
    if (message) {
      this.message = message;
    }
    if (options?.title) {
      this.title = options.title;
    }
    if (options?.subtitle) {
      this.subtitle = options.subtitle;
    }
    this.notify();

    if (dispatchGlobally && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('enrollnow_loader_show', {
          detail: { message, ...options, sourceId: this.instanceId },
        })
      );
    }
  }

  public hide(dispatchGlobally = true): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    if (this.activeRequests === 0) {
      // Reset defaults once all active requests complete
      this.message = 'Processing Request & Syncing Data...';
      this.title = 'EnrollNow';
      this.subtitle = 'Please wait while the server responds';
    }
    this.notify();

    if (dispatchGlobally && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('enrollnow_loader_hide', {
          detail: { sourceId: this.instanceId },
        })
      );
    }
  }

  public forceHide(dispatchGlobally = true): void {
    this.activeRequests = 0;
    this.message = 'Processing Request & Syncing Data...';
    this.title = 'EnrollNow';
    this.subtitle = 'Please wait while the server responds';
    this.notify();

    if (dispatchGlobally && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('enrollnow_loader_force_hide', {
          detail: { sourceId: this.instanceId },
        })
      );
    }
  }
}

export const loaderManager = new LoaderManager();

export const loader = {
  show: (message?: string, options?: LoaderOptions) => {
    loaderManager.show(message, options, true);
  },
  hide: () => {
    loaderManager.hide(true);
  },
  forceHide: () => {
    loaderManager.forceHide(true);
  },
};

