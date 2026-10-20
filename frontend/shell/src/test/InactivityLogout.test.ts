// frontend/shell/src/test/InactivityLogout.test.ts - Verification Suite for End-to-End Inactivity Auto-Logout
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  InactivityManager,
  STORAGE_KEY_LAST_ACTIVE,
  STORAGE_KEY_SESSION_LOGOUT,
  STORAGE_KEY_INACTIVITY_MINUTES,
  INACTIVITY_BROADCAST_CHANNEL,
} from '../auth/inactivityManager';
import { securitySettingsApi } from '../../../shared/api/securitySettingsApi';

vi.mock('../../../shared/api/securitySettingsApi', () => ({
  securitySettingsApi: {
    getSecuritySettings: vi.fn(),
  },
}));

// In-memory localStorage mock
const storage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, val: string) => {
    storage[key] = String(val);
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
  clear: () => {
    Object.keys(storage).forEach((k) => delete storage[k]);
  },
};
Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

// Mock window and document event system in Node environment
const windowListeners: Record<string, ((e: any) => void)[]> = {};
const docListeners: Record<string, ((e: any) => void)[]> = {};

const mockWindow = {
  addEventListener: (type: string, listener: any) => {
    windowListeners[type] = windowListeners[type] || [];
    windowListeners[type].push(listener);
  },
  removeEventListener: (type: string, listener: any) => {
    if (windowListeners[type]) {
      windowListeners[type] = windowListeners[type].filter((l) => l !== listener);
    }
  },
  dispatchEvent: (event: any) => {
    const list = windowListeners[event.type] || [];
    list.forEach((fn) => fn(event));
    return true;
  },
};
Object.defineProperty(globalThis, 'window', {
  value: mockWindow,
  writable: true,
  configurable: true,
});

const mockDocument = {
  visibilityState: 'visible',
  addEventListener: (type: string, listener: any) => {
    docListeners[type] = docListeners[type] || [];
    docListeners[type].push(listener);
  },
  removeEventListener: (type: string, listener: any) => {
    if (docListeners[type]) {
      docListeners[type] = docListeners[type].filter((l) => l !== listener);
    }
  },
  dispatchEvent: (event: any) => {
    const list = docListeners[event.type] || [];
    list.forEach((fn) => fn(event));
    return true;
  },
};
Object.defineProperty(globalThis, 'document', {
  value: mockDocument,
  writable: true,
  configurable: true,
});

// Mock BroadcastChannel
class MockBroadcastChannel {
  name: string;
  onmessage: ((event: any) => void) | null = null;
  static channels: MockBroadcastChannel[] = [];

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.channels.push(this);
  }

  postMessage(data: any) {
    MockBroadcastChannel.channels.forEach((ch) => {
      if (ch !== this && ch.name === this.name && ch.onmessage) {
        ch.onmessage({ data });
      }
    });
  }

  close() {
    MockBroadcastChannel.channels = MockBroadcastChannel.channels.filter((ch) => ch !== this);
  }
}
Object.defineProperty(globalThis, 'BroadcastChannel', {
  value: MockBroadcastChannel,
  writable: true,
  configurable: true,
});

describe('Enterprise Inactivity Auto-Logout Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.keys(windowListeners).forEach((k) => delete windowListeners[k]);
    Object.keys(docListeners).forEach((k) => delete docListeners[k]);
    MockBroadcastChannel.channels = [];
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default timeout (15 min) and loads backend policy', async () => {
    vi.mocked(securitySettingsApi.getSecuritySettings).mockResolvedValueOnce({
      inactivityLogoutMinutes: 30,
      maxFailedLoginAttempts: 10,
      preventConcurrentSessions: false,
      inactivityLockDays: 90,
      passwordExpiryDays: 300,
      passwordHistoryCount: 4,
      minimumPasswordLength: 10,
      minimumPasswordStrength: 'MODERATE',
      requireDigit: true,
      requireSymbol: true,
      requireMixedCase: true,
    });

    const onLogout = vi.fn();
    const manager = new InactivityManager({
      isAuthenticated: true,
      tenantId: '11111111-1111-1111-1111-111111111111',
      onLogout,
    });

    expect(manager.getTimeoutMinutes()).toBe(15);

    await manager.start();

    expect(manager.getTimeoutMinutes()).toBe(30);
    expect(localStorage.getItem(STORAGE_KEY_INACTIVITY_MINUTES)).toBe('30');
    manager.stop();
  });

  it('tracks user activity on mousemove and keydown, respecting throttle limit', async () => {
    const onLogout = vi.fn();
    const manager = new InactivityManager({
      isAuthenticated: true,
      onLogout,
      throttleMs: 1000,
      checkIntervalMs: 2000,
    });
    await manager.start();

    const initialActive = manager.getLastActivityTime();
    expect(initialActive).toBeDefined();

    // Advance 500ms (within throttle window)
    vi.advanceTimersByTime(500);
    mockWindow.dispatchEvent({ type: 'mousemove' });

    // Should NOT have updated yet due to 1000ms throttle
    expect(manager.getLastActivityTime()).toBe(initialActive);

    // Advance past throttle threshold (+600ms = 1100ms total)
    vi.advanceTimersByTime(600);
    mockWindow.dispatchEvent({ type: 'keydown' });

    expect(manager.getLastActivityTime()).toBeGreaterThan(initialActive);
    expect(localStorage.getItem(STORAGE_KEY_LAST_ACTIVE)).toBe(String(manager.getLastActivityTime()));
    manager.stop();
  });

  it('triggers auto-logout when user is inactive beyond timeoutMinutes', async () => {
    const onLogout = vi.fn();
    const manager = new InactivityManager({
      isAuthenticated: true,
      defaultTimeoutMinutes: 5,
      checkIntervalMs: 1000,
      onLogout,
    });
    await manager.start();

    // Advance 4 minutes (still within 5 min timeout)
    vi.advanceTimersByTime(4 * 60 * 1000);
    expect(onLogout).not.toHaveBeenCalled();

    // Advance remaining 1 minute + check interval (+65 seconds)
    vi.advanceTimersByTime(65 * 1000);

    expect(onLogout).toHaveBeenCalledWith('INACTIVITY_TIMEOUT');
    const logoutPayload = localStorage.getItem(STORAGE_KEY_SESSION_LOGOUT);
    expect(logoutPayload).toBeTruthy();
    expect(JSON.parse(logoutPayload!).reason).toBe('INACTIVITY_TIMEOUT');
  });

  it('synchronizes activity across tabs via storage event, preventing premature logout', async () => {
    const onLogout = vi.fn();
    const manager = new InactivityManager({
      isAuthenticated: true,
      defaultTimeoutMinutes: 10,
      checkIntervalMs: 1000,
      onLogout,
    });
    await manager.start();

    // User is active in another tab after 8 minutes
    vi.advanceTimersByTime(8 * 60 * 1000);

    const simulatedRemoteActiveTime = Date.now();
    mockWindow.dispatchEvent({
      type: 'storage',
      key: STORAGE_KEY_LAST_ACTIVE,
      newValue: String(simulatedRemoteActiveTime),
    });

    // Advance another 3 minutes (11 min from start, but only 3 min from remote activity)
    vi.advanceTimersByTime(3 * 60 * 1000);

    // Tab should NOT have logged out because remote activity refreshed the timer
    expect(onLogout).not.toHaveBeenCalled();
    manager.stop();
  });

  it('synchronizes activity across tabs via BroadcastChannel', async () => {
    const onLogout = vi.fn();
    const manager = new InactivityManager({
      isAuthenticated: true,
      defaultTimeoutMinutes: 10,
      checkIntervalMs: 1000,
      onLogout,
    });
    await manager.start();

    vi.advanceTimersByTime(8 * 60 * 1000);

    // Other tab posts activity message
    const remoteChannel = new MockBroadcastChannel(INACTIVITY_BROADCAST_CHANNEL);
    const remoteActiveTime = Date.now();
    remoteChannel.postMessage({ type: 'ACTIVITY', timestamp: remoteActiveTime });

    // Advance 3 minutes
    vi.advanceTimersByTime(3 * 60 * 1000);
    expect(onLogout).not.toHaveBeenCalled();
    manager.stop();
  });

  it('immediately logs out when another tab writes a session logout event', async () => {
    const onLogout = vi.fn();
    const manager = new InactivityManager({
      isAuthenticated: true,
      defaultTimeoutMinutes: 15,
      onLogout,
    });
    await manager.start();

    mockWindow.dispatchEvent({
      type: 'storage',
      key: STORAGE_KEY_SESSION_LOGOUT,
      newValue: JSON.stringify({ reason: 'USER_LOGOUT', timestamp: Date.now() }),
    });

    expect(onLogout).toHaveBeenCalledWith('USER_LOGOUT');
  });

  it('dynamically adapts to updated policy event (enrollnow_security_policy_updated)', async () => {
    const onLogout = vi.fn();
    const manager = new InactivityManager({
      isAuthenticated: true,
      defaultTimeoutMinutes: 30,
      onLogout,
    });
    await manager.start();

    expect(manager.getTimeoutMinutes()).toBe(30);

    mockWindow.dispatchEvent({
      type: 'enrollnow_security_policy_updated',
      detail: { inactivityLogoutMinutes: 5 },
    });

    expect(manager.getTimeoutMinutes()).toBe(5);
    expect(localStorage.getItem(STORAGE_KEY_INACTIVITY_MINUTES)).toBe('5');
    manager.stop();
  });

  it('immediately logs out on visibilitychange if elapsed time exceeds timeout', async () => {
    const onLogout = vi.fn();
    const manager = new InactivityManager({
      isAuthenticated: true,
      defaultTimeoutMinutes: 10,
      checkIntervalMs: 60 * 60 * 1000, // 1 hour check interval (simulating background throttling)
      onLogout,
    });
    await manager.start();

    // Advance 12 minutes while simulated tab was hidden/backgrounded
    vi.advanceTimersByTime(12 * 60 * 1000);
    expect(onLogout).not.toHaveBeenCalled(); // 1-hour interval has not fired yet

    // User switches back to tab (visibilitychange to visible)
    mockDocument.visibilityState = 'visible';
    mockDocument.dispatchEvent({ type: 'visibilitychange' });

    expect(onLogout).toHaveBeenCalledWith('INACTIVITY_TIMEOUT');
  });
});
