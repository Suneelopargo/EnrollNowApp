// frontend/shell/src/auth/inactivityManager.ts - Enterprise Inactivity & Session Management Service
import { securitySettingsApi } from '../../../shared/api/securitySettingsApi';
import { authApi } from '../../../shared/api/authApi';

export interface InactivityManagerOptions {
  isAuthenticated: boolean;
  tenantId?: string;
  onLogout: (reason: string, message?: string) => void;
  defaultTimeoutMinutes?: number;
  throttleMs?: number;
  checkIntervalMs?: number;
  checkSessionHealth?: () => Promise<{ active: boolean; reason?: string; message?: string }>;
}

export const DEFAULT_INACTIVITY_LOGOUT_MINUTES = 15;
export const ACTIVITY_THROTTLE_MS = 1000;
export const CHECK_INTERVAL_MS = 5000;

export const INACTIVITY_BROADCAST_CHANNEL = 'enrollnow_session_channel';
export const STORAGE_KEY_LAST_ACTIVE = 'enrollnow_last_active';
export const STORAGE_KEY_SESSION_LOGOUT = 'enrollnow_session_logout';
export const STORAGE_KEY_INACTIVITY_MINUTES = 'enrollnow_inactivity_minutes';

export class InactivityManager {
  private isAuthenticated: boolean;
  private tenantId?: string;
  private onLogout: (reason: string, message?: string) => void;
  private defaultTimeoutMinutes: number;
  private throttleMs: number;
  private checkIntervalMs: number;
  private checkSessionHealthFn?: () => Promise<{ active: boolean; reason?: string; message?: string }>;

  private timeoutMinutes: number;
  private lastActivityTime: number = Date.now();
  private lastRecordedTime: number = 0;
  private intervalId: any = null;
  private broadcastChannel: any = null;
  private isRunning: boolean = false;
  private isCheckingServerSession: boolean = false;

  private activityHandler = () => this.recordActivity();
  private storageHandler = (e: any) => this.handleStorageEvent(e);
  private policyUpdateHandler = (e: any) => this.handlePolicyUpdateEvent(e);
  private visibilityHandler = () => this.handleVisibilityOrFocus();

  constructor(options: InactivityManagerOptions) {
    this.isAuthenticated = options.isAuthenticated;
    this.tenantId = options.tenantId;
    this.onLogout = options.onLogout;
    this.defaultTimeoutMinutes = options.defaultTimeoutMinutes ?? DEFAULT_INACTIVITY_LOGOUT_MINUTES;
    this.throttleMs = options.throttleMs ?? ACTIVITY_THROTTLE_MS;
    this.checkIntervalMs = options.checkIntervalMs ?? CHECK_INTERVAL_MS;
    this.checkSessionHealthFn = options.checkSessionHealth;

    this.timeoutMinutes = this.loadInitialTimeout();
  }

  private loadInitialTimeout(): number {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_INACTIVITY_MINUTES);
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed) && parsed > 0) return parsed;
        }
      } catch {
        // ignore
      }
    }
    return this.defaultTimeoutMinutes;
  }

  public getTimeoutMinutes(): number {
    return this.timeoutMinutes;
  }

  public setTimeoutMinutes(minutes: number): void {
    if (minutes > 0) {
      this.timeoutMinutes = minutes;
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_INACTIVITY_MINUTES, String(minutes));
        } catch {
          // ignore
        }
      }
    }
  }

  public getLastActivityTime(): number {
    return this.lastActivityTime;
  }

  public async start(): Promise<void> {
    if (this.isRunning || !this.isAuthenticated) return;
    this.isRunning = true;
    const now = Date.now();
    this.lastActivityTime = now;
    this.lastRecordedTime = now;

    // 1. Fetch authoritative security policy from server
    await this.fetchServerPolicy();

    // 2. Attach DOM activity listeners
    this.attachListeners();

    // 3. Start check interval (checks local inactivity and periodic server session status)
    this.intervalId = setInterval(() => {
      this.checkInactivity();
      void this.verifyServerSession();
    }, this.checkIntervalMs);
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.detachListeners();

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch {
        // ignore
      }
      this.broadcastChannel = null;
    }
  }

  public async fetchServerPolicy(): Promise<void> {
    try {
      const settings = await securitySettingsApi.getSecuritySettings(this.tenantId);
      if (settings?.inactivityLogoutMinutes && settings.inactivityLogoutMinutes > 0) {
        this.setTimeoutMinutes(settings.inactivityLogoutMinutes);
      }
    } catch {
      // Graceful fallback to default/cached policy
    }
  }

  /**
   * Actively queries the backend to verify that this session was not revoked by a new login
   * in another browser/device (concurrent sessions prevention) or expired on the server.
   */
  public async verifyServerSession(): Promise<boolean> {
    if (!this.isRunning || !this.isAuthenticated || this.isCheckingServerSession) {
      return true;
    }
    this.isCheckingServerSession = true;
    try {
      const checker = this.checkSessionHealthFn || (() => authApi.verifySessionStatus());
      const res = await checker();
      if (!res.active) {
        const reason = res.reason || 'CONCURRENT_SESSION_LOGOUT';
        const message = res.message;
        this.triggerLogout(reason, message);
        return false;
      }
      return true;
    } catch {
      return true;
    } finally {
      this.isCheckingServerSession = false;
    }
  }

  public recordActivity(): void {
    const now = Date.now();
    if (now - this.lastRecordedTime < this.throttleMs) {
      return;
    }
    this.lastRecordedTime = now;
    this.lastActivityTime = now;

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, String(now));
      } catch {
        // ignore
      }
    }

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        if (!this.broadcastChannel) {
          this.broadcastChannel = new BroadcastChannel(INACTIVITY_BROADCAST_CHANNEL);
        }
        this.broadcastChannel.postMessage({ type: 'ACTIVITY', timestamp: now });
      } catch {
        // BroadcastChannel unavailable
      }
    }
  }

  public checkInactivity(): void {
    const now = Date.now();
    const allowedIdleMs = this.timeoutMinutes * 60 * 1000;
    const elapsed = now - this.lastActivityTime;

    if (elapsed >= allowedIdleMs) {
      this.triggerLogout('INACTIVITY_TIMEOUT');
    }
  }

  public triggerLogout(reason: string, message?: string): void {
    const now = Date.now();

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_KEY_SESSION_LOGOUT,
          JSON.stringify({ reason, message, timestamp: now })
        );
      } catch {
        // ignore
      }
    }

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        if (!this.broadcastChannel) {
          this.broadcastChannel = new BroadcastChannel(INACTIVITY_BROADCAST_CHANNEL);
        }
        this.broadcastChannel.postMessage({ type: 'LOGOUT', reason, message });
      } catch {
        // ignore
      }
    }

    this.stop();
    if (message !== undefined) {
      this.onLogout(reason, message);
    } else {
      this.onLogout(reason);
    }
  }

  public handleStorageEvent(e: any): void {
    if (e.key === STORAGE_KEY_LAST_ACTIVE && e.newValue) {
      const remoteTime = Number(e.newValue);
      if (!isNaN(remoteTime)) {
        this.lastActivityTime = Math.max(this.lastActivityTime, remoteTime);
      }
    } else if (e.key === STORAGE_KEY_SESSION_LOGOUT && e.newValue) {
      let reason = 'SESSION_LOGOUT';
      let message: string | undefined;
      try {
        const parsed = JSON.parse(e.newValue);
        reason = parsed.reason || reason;
        message = parsed.message;
      } catch {
        // ignore
      }
      this.stop();
      if (message !== undefined) {
        this.onLogout(reason, message);
      } else {
        this.onLogout(reason);
      }
    } else if (e.key === STORAGE_KEY_INACTIVITY_MINUTES && e.newValue) {
      const parsed = parseInt(e.newValue, 10);
      if (!isNaN(parsed) && parsed > 0) {
        this.timeoutMinutes = parsed;
      }
    }
  }

  public handlePolicyUpdateEvent(e: any): void {
    const newMinutes = e?.detail?.inactivityLogoutMinutes;
    if (typeof newMinutes === 'number' && newMinutes > 0) {
      this.setTimeoutMinutes(newMinutes);
    }
  }

  public handleVisibilityOrFocus(): void {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      if (typeof localStorage !== 'undefined') {
        try {
          const stored = localStorage.getItem(STORAGE_KEY_LAST_ACTIVE);
          if (stored) {
            const remoteTime = Number(stored);
            if (!isNaN(remoteTime)) {
              this.lastActivityTime = Math.max(this.lastActivityTime, remoteTime);
            }
          }
        } catch {
          // ignore
        }
      }
      this.checkInactivity();
      // Immediately verify server session status when tab becomes visible or window gains focus
      void this.verifyServerSession();
    }
  }

  private attachListeners(): void {
    if (typeof window !== 'undefined') {
      const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
      events.forEach((evt) => {
        window.addEventListener(evt, this.activityHandler, { passive: true } as any);
      });

      window.addEventListener('storage', this.storageHandler);
      window.addEventListener('enrollnow_security_policy_updated', this.policyUpdateHandler);
      window.addEventListener('focus', this.visibilityHandler);
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        if (!this.broadcastChannel) {
          this.broadcastChannel = new BroadcastChannel(INACTIVITY_BROADCAST_CHANNEL);
        }
        this.broadcastChannel.onmessage = (event: any) => {
          const data = event.data;
          if (data?.type === 'ACTIVITY' && typeof data.timestamp === 'number') {
            this.lastActivityTime = Math.max(this.lastActivityTime, data.timestamp);
          } else if (data?.type === 'LOGOUT') {
            this.stop();
            if (data.message !== undefined) {
              this.onLogout(data.reason || 'INACTIVITY_TIMEOUT', data.message);
            } else {
              this.onLogout(data.reason || 'INACTIVITY_TIMEOUT');
            }
          }
        };
      } catch {
        // ignore
      }
    }
  }

  private detachListeners(): void {
    if (typeof window !== 'undefined') {
      const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
      events.forEach((evt) => {
        window.removeEventListener(evt, this.activityHandler);
      });

      window.removeEventListener('storage', this.storageHandler);
      window.removeEventListener('enrollnow_security_policy_updated', this.policyUpdateHandler);
      window.removeEventListener('focus', this.visibilityHandler);
    }

    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
  }
}
