import React from 'react';

export type EntityId = string | number;

export interface AdminDashboard {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  activeLocations: number;
  totalRoles?: number;
  recentActivities?: any[];
}

export interface AdminUser {
  id: EntityId;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  active: boolean;
  roles?: string[];
  siteCodes?: string[];
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AdminUserPage {
  content: AdminUser[];
  totalElements: number;
  totalPages: number;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  siteCodes?: string[];
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  active?: boolean;
  roles?: string[];
  siteCodes?: string[];
}

export interface UserQuery {
  search?: string;
  active?: boolean;
  page?: number;
  size?: number;
}

export interface AdminRole {
  id: EntityId;
  code: string;
  name: string;
  description?: string;
  active?: boolean;
  permissions?: string[];
  userCount?: number;
}

export interface CreateRoleRequest {
  code: string;
  name: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  active?: boolean;
  permissions?: string[];
}

export interface RolePermission {
  module: string;
  actions: string[];
  scope?: string;
}

export interface PermissionModule {
  id?: EntityId;
  name: string;
  code: string;
  description?: string;
  permissions?: RolePermission[];
  actions?: string[];
}

export type PermissionCatalog = PermissionModule[];

export interface UserRoleAssignment {
  roleId?: EntityId;
  roleCode?: string;
  validFrom?: string;
  validTo?: string;
}

export interface AdminProviderMapping {
  userId: EntityId;
  providerId: EntityId;
  providerName?: string;
}

export interface AdminProviderOption {
  id: EntityId;
  name: string;
  code?: string;
}

export interface AdminLocationOption {
  id: EntityId;
  name: string;
  code?: string;
  city?: string;
  state?: string;
  active?: boolean;
}

export interface AdminLocationAccess {
  locationId: EntityId;
  locationName?: string;
  role?: string;
}

export interface AdminAuditPage {
  content: any[];
  totalElements: number;
  totalPages: number;
}

export interface AuditQuery {
  action?: string;
  performedBy?: string;
  targetUserId?: EntityId;
  search?: string;
  page?: number;
  size?: number;
}

export interface ResetPasswordRequest {
  newPassword?: string;
  temporary?: boolean;
}

export interface CurrentAdminUser {
  id: EntityId;
  username: string;
  name?: string;
  email: string;
  roles: string[];
}

export interface AdministratorAuthAdapter {
  getCurrentUser(): CurrentAdminUser | null;
  hasAdministratorAccess(): boolean;
}

export interface AdministratorFeaturesConfig {
  dashboard?: boolean;
  users?: boolean;
  userManagement?: boolean;
  roles?: boolean;
  rolesAndRbac?: boolean;
  customRoles?: boolean;
  customRoleBuilder?: boolean;
  permissionMatrix?: boolean;
  userRoleAssignment?: boolean;
  locationAccess?: boolean;
  auditTrail?: boolean;
  providerMapping?: boolean;
}

export interface AdministratorTerminologyConfig {
  location?: string;
  locations?: string;
  provider?: string;
  providers?: string;
  providerCode?: string;
}

export interface AdministratorConfig {
  title?: string;
  subtitle?: string;
  badgeText?: string;
  features?: AdministratorFeaturesConfig;
  terminology?: AdministratorTerminologyConfig;
  providerRoleCodes?: string[];
  isProviderRole?: (roleCode: string) => boolean;
  onNavigate?: (path: string) => void;
}

export interface AdministratorApi {
  getDashboard(): Promise<AdminDashboard>;
  getUsers(query?: UserQuery): Promise<AdminUser[] | AdminUserPage>;
  getUser(id: EntityId): Promise<AdminUser>;
  createUser(request: CreateUserRequest): Promise<AdminUser>;
  updateUser(id: EntityId, request: UpdateUserRequest): Promise<AdminUser>;
  activateUser(id: EntityId): Promise<void | AdminUser>;
  deactivateUser(id: EntityId): Promise<void | AdminUser>;
  resetPassword(id: EntityId, request: ResetPasswordRequest): Promise<void>;
  getUserRoleAssignments(userId: EntityId): Promise<UserRoleAssignment[]>;
  saveUserRoleAssignments(userId: EntityId, assignments: UserRoleAssignment[]): Promise<void | AdminUser>;
  getLocations(): Promise<AdminLocationOption[]>;
  getUserLocations(userId: EntityId): Promise<AdminLocationAccess[]>;
  saveUserLocations(userId: EntityId, locationIds: EntityId[]): Promise<AdminLocationAccess[] | void>;
  getRoles(): Promise<AdminRole[]>;
  getRole(id: EntityId): Promise<AdminRole>;
  createRole(request: CreateRoleRequest): Promise<AdminRole>;
  updateRole(id: EntityId, request: UpdateRoleRequest): Promise<AdminRole>;
  setRoleStatus(id: EntityId, status: string): Promise<AdminRole>;
  getPermissionCatalog(): Promise<PermissionCatalog>;
  getRolePermissions(roleId: EntityId): Promise<PermissionModule[]>;
  saveRolePermissions(roleId: EntityId, permissions: RolePermission[]): Promise<void | PermissionModule[]>;
  getAuditLogs(query?: AuditQuery): Promise<AdminAuditPage>;
  getProviderMappings(): Promise<AdminProviderMapping[]>;
  mapUserProvider(userId: EntityId, doctorId: EntityId): Promise<AdminProviderMapping>;
  unmapUserProvider(userId: EntityId): Promise<void>;
  getAvailableProviders(): Promise<AdminProviderOption[]>;
}

export interface AdministratorProviderProps {
  api: AdministratorApi;
  auth: AdministratorAuthAdapter;
  config?: AdministratorConfig;
  children: React.ReactNode;
}

export declare const AdministratorProvider: React.FC<AdministratorProviderProps>;

export interface AdministratorProps {
  initialTab?: number | string;
}

export declare const Administrator: React.FC<AdministratorProps>;

export declare function useAdministrator(): {
  api: AdministratorApi;
  auth: AdministratorAuthAdapter;
  config: AdministratorConfig;
};
