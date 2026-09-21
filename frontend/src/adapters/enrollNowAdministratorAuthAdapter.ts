import { AdministratorAuthAdapter, CurrentAdminUser } from '@aiventrahealth/administrator-ui';

export const enrollNowAdministratorAuthAdapter: AdministratorAuthAdapter = {
  getCurrentUser: (): CurrentAdminUser | null => {
    const rawUser = localStorage.getItem('enrollnow_user');
    if (!rawUser) return null;
    try {
      const user = JSON.parse(rawUser);
      return {
        id: user.id,
        username: user.username,
        name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email,
        roles: user.roles || [],
      };
    } catch {
      return null;
    }
  },
  hasAdministratorAccess: (): boolean => {
    const rawUser = localStorage.getItem('enrollnow_user');
    if (!rawUser) return false;
    try {
      const user = JSON.parse(rawUser);
      const roles: string[] = user.roles || [];
      return roles.some((r) =>
        ['ROLE_SUPER_ADMIN', 'ROLE_SITE_ADMIN', 'ROLE_ADMIN', 'SUPER_ADMIN', 'SITE_ADMIN', 'ADMIN'].includes(r)
      );
    } catch {
      return false;
    }
  },
};
