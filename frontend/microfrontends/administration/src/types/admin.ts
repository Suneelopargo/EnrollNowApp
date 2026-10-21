// frontend/microfrontends/administration/src/types/admin.ts - Site Admin Domain Models

export type UserStatus = 'Active' | 'Inactive';

export interface SiteAdminUser {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  sitePermissions: string;
  sitePermissionCode?: string | null;
  siteId?: string | null;
  studies: string[];
  studyAssignments?: Array<{
    id: string;
    name: string;
    studyRole?: string | null;
    studyPermission?: string | null;
  }>;
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
