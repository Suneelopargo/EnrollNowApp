// frontend/shell/src/test/RoleBasedNavigationAndAccess.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  deriveUserAccessFlags,
  userHasRegistryAccess,
  userHasSiteAdminAccess,
  userIsFullSiteAdmin,
  userHasRole,
  userHasPermission,
} from '../../../shared/api/authApi';
import { getAuthorizedNavigationItems } from '../navigation/NavigationContext';
import { isTabAuthorizedForUser } from '../navigation/TabWorkspaceContext';
import { getRemoteDefinition } from '../remotes/RemoteRegistry';

describe('Role-Based Navigation, Site Permissions, and Access Control', () => {
  beforeEach(() => {
    // Pure unit tests for effective role/permission evaluation and navigation visibility
  });

  describe('1. Site Admin & Registry Access (SITE_ADMIN)', () => {
    const siteAdminUser = deriveUserAccessFlags({
      id: 'user-site-admin',
      username: 'siteadmin@enrollnow.local',
      email: 'siteadmin@enrollnow.local',
      siteRole: 'SITE_ADMIN',
      siteId: 'site-1',
      roles: ['SITE_ADMIN'],
    });

    it('resolves canonical label, permissions, and capability flags for SITE_ADMIN', () => {
      expect(siteAdminUser.siteRole).toBe('SITE_ADMIN');
      expect(siteAdminUser.sitePermissionLabel).toBe('Site Admin & Registry Access');
      expect(userHasRegistryAccess(siteAdminUser)).toBe(true);
      expect(userHasSiteAdminAccess(siteAdminUser)).toBe(true);
      expect(userIsFullSiteAdmin(siteAdminUser)).toBe(true);
      expect(userHasPermission(siteAdminUser, 'REGISTRY_VIEW')).toBe(true);
      expect(userHasPermission(siteAdminUser, 'SITE_ADMIN_ACCESS')).toBe(true);
      expect(userHasPermission(siteAdminUser, 'SITE_ADMIN_USERS_MANAGE')).toBe(true);
      expect(userHasPermission(siteAdminUser, 'SITE_ALL_STUDIES_MANAGE')).toBe(true);
    });

    it('displays both Administration (Site Admin) and Registry in top navigation', () => {
      const items = getAuthorizedNavigationItems(siteAdminUser);
      const ids = items.map((i) => i.id);
      expect(ids).toContain('dashboard');
      expect(ids).toContain('admin');
      expect(ids).toContain('participants');
      expect(ids).toContain('studies');
    });

    it('permits opening both Site Admin (/admin) and Registry (/participants) workspace tabs', () => {
      expect(isTabAuthorizedForUser('admin', siteAdminUser)).toBe(true);
      expect(isTabAuthorizedForUser('participants', siteAdminUser)).toBe(true);
      expect(isTabAuthorizedForUser('dashboard', siteAdminUser)).toBe(true);
    });
  });

  describe('2. Site Manager & Registry Access (SITE_MANAGER)', () => {
    const siteManagerUser = deriveUserAccessFlags({
      id: 'user-site-manager',
      username: 'sitemanager@enrollnow.local',
      email: 'sitemanager@enrollnow.local',
      siteRole: 'SITE_MANAGER',
      siteId: 'site-1',
      roles: ['SITE_MANAGER'],
    });

    it('resolves canonical label, permissions, and restricted admin-management flags for SITE_MANAGER', () => {
      expect(siteManagerUser.siteRole).toBe('SITE_MANAGER');
      expect(siteManagerUser.sitePermissionLabel).toBe('Site Manager & Registry Access');
      expect(userHasRegistryAccess(siteManagerUser)).toBe(true);
      expect(userHasSiteAdminAccess(siteManagerUser)).toBe(true);
      // SITE_MANAGER must NOT have full Site Admin privileges (cannot manage Site Admins or all studies unconditionally)
      expect(userIsFullSiteAdmin(siteManagerUser)).toBe(false);
      expect(userHasPermission(siteManagerUser, 'REGISTRY_VIEW')).toBe(true);
      expect(userHasPermission(siteManagerUser, 'SITE_ADMIN_ACCESS')).toBe(true);
      expect(userHasPermission(siteManagerUser, 'SITE_USERS_MANAGE')).toBe(true);
      expect(userHasPermission(siteManagerUser, 'SITE_ADMIN_USERS_MANAGE')).toBe(false);
      expect(userHasPermission(siteManagerUser, 'SITE_ALL_STUDIES_MANAGE')).toBe(false);
    });

    it('displays both Administration (Site Admin) and Registry in top navigation', () => {
      const items = getAuthorizedNavigationItems(siteManagerUser);
      const ids = items.map((i) => i.id);
      expect(ids).toContain('dashboard');
      expect(ids).toContain('admin');
      expect(ids).toContain('participants');
      expect(ids).toContain('studies');
    });

    it('permits opening both Site Admin (/admin) and Registry (/participants) workspace tabs', () => {
      expect(isTabAuthorizedForUser('admin', siteManagerUser)).toBe(true);
      expect(isTabAuthorizedForUser('participants', siteManagerUser)).toBe(true);
    });
  });

  describe('3. Registry Access (SITE_REGISTRY)', () => {
    const registryUser = deriveUserAccessFlags({
      id: 'user-registry',
      username: 'registry@enrollnow.local',
      email: 'registry@enrollnow.local',
      siteRole: 'SITE_REGISTRY',
      siteId: 'site-1',
      roles: ['SITE_REGISTRY'],
    });

    it('grants Registry access and denies Site Administration access for SITE_REGISTRY', () => {
      expect(registryUser.siteRole).toBe('SITE_REGISTRY');
      expect(registryUser.sitePermissionLabel).toBe('Registry Access');
      expect(userHasRegistryAccess(registryUser)).toBe(true);
      expect(userHasSiteAdminAccess(registryUser)).toBe(false);
      expect(userIsFullSiteAdmin(registryUser)).toBe(false);
      expect(userHasPermission(registryUser, 'REGISTRY_VIEW')).toBe(true);
      expect(userHasPermission(registryUser, 'SITE_ADMIN_ACCESS')).toBe(false);
    });

    it('displays Registry in top navigation and hides Administration (Site Admin)', () => {
      const items = getAuthorizedNavigationItems(registryUser);
      const ids = items.map((i) => i.id);
      expect(ids).toContain('dashboard');
      expect(ids).toContain('participants');
      expect(ids).not.toContain('admin');
    });

    it('blocks opening Site Admin (/admin) tab while allowing Registry (/participants) tab', () => {
      expect(isTabAuthorizedForUser('admin', registryUser)).toBe(false);
      expect(isTabAuthorizedForUser('participants', registryUser)).toBe(true);
    });
  });

  describe('4. None (No Active Site Permission)', () => {
    const noSitePermUser = deriveUserAccessFlags({
      id: 'user-none',
      username: 'studyonly@enrollnow.local',
      email: 'studyonly@enrollnow.local',
      siteRole: 'NONE',
      siteId: null,
      // Even with STUDY_ADMIN at study scope, user must NOT receive Site Admin or Registry access
      roles: ['STUDY_ADMIN', 'STUDY_LEADER'],
    });

    it('denies both Registry and Site Administration access while preserving study-level roles', () => {
      expect(noSitePermUser.siteRole).toBe('NONE');
      expect(noSitePermUser.sitePermissionLabel).toBe('None');
      expect(userHasRegistryAccess(noSitePermUser)).toBe(false);
      expect(userHasSiteAdminAccess(noSitePermUser)).toBe(false);
      expect(userIsFullSiteAdmin(noSitePermUser)).toBe(false);
      expect(userHasRole(noSitePermUser, 'STUDY_ADMIN')).toBe(true);
      expect(userHasRole(noSitePermUser, 'STUDY_LEADER')).toBe(true);
    });

    it('hides both Administration (Site Admin) and Registry in top navigation while showing Home and Studies', () => {
      const items = getAuthorizedNavigationItems(noSitePermUser);
      const ids = items.map((i) => i.id);
      expect(ids).toContain('dashboard');
      expect(ids).toContain('studies');
      expect(ids).not.toContain('admin');
      expect(ids).not.toContain('participants');
    });

    it('blocks opening both Site Admin (/admin) and Registry (/participants) workspace tabs', () => {
      expect(isTabAuthorizedForUser('admin', noSitePermUser)).toBe(false);
      expect(isTabAuthorizedForUser('participants', noSitePermUser)).toBe(false);
      expect(isTabAuthorizedForUser('dashboard', noSitePermUser)).toBe(true);
      expect(isTabAuthorizedForUser('studies', noSitePermUser)).toBe(true);
    });
  });

  describe('5. RemoteRegistry Permission Definitions', () => {
    it('defines SITE_ADMIN_ACCESS on administration remote and REGISTRY_VIEW on participant remote', () => {
      const adminRemote = getRemoteDefinition('administration');
      const participantRemote = getRemoteDefinition('participant');

      expect(adminRemote?.requiredPermissions).toContain('SITE_ADMIN_ACCESS');
      expect(adminRemote?.requiredPermissions).toContain('SITE_ADMIN');
      expect(adminRemote?.requiredPermissions).toContain('SITE_MANAGER');

      expect(participantRemote?.requiredPermissions).toContain('REGISTRY_VIEW');
      expect(participantRemote?.requiredPermissions).toContain('SITE_REGISTRY');
    });
  });
});
