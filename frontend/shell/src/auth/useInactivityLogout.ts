// frontend/shell/src/auth/useInactivityLogout.ts - React Hook for Inactivity Auto-Logout
import { useEffect, useRef, useState } from 'react';
import {
  InactivityManager,
  InactivityManagerOptions,
  DEFAULT_INACTIVITY_LOGOUT_MINUTES,
  ACTIVITY_THROTTLE_MS,
  CHECK_INTERVAL_MS,
  INACTIVITY_BROADCAST_CHANNEL,
  STORAGE_KEY_LAST_ACTIVE,
  STORAGE_KEY_SESSION_LOGOUT,
  STORAGE_KEY_INACTIVITY_MINUTES,
} from './inactivityManager';

export {
  InactivityManager,
  DEFAULT_INACTIVITY_LOGOUT_MINUTES,
  ACTIVITY_THROTTLE_MS,
  CHECK_INTERVAL_MS,
  INACTIVITY_BROADCAST_CHANNEL,
  STORAGE_KEY_LAST_ACTIVE,
  STORAGE_KEY_SESSION_LOGOUT,
  STORAGE_KEY_INACTIVITY_MINUTES,
};
export type { InactivityManagerOptions as UseInactivityLogoutOptions };

export function useInactivityLogout(options: InactivityManagerOptions) {
  const [manager, setManager] = useState<InactivityManager | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!options.isAuthenticated) {
      if (manager) {
        manager.stop();
        setManager(null);
      }
      return;
    }

    const inst = new InactivityManager({
      isAuthenticated: options.isAuthenticated,
      tenantId: options.tenantId,
      onLogout: (reason) => optionsRef.current.onLogout(reason),
      defaultTimeoutMinutes: options.defaultTimeoutMinutes,
      throttleMs: options.throttleMs,
      checkIntervalMs: options.checkIntervalMs,
    });

    void inst.start();
    setManager(inst);

    return () => {
      inst.stop();
    };
  }, [options.isAuthenticated, options.tenantId]);

  return {
    manager,
    timeoutMinutes: manager?.getTimeoutMinutes() ?? DEFAULT_INACTIVITY_LOGOUT_MINUTES,
    recordActivity: () => manager?.recordActivity(),
    lastActivity: manager?.getLastActivityTime() ?? Date.now(),
  };
}
