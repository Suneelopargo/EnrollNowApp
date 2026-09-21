// frontend/microfrontends/administration/src/api/administratorAuthAdapter.ts
import type { AdministratorAuthAdapter, CurrentAdminUser } from '@aiventrahealth/administrator-ui';
import { MfeContext } from '../../../../shared/contracts';

export class EnrollNowAdministratorAuthAdapter implements AdministratorAuthAdapter {
  private context: MfeContext;

  constructor(context: MfeContext) {
    this.context = context;
  }

  getCurrentUser(): CurrentAdminUser | null {
    if (!this.context.user) {
      return null;
    }
    return {
      id: this.context.user.id,
      username: this.context.user.username,
      name: this.context.user.fullName || `${this.context.user.firstName || ''} ${this.context.user.lastName || ''}`.trim(),
      email: this.context.user.email,
      roles: this.context.user.roles || [],
    };
  }

  hasAdministratorAccess(): boolean {
    if (!this.context.user || !this.context.user.roles) {
      return false;
    }
    const adminRoles = ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_SITE_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'SITE_ADMIN'];
    return this.context.user.roles.some((r) => adminRoles.includes(r));
  }
}
