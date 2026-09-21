// frontend/shared/runtime-config/index.ts - Dynamic Runtime Configuration Loader
import { RuntimeConfig } from '../contracts';

const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  environment: 'local',
  shell: {
    name: 'enrollnow-shell',
    version: '1.0.0',
    apiGatewayUrl: '',
  },
  remotes: {
    identity: {
      enabled: true,
      url: 'http://localhost:3001/remoteEntry.js',
      apiBaseUrl: 'http://localhost:8081',
      version: '1.0.0',
    },
    administration: {
      enabled: true,
      url: 'http://localhost:3002/remoteEntry.js',
      apiBaseUrl: 'http://localhost:8082',
      version: '1.0.0',
    },
    dashboard: {
      enabled: true,
      url: 'http://localhost:3003/remoteEntry.js',
      apiBaseUrl: 'http://localhost:8091',
      version: '1.0.0',
    },
    organization: {
      enabled: true,
      url: 'http://localhost:3004/remoteEntry.js',
      apiBaseUrl: 'http://localhost:8083',
      version: '1.0.0',
    },
    study: {
      enabled: true,
      url: 'http://localhost:3005/remoteEntry.js',
      apiBaseUrl: 'http://localhost:8084',
      version: '1.0.0',
    },
    participant: {
      enabled: true,
      url: 'http://localhost:3006/remoteEntry.js',
      apiBaseUrl: 'http://localhost:8085',
      version: '1.0.0',
    },
    recruitment: {
      enabled: true,
      url: 'http://localhost:3007/remoteEntry.js',
      apiBaseUrl: 'http://localhost:8086',
      version: '1.0.0',
    },
    survey: {
      enabled: true,
      url: 'http://localhost:3008/remoteEntry.js',
      apiBaseUrl: 'http://localhost:8087',
      version: '1.0.0',
    },
    task: {
      enabled: true,
      url: 'http://localhost:3009/remoteEntry.js',
      apiBaseUrl: 'http://localhost:8088',
      version: '1.0.0',
    },
    communication: {
      enabled: true,
      url: 'http://localhost:3010/remoteEntry.js',
      apiBaseUrl: 'http://localhost:8089',
      version: '1.0.0',
    },
    document: {
      enabled: true,
      url: 'http://localhost:3011/remoteEntry.js',
      apiBaseUrl: 'http://localhost:8090',
      version: '1.0.0',
    },
  },
  telemetry: {
    enabled: true,
    sampleRate: 1.0,
  },
};

let cachedConfig: RuntimeConfig | null = null;

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await fetch('/runtime-config.json', { cache: 'no-cache' });
    if (response.ok) {
      const data = await response.json();
      const resolved: RuntimeConfig = {
        ...DEFAULT_RUNTIME_CONFIG,
        ...data,
        remotes: {
          ...DEFAULT_RUNTIME_CONFIG.remotes,
          ...(data.remotes || {}),
        },
      };
      cachedConfig = resolved;
      return resolved;
    }
  } catch {
    // If fetching runtime-config.json fails, use default local configuration
  }

  cachedConfig = DEFAULT_RUNTIME_CONFIG;
  return cachedConfig;
}

export function getCachedRuntimeConfig(): RuntimeConfig {
  return cachedConfig || DEFAULT_RUNTIME_CONFIG;
}
