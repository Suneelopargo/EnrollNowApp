// frontend/microfrontends/administration/src/types/admin.ts - Site Admin Domain Models

export type UserStatus = 'Active' | 'Inactive';

export interface SiteAdminUser {
  id: string;
  name: string;
  email: string;
  sitePermissions: string;
  studies: string[];
  status: UserStatus;
  avatarColor?: string;
  phone?: string;
  title?: string;
  createdAt?: string;
}

export type AdminTabId =
  | 'studies'
  | 'users'
  | 'import'
  | 'export'
  | 'audit'
  | 'security'
  | 'settings';

export type ExportSubOption = 'new_config' | 'my_exports' | 'shared_with_me';
