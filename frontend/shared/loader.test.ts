// frontend/shared/loader.test.ts - Unit Tests for Global Centralized Loader System
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loader, loaderManager } from './loader';
import { createApiClient } from './api-client';

describe('Global Centralized Loader System', () => {
  beforeEach(() => {
    loader.forceHide();
  });

  afterEach(() => {
    loader.forceHide();
    vi.restoreAllMocks();
  });

  it('initializes with hidden state and default message', () => {
    const state = loaderManager.getState();
    expect(state.visible).toBe(false);
    expect(state.activeRequests).toBe(0);
    expect(state.message).toBe('Processing Request & Syncing Data...');
    expect(state.title).toBe('EnrollNow');
  });

  it('shows loader and updates message and title', () => {
    loader.show('Loading Clinical Studies...', { title: 'Studies Module', subtitle: 'Fetching records' });
    const state = loaderManager.getState();

    expect(state.visible).toBe(true);
    expect(state.activeRequests).toBe(1);
    expect(state.message).toBe('Loading Clinical Studies...');
    expect(state.title).toBe('Studies Module');
    expect(state.subtitle).toBe('Fetching records');
  });

  it('handles multiple concurrent requests with ref counting', () => {
    loader.show('Request 1');
    loader.show('Request 2');
    loader.show('Request 3');

    expect(loaderManager.getState().activeRequests).toBe(3);
    expect(loaderManager.getState().visible).toBe(true);

    loader.hide();
    expect(loaderManager.getState().activeRequests).toBe(2);
    expect(loaderManager.getState().visible).toBe(true);

    loader.hide();
    expect(loaderManager.getState().activeRequests).toBe(1);
    expect(loaderManager.getState().visible).toBe(true);

    loader.hide();
    expect(loaderManager.getState().activeRequests).toBe(0);
    expect(loaderManager.getState().visible).toBe(false);
  });

  it('notifies subscribers on show, hide, and forceHide', () => {
    const listener = vi.fn();
    const unsubscribe = loaderManager.subscribe(listener);

    // Initial subscriber call
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ visible: false, activeRequests: 0 })
    );

    loader.show('Fetching user permissions');
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ visible: true, activeRequests: 1, message: 'Fetching user permissions' })
    );

    loader.hide();
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ visible: false, activeRequests: 0 })
    );

    loader.show('Step 1');
    loader.forceHide();
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ visible: false, activeRequests: 0 })
    );

    unsubscribe();
  });

  it('automatically triggers and hides loader during successful API calls', async () => {
    const client = createApiClient({ mode: 'mock', getToken: () => 'mock-jwt-admin-1' });

    expect(loaderManager.getState().visible).toBe(false);

    // Make an API call through the centralized client
    const response = await client.get('/studies');

    expect(response.status).toBe(200);
    // Loader should be hidden once the API returns
    expect(loaderManager.getState().visible).toBe(false);
    expect(loaderManager.getState().activeRequests).toBe(0);
  });

  it('automatically hides loader when an API call fails with an error', async () => {
    const client = createApiClient({ mode: 'mock', getToken: () => 'mock-jwt-admin-1' });

    // Force an error endpoint with skipToast so we don't spam toasts
    try {
      await client.get('/non-existent-endpoint-404', { skipToast: true } as any);
    } catch {
      // Expected rejection
    }

    // Loader must be cleanly closed and not dangling
    expect(loaderManager.getState().visible).toBe(false);
    expect(loaderManager.getState().activeRequests).toBe(0);
  });

  it('respects skipLoader flag and does not display overlay', async () => {
    const client = createApiClient({ mode: 'mock', getToken: () => 'mock-jwt-admin-1' });
    const listener = vi.fn();
    const unsubscribe = loaderManager.subscribe(listener);
    listener.mockClear();

    await client.get('/studies', { skipLoader: true } as any);

    // The listener should not have been called for show/hide
    expect(listener).not.toHaveBeenCalled();
    expect(loaderManager.getState().visible).toBe(false);

    unsubscribe();
  });
});
