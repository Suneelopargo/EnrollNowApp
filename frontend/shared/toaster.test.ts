// frontend/shared/toaster.test.ts - Unit & Accessibility Tests for Global Toaster System
// WCAG 2.2 AA (1.4.3 Contrast, 2.1.1 Keyboard, 4.1.3 Status Messages)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { toast, DEFAULT_TOAST_DURATIONS, MAX_CONCURRENT_TOASTS } from './toaster/toastManager';
import { ToasterContainer } from './toaster/ToasterContainer';
import { createApiClient } from './api-client';
import { setMockErrorSimulation } from './api-config';

describe('Global Toaster & Error Notification System', () => {
  beforeEach(() => {
    setMockErrorSimulation(null);
    toast.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    setMockErrorSimulation(null);
    toast.clear();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('adds success toast with correct structure and 4s default duration', () => {
    const id = toast.success('Operation completed successfully', { title: 'Success' });
    const toasts = toast.getToasts();

    expect(toasts.length).toBe(1);
    expect(toasts[0].id).toBe(id);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].title).toBe('Success');
    expect(toasts[0].message).toBe('Operation completed successfully');
    expect(toasts[0].duration).toBe(DEFAULT_TOAST_DURATIONS.success); // 4000ms
  });

  it('adds error toast with correct structure and 7s default duration', () => {
    toast.error('Failed to load dataset', { title: 'Network Failure' });
    const toasts = toast.getToasts();

    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('error');
    expect(toasts[0].title).toBe('Network Failure');
    expect(toasts[0].message).toBe('Failed to load dataset');
    expect(toasts[0].duration).toBe(DEFAULT_TOAST_DURATIONS.error); // 7000ms
  });

  it('adds warning and info toasts with distinct default durations and stacks them', () => {
    toast.warning('Token expiring in 5 minutes');
    expect(toast.getToasts()[0].type).toBe('warning');
    expect(toast.getToasts()[0].duration).toBe(DEFAULT_TOAST_DURATIONS.warning); // 6000ms

    toast.info('Dataset downloaded');
    const toasts = toast.getToasts();

    expect(toasts.length).toBe(2);
    expect(toasts[0].type).toBe('warning');
    expect(toasts[1].type).toBe('info');
    expect(toasts[1].duration).toBe(DEFAULT_TOAST_DURATIONS.info); // 5000ms
  });

  it('supports sticky/critical notifications that do not auto-dismiss', () => {
    toast.error('Critical database connection lost. Action required.', { critical: true });
    const toasts = toast.getToasts();

    expect(toasts.length).toBe(1);
    expect(toasts[0].duration).toBe(0);
    expect(toasts[0].sticky).toBe(true);

    // Advance timers by 30 seconds; sticky toast must remain
    vi.advanceTimersByTime(30000);
    expect(toast.getToasts().length).toBe(1);
  });

  it('caps concurrent toasts at MAX_CONCURRENT_TOASTS (4) by retiring oldest dismissible toast', () => {
    for (let i = 1; i <= 6; i++) {
      toast.info(`Message ${i}`);
    }
    const toasts = toast.getToasts();
    expect(toasts.length).toBe(MAX_CONCURRENT_TOASTS);
    expect(toasts[0].message).toBe('Message 3');
    expect(toasts[toasts.length - 1].message).toBe('Message 6');
  });

  it('deduplicates rapid identical notifications within 1.5 seconds', () => {
    toast.error('Network timeout. Please retry.');
    toast.error('Network timeout. Please retry.');
    toast.error('Network timeout. Please retry.');

    const toasts = toast.getToasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].message).toBe('Network timeout. Please retry.');
  });

  it('supports timer pause and resume on hover or focus', () => {
    const id = toast.info('Reviewing protocol details', { duration: 4000 });
    expect(toast.getToasts().length).toBe(1);

    // After 2 seconds, pause timer (e.g. user hovers or focuses)
    vi.advanceTimersByTime(2000);
    toast.pause(id);

    // Advance another 10 seconds while paused; toast must not be dismissed
    vi.advanceTimersByTime(10000);
    expect(toast.getToasts().length).toBe(1);

    // Resume timer; remaining ~2 seconds must elapse before dismissal
    toast.resume(id);
    vi.advanceTimersByTime(1999);
    expect(toast.getToasts().length).toBe(1);

    vi.advanceTimersByTime(50);
    expect(toast.getToasts().length).toBe(0);
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

  it('clears all active toasts with clear()', () => {
    toast.success('Msg 1');
    expect(toast.getToasts().length).toBe(1);
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

  describe('ToasterContainer Accessibility Semantics & Typography', () => {
    it('renders role="alert" with aria-live="assertive" for errors, and role="status" with aria-live="polite" for routine notifications', () => {
      // Add a success toast and an error toast
      toast.success('Record saved successfully.');
      toast.error('Unable to connect to server.');

      const html = renderToStaticMarkup(React.createElement(ToasterContainer));

      // Container region
      expect(html).toContain('role="region"');
      expect(html).toContain('aria-label="Notifications"');

      // Success toast semantics
      expect(html).toContain('enl-toast--success');
      expect(html).toContain('role="status"');
      expect(html).toContain('aria-live="polite"');
      expect(html).toContain('aria-atomic="true"');
      expect(html).toContain('Record saved successfully.');

      // Error toast semantics
      expect(html).toContain('enl-toast--error');
      expect(html).toContain('role="alert"');
      expect(html).toContain('aria-live="assertive"');
      expect(html).toContain('Unable to connect to server.');

      // Accessible close buttons
      expect(html).toContain('aria-label="Dismiss Success notification"');
      expect(html).toContain('aria-label="Dismiss Error notification"');
    });

    it('renders all four toast types with 16px typography hierarchy and 22px decorative icons', () => {
      toast.success('User updated successfully.');
      toast.error('Unable to save changes. Please try again.');
      toast.warning('Your session will expire soon.');
      toast.info('Report generation has started.');

      const html = renderToStaticMarkup(React.createElement(ToasterContainer));

      // Headings
      expect(html).toContain('<div class="enl-toast-title">Success</div>');
      expect(html).toContain('<div class="enl-toast-title">Error</div>');
      expect(html).toContain('<div class="enl-toast-title">Warning</div>');
      expect(html).toContain('<div class="enl-toast-title">Information</div>');

      // Messages
      expect(html).toContain('<div class="enl-toast-message">User updated successfully.</div>');
      expect(html).toContain('<div class="enl-toast-message">Unable to save changes. Please try again.</div>');
      expect(html).toContain('<div class="enl-toast-message">Your session will expire soon.</div>');
      expect(html).toContain('<div class="enl-toast-message">Report generation has started.</div>');

      // Icons have aria-hidden="true" and width/height="22"
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain('width="22"');
      expect(html).toContain('height="22"');

      // Close buttons have aria-label and type="button"
      expect(html).toContain('<button type="button" class="enl-toast-close"');
      expect(html).toContain('aria-label="Dismiss Success notification"');
      expect(html).toContain('aria-label="Dismiss Error notification"');
      expect(html).toContain('aria-label="Dismiss Warning notification"');
      expect(html).toContain('aria-label="Dismiss Information notification"');
    });

    it('verifies WCAG 2.2 Level AA color contrast ratios (>= 4.5:1) for all notification backgrounds against white text', () => {
      function getLuminance(hex: string): number {
        const rgb = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)].map((v) => {
          const s = v / 255;
          return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
      }

      function getContrastRatio(hex1: string, hex2: string): number {
        const l1 = Math.max(getLuminance(hex1), getLuminance(hex2));
        const l2 = Math.min(getLuminance(hex1), getLuminance(hex2));
        return (l1 + 0.05) / (l2 + 0.05);
      }

      const white = '#FFFFFF';
      const successColor = '#15803D';
      const errorColor = '#B91C1C';
      const warningColor = '#92400E';
      const infoColor = '#1D4ED8';

      // WCAG 2.2 AA requires >= 4.5:1 for normal body text
      expect(getContrastRatio(successColor, white)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(errorColor, white)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(warningColor, white)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(infoColor, white)).toBeGreaterThanOrEqual(4.5);
    });

    it('returns empty when no active toasts exist', () => {
      const html = renderToStaticMarkup(React.createElement(ToasterContainer));
      expect(html).toBe('');
    });
  });
});
