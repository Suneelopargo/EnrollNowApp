// frontend/shared/toaster.test.ts - Unit Tests for Global Toaster System
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toast } from './toaster/toastManager';
import { createApiClient } from './api-client';

describe('Global Toaster & Error Notification System', () => {
  beforeEach(() => {
    toast.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    toast.clear();
    vi.useRealTimers();
  });

  it('adds success toast with correct structure', () => {
    const id = toast.success('Operation completed successfully', { title: 'Success' });
    const toasts = toast.getToasts();

    expect(toasts.length).toBe(1);
    expect(toasts[0].id).toBe(id);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].title).toBe('Success');
    expect(toasts[0].message).toBe('Operation completed successfully');
  });

  it('adds error toast with correct structure', () => {
    toast.error('Failed to load dataset', { title: 'Network Failure' });
    const toasts = toast.getToasts();

    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('error');
    expect(toasts[0].title).toBe('Network Failure');
    expect(toasts[0].message).toBe('Failed to load dataset');
  });

  it('adds warning and info toasts', () => {
    toast.warning('Token expiring in 5 minutes');
    toast.info('Dataset downloaded');
    const toasts = toast.getToasts();

    expect(toasts.length).toBe(2);
    expect(toasts[0].type).toBe('warning');
    expect(toasts[1].type).toBe('info');
  });

  it('notifies subscribers when toasts are added or dismissed', () => {
    const listener = vi.fn();
    const unsubscribe = toast.subscribe(listener);

    // Initial subscriber call
    expect(listener).toHaveBeenCalledWith([]);

    const id = toast.success('Item saved');
    expect(listener).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id })]));

    toast.dismiss(id);
    expect(listener).toHaveBeenCalledWith([]);

    unsubscribe();
  });

  it('auto-dismisses toast after specified duration', () => {
    toast.info('Temporary alert', { duration: 3000 });
    expect(toast.getToasts().length).toBe(1);

    vi.advanceTimersByTime(2999);
    expect(toast.getToasts().length).toBe(1);

    vi.advanceTimersByTime(2);
    expect(toast.getToasts().length).toBe(0);
  });

  it('caps concurrent toasts at maximum limit (5)', () => {
    for (let i = 1; i <= 7; i++) {
      toast.info(`Message ${i}`);
    }
    const toasts = toast.getToasts();
    expect(toasts.length).toBe(5);
    // Oldest messages should have been dropped
    expect(toasts[0].message).toBe('Message 3');
    expect(toasts[4].message).toBe('Message 7');
  });

  it('clears all active toasts with clear()', () => {
    toast.success('Msg 1');
    toast.error('Msg 2');
    expect(toast.getToasts().length).toBe(2);

    toast.clear();
    expect(toast.getToasts().length).toBe(0);
  });

  it('dispatches error toast automatically on API errors from Axios interceptor', async () => {
    vi.useRealTimers();
    const toastErrorSpy = vi.spyOn(toast, 'error');

    const client = createApiClient({
      mode: 'mock',
    });

    try {
      // Calling protected endpoint without token triggers 401
      await client.get('/api/v1/dashboard/overview');
    } catch {
      // Expected error
    }

    expect(toastErrorSpy).toHaveBeenCalled();
  });

  it('suppresses automatic toast if request config has skipToast=true', async () => {
    vi.useRealTimers();
    const toastErrorSpy = vi.spyOn(toast, 'error');

    const client = createApiClient({
      mode: 'mock',
    });

    try {
      await client.get('/api/v1/dashboard/overview', {
        skipToast: true,
      } as any);
    } catch {
      // Expected error
    }

    expect(toastErrorSpy).not.toHaveBeenCalled();
  });
});
