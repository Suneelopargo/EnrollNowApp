// frontend/shared/runtime-config/index.ts - Dynamic Runtime Configuration Loader
import { RuntimeConfig } from '../contracts';

const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  environment: 'local',
  shell: {
    name: 'enrollnow-shell',
    version: '1.0.0',
    apiGatewayUrl: '/api',
  },
  remotes: {
    identity: {
      enabled: true,
      url: '/src/microfrontends/identity',
      apiBaseUrl: '/api',
      version: '1.0.0',
    },
    administration: {
      enabled: true,
      url: '/src/microfrontends/administration',
      apiBaseUrl: '/api',
      version: '1.0.0',
    },
    dashboard: {
      enabled: true,
      url: '/src/microfrontends/dashboard',
      apiBaseUrl: '/api',
      version: '1.0.0',
    },
    organization: {
      enabled: true,
      url: '/src/microfrontends/organization',
      apiBaseUrl: '/api',
      version: '1.0.0',
    },
    study: {
      enabled: true,
      url: '/src/microfrontends/study',
      apiBaseUrl: '/api',
      version: '1.0.0',
    },
    participant: {
      enabled: true,
      url: '/src/microfrontends/participant',
      apiBaseUrl: '/api',
      version: '1.0.0',
    },
    recruitment: {
      enabled: true,
      url: '/src/microfrontends/recruitment',
      apiBaseUrl: '/api',
      version: '1.0.0',
    },
    survey: {
      enabled: true,
      url: '/src/microfrontends/survey',
      apiBaseUrl: '/api',
      version: '1.0.0',
    },
    task: {
      enabled: true,
      url: '/src/microfrontends/task',
      apiBaseUrl: '/api',
      version: '1.0.0',
    },
    communication: {
      enabled: true,
      url: '/src/microfrontends/communication',
      apiBaseUrl: '/api',
      version: '1.0.0',
    },
    document: {
      enabled: true,
      url: '/src/microfrontends/document',
      apiBaseUrl: '/api',
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
