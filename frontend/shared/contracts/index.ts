// frontend/shared/contracts/index.ts - Authoritative TypeScript Contracts for Micro-Frontends

export interface AuthUser {
  id: number | string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  active?: boolean;
  roles: string[];
  siteCodes?: string[];
  organizationName?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  expiresAt?: number;
}

export interface NavigationItem {
  id: string;
  label: string;
  route: string;
  icon?: string;
  requiredPermission?: string;
  order?: number;
  children?: NavigationItem[];
}

export interface RemoteDefinition {
  id: string;
  name: string;
  route: string;
  remoteUrl: string;
  exposedModule: string;
  enabled: boolean;
  requiredPermissions?: string[];
  version: string;
  healthEndpoint?: string;
  description?: string;
  apiBaseUrl?: string;
}

export interface RuntimeConfig {
  environment: 'local' | 'test' | 'staging' | 'production';
  shell: {
    name: string;
    version: string;
    apiGatewayUrl: string;
  };
  remotes: Record<string, {
    enabled: boolean;
    url: string;
    apiBaseUrl?: string;
    version?: string;
  }>;
  telemetry: {
    enabled: boolean;
    sampleRate: number;
  };
}

export interface MfeContext {
  user: AuthUser | null;
  token: string | null;
  apiBaseUrl: string;
  basePath?: string;
  correlationId: string;
  navigate: (to: string, options?: any) => void;
  emitEvent?: (event: any) => void;
  onEvent?: (eventType: string, payload: any) => void;
  environment?: string;
}

export interface MfeProps {
  context: MfeContext;
}

export interface MfeMountOptions {
  container: HTMLElement;
  context: MfeContext;
}

export type MfeMountFunction = (options: MfeMountOptions) => () => void; // returns unmount function

export interface TelemetryEvent {
  eventType: 'STARTUP' | 'REMOTE_LOAD_START' | 'REMOTE_LOAD_SUCCESS' | 'REMOTE_LOAD_ERROR' | 'ROUTE_CHANGE' | 'API_ERROR' | 'AUTH_STATE' | 'UI_ERROR';
  remoteId?: string;
  timestamp: string;
  correlationId: string;
  details?: Record<string, any>;
  durationMs?: number;
}
