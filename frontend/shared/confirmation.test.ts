// frontend/shared/confirmation.test.ts - Unit Tests for Global Confirmation System
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { confirmation } from './confirmation/confirmationManager';

describe('Global Confirmation Box & Async Loader System', () => {
  beforeEach(() => {
    confirmation.close(false);
  });

  it('opens confirmation modal and updates state', () => {
    let currentState = confirmation.getState();
    expect(currentState).toBeNull();

    confirmation.confirm({
      title: 'Delete Protocol',
      message: 'Are you sure you want to delete this study protocol?',
      intent: 'danger',
    });

    currentState = confirmation.getState();
    expect(currentState).not.toBeNull();
    expect(currentState?.isOpen).toBe(true);
    expect(currentState?.title).toBe('Delete Protocol');
    expect(currentState?.intent).toBe('danger');
    expect(currentState?.confirmText).toBe('Delete');
    expect(currentState?.isLoading).toBe(false);
  });

  it('resolves true when handleConfirm is triggered', async () => {
    const confirmPromise = confirmation.confirm('Confirm action?');
    expect(confirmation.getState()?.isOpen).toBe(true);

    await confirmation.handleConfirm();
    const result = await confirmPromise;

    expect(result).toBe(true);
    expect(confirmation.getState()).toBeNull();
  });

  it('resolves false when handleCancel is triggered', async () => {
    const onCancelMock = vi.fn();
    const confirmPromise = confirmation.confirm({
      message: 'Do you want to proceed?',
      onCancel: onCancelMock,
    });

    confirmation.handleCancel();
    const result = await confirmPromise;

    expect(result).toBe(false);
    expect(onCancelMock).toHaveBeenCalled();
    expect(confirmation.getState()).toBeNull();
  });

  it('supports delete convenience method with formatted title and buttons', () => {
    confirmation.delete('Participant #1042');

    const state = confirmation.getState();
    expect(state?.title).toBe('Delete Participant #1042');
    expect(state?.confirmText).toBe('Delete Participant #1042');
    expect(state?.intent).toBe('danger');
    expect(state?.loadingText).toBe('Deleting...');
  });

  it('supports warning and info convenience methods', () => {
    confirmation.warning('Unsaved changes will be discarded');
    let state = confirmation.getState();
    expect(state?.intent).toBe('warning');
    expect(state?.confirmText).toBe('Proceed');

    confirmation.info('Protocol submitted for review');
    state = confirmation.getState();
    expect(state?.intent).toBe('info');
    expect(state?.confirmText).toBe('Confirm');
  });

  it('handles async onConfirm callback with loader state and automatic resolution', async () => {
    let resolveApi: () => void = () => {};
    const apiPromise = new Promise<void>((res) => {
      resolveApi = res;
    });

    const onConfirmMock = vi.fn(() => apiPromise);

    const promise = confirmation.confirm({
      title: 'Delete Site',
      message: 'Deleting site data...',
      onConfirm: onConfirmMock,
      loadingText: 'Deleting site...',
    });

    // Initiate confirm
    const handlePromise = confirmation.handleConfirm();

    // Verify loading spinner state is active
    let state = confirmation.getState();
    expect(state?.isLoading).toBe(true);
    expect(onConfirmMock).toHaveBeenCalledTimes(1);

    // Resolve API response
    resolveApi();
    await handlePromise;
    const result = await promise;

    expect(result).toBe(true);
    expect(confirmation.getState()).toBeNull();
  });

  it('handles async onConfirm rejection gracefully with error message and keeps modal open for retry', async () => {
    const onConfirmMock = vi.fn(() =>
      Promise.reject(new Error('Network connection timed out'))
    );

    const promise = confirmation.confirm({
      title: 'Delete User',
      message: 'Remove user access?',
      onConfirm: onConfirmMock,
    });

    await confirmation.handleConfirm();

    // Dialog must stay open, loading stopped, error message populated
    const state = confirmation.getState();
    expect(state?.isOpen).toBe(true);
    expect(state?.isLoading).toBe(false);
    expect(state?.errorMessage).toBe('Network connection timed out');

    // User can cancel or retry
    confirmation.handleCancel();
    const result = await promise;
    expect(result).toBe(false);
  });

  it('subscribes and unsubscribes state listeners correctly', () => {
    const listener = vi.fn();
    const unsubscribe = confirmation.subscribe(listener);

    expect(listener).toHaveBeenCalledWith(null);

    confirmation.confirm('First message');
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'First message', isOpen: true })
    );

    unsubscribe();
    confirmation.close();
    // After unsubscribe, listener should not be called again
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('handles cross-window custom events seamlessly', async () => {
    const originalWindow = (globalThis as any).window;
    const target = originalWindow || new EventTarget();
    (globalThis as any).window = target;

    const eventHandler = vi.fn();
    target.addEventListener('enrollnow_confirm_response', eventHandler);

    // Re-bind manager event listener on target
    target.addEventListener('enrollnow_confirm_request', (event: any) => {
      const detail = event.detail;
      if (detail && detail.id && detail.options) {
        confirmation.confirm(detail.options).then((confirmed) => {
          target.dispatchEvent(
            new CustomEvent('enrollnow_confirm_response', {
              detail: { id: detail.id, confirmed },
            })
          );
        });
      }
    });

    // Dispatch request from outside/another MFE
    target.dispatchEvent(
      new CustomEvent('enrollnow_confirm_request', {
        detail: {
          id: 'req-42',
          options: {
            message: 'Cross-MFE confirmation test',
          },
        },
      })
    );

    const state = confirmation.getState();
    expect(state?.isOpen).toBe(true);
    expect(state?.message).toBe('Cross-MFE confirmation test');

    await confirmation.handleConfirm();

    expect(eventHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          id: 'req-42',
          confirmed: true,
        }),
      })
    );

    target.removeEventListener('enrollnow_confirm_response', eventHandler);
    (globalThis as any).window = originalWindow;
  });
});
