// Configurable module registry and feature toggles
export interface ModuleConfig {
  id: string;
  name: string;
  enabled: boolean;
  route: string;
}

export const ENABLED_FRONTEND_MODULES: Record<string, boolean> = {
  identity: true,
  administration: true,
  dashboard: true,
  organization: true,
  study: true,
  participant: true,
  recruitment: true,
  survey: true,
  task: true,
  communication: true,
  document: true,
};

export function isModuleEnabled(moduleName: string): boolean {
  return ENABLED_FRONTEND_MODULES[moduleName] !== false;
}
