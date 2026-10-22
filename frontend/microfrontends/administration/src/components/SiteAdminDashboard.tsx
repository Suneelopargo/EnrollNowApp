import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { toast } from '../../../../shared/toaster';
import { requestConfirmation } from '../../../../shared/confirmation';
import { getApiErrorMessage, getStoredAuthUser } from '../../../../shared/api-client';
import { organizationApi } from '../../../../shared/api/organizationApi';
import { MfeContext, AuthUser } from '../../../../shared/contracts';
import { deriveUserAccessFlags, userIsFullSiteAdmin, userCanManageSiteSettings } from '../../../../shared/api/authApi';
import {
  administrationApi,
  RoleResponse,
  toSitePermissionLabel,
  normalizeSiteRoleCode,
  SITE_PERMISSION_TO_ROLE_CODE,
} from '../../../../shared/api/administrationApi';
import { SiteAdminHorizontalNav } from './SiteAdminHorizontalNav';
import { UsersGrid } from './UsersGrid';
import { AddUserModal, UserFormData, AvailableStudy } from './AddUserModal';
import {
  StudiesView,
  ImportView,
  ExportView,
  AuditLogView,
  SecurityView,
  GeneralSettingsView,
} from './SiteAdminViews';
import { SiteAdminUser, AdminTabId, ExportSubOption } from '../types/admin';

export interface SiteAdminDashboardProps {
  context?: MfeContext;
}

export const SiteAdminDashboard: React.FC<SiteAdminDashboardProps> = ({ context }) => {
  const [activeTab, setActiveTab] = useState<AdminTabId>('users');
  const [selectedExportOption, setSelectedExportOption] = useState<ExportSubOption>('new_config');
  const [users, setUsers] = useState<SiteAdminUser[]>([]);
  const [availableStudies, setAvailableStudies] = useState<AvailableStudy[]>([]);
  const [loadingStudies, setLoadingStudies] = useState<boolean>(false);
  const [siteRoles, setSiteRoles] = useState<RoleResponse[]>([]);
  const [studyRoles, setStudyRoles] = useState<RoleResponse[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [defaultSiteId, setDefaultSiteId] = useState<string | null>(null);

  const currentUser = useMemo<AuthUser | null>(() => {
    if (context?.user) {
      return deriveUserAccessFlags(context.user);
    }
    const stored = getStoredAuthUser<AuthUser>();
    return stored ? deriveUserAccessFlags(stored) : null;
  }, [context?.user]);

  const isFullSiteAdmin = useMemo(() => {
    if (!currentUser) return true;
    return userIsFullSiteAdmin(currentUser);
  }, [currentUser]);

  const canManageSiteSettings = useMemo(() => {
    if (!currentUser) return true;
    return userCanManageSiteSettings(currentUser);
  }, [currentUser]);

  const activeSiteId = useMemo(() => {
    return (
      currentUser?.siteId ||
      defaultSiteId ||
      users.find((u) => u.siteId)?.siteId ||
      null
    );
  }, [currentUser?.siteId, defaultSiteId, users]);

  const isFetchingUsersRef = useRef(false);
  const isFetchingRolesRef = useRef(false);
  const isFetchingStudiesRef = useRef(false);

  // Resolve default tenant site if currentUser does not have a siteId cached
  useEffect(() => {
    if (currentUser?.siteId) {
      setDefaultSiteId(currentUser.siteId);
      return;
    }
    let mounted = true;
    organizationApi
      .getSites({ skipToast: true } as any)
      .then((list) => {
        if (!mounted) return;
        if (Array.isArray(list) && list.length > 0 && list[0]?.id) {
          setDefaultSiteId(String(list[0].id));
        }
      })
      .catch(() => {
        // Fallback to user directory siteId if /api/v1/sites is unavailable
      });
    return () => {
      mounted = false;
    };
  }, [currentUser?.siteId]);

  const fetchStudies = useCallback(async () => {
    if (isFetchingStudiesRef.current) return;
    isFetchingStudiesRef.current = true;
    setLoadingStudies(true);
    try {
      const data = await administrationApi.getStudies();
      if (Array.isArray(data)) {
        setAvailableStudies(data);
      }
    } catch (err) {
      console.warn('Failed to load studies from /api/v1/tenants/{tenantId}/studies:', err);
    } finally {
      isFetchingStudiesRef.current = false;
      setLoadingStudies(false);
    }
  }, []);

  const fetchUsers = useCallback(async (quiet = false) => {
    if (isFetchingUsersRef.current) return;
    isFetchingUsersRef.current = true;
    if (!quiet) setLoadingUsers(true);
    setUsersError(null);
    try {
      const data = await administrationApi.getDetailedUsers(
        undefined,
        currentUser?.siteId || defaultSiteId || undefined
      );
      if (Array.isArray(data)) {
        const mappedUsers: SiteAdminUser[] = data.map((u) => {
          const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User';
          const studyNames = Array.isArray(u.studies)
            ? u.studies
                .map((s) => (typeof s === 'string' ? s : s?.name))
                .filter(Boolean) as string[]
            : [];

          return {
            id: String(u.id),
            name: fullName,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.primaryEmail || '',
            sitePermissions: toSitePermissionLabel(u.sitePermission),
            sitePermissionCode: normalizeSiteRoleCode(u.sitePermission),
            siteId: u.siteId,
            studies: studyNames,
            studyAssignments: Array.isArray(u.studies) ? u.studies : [],
            status: u.status === 'ACTIVE' ? 'Active' : 'Inactive',
            title: u.title || '',
            createdAt: u.createdAt,
          };
        });

        setUsers(mappedUsers);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to load user directory from backend.');
      setUsersError(msg);
      setUsers([]);
      toast.error(msg, { title: 'User Directory Error' });
    } finally {
      isFetchingUsersRef.current = false;
      if (!quiet) setLoadingUsers(false);
    }
  }, [currentUser?.siteId, defaultSiteId]);

  const fetchRoles = useCallback(async () => {
    if (isFetchingRolesRef.current) return;
    isFetchingRolesRef.current = true;
    try {
      const [siteData, studyData] = await Promise.all([
        administrationApi.getRoles('SITE'),
        administrationApi.getRoles('STUDY'),
      ]);
      if (Array.isArray(siteData)) setSiteRoles(siteData);
      if (Array.isArray(studyData)) setStudyRoles(studyData);
    } catch (err) {
      console.warn('Failed to load roles from /api/v1/roles:', err);
    } finally {
      isFetchingRolesRef.current = false;
    }
  }, []);

  // Fetch initial users directory and roles on screen mount (studies are deferred until Add/Edit User is clicked)
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  // Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<SiteAdminUser | null>(null);

  // User Actions - fetch fresh, latest studies whenever adding or editing a user
  const handleOpenAddUser = useCallback(() => {
    setUserToEdit(null);
    setIsAddUserModalOpen(true);
    fetchStudies();
  }, [fetchStudies]);

  const handleOpenEditUser = useCallback((user: SiteAdminUser) => {
    setUserToEdit(user);
    setIsAddUserModalOpen(true);
    fetchStudies();
  }, [fetchStudies]);

  const handleSaveUser = useCallback(
    async (formData: UserFormData) => {
      if (userToEdit) {
        // Edit existing user
        try {
          await administrationApi.updateUser(userToEdit.id, {
            firstName: formData.firstName,
            lastName: formData.lastName,
          });

          // Sync site permission
          const oldSiteRoleCode = normalizeSiteRoleCode(
            userToEdit.sitePermissionCode || userToEdit.sitePermissions
          );
          const newSiteRoleCode = normalizeSiteRoleCode(formData.sitePermissions);
          const newSitePerm = toSitePermissionLabel(newSiteRoleCode);
          const resolvedSiteId = userToEdit.siteId || activeSiteId || undefined;

          if (newSiteRoleCode !== oldSiteRoleCode) {
            if (newSiteRoleCode === 'NONE') {
              await administrationApi
                .removeSiteRole(userToEdit.id, undefined, resolvedSiteId)
                .catch((err) => {
                  console.warn('Failed to remove site role:', err);
                });
            } else {
              const roleCode =
                SITE_PERMISSION_TO_ROLE_CODE[newSitePerm] || newSiteRoleCode;
              try {
                await administrationApi.assignScopedRole(userToEdit.id, {
                  roleCode,
                  scopeType: 'SITE',
                  scopeId: resolvedSiteId as any,
                });
              } catch (siteErr: any) {
                console.error('Failed to update site permission:', siteErr);
                const sMsg = getApiErrorMessage(siteErr, 'Access error');
                toast.warning(`Site permission '${newSitePerm}' could not be updated: ${sMsg}`);
              }
            }
          }

          // Sync study access assignments
          if (formData.assignedStudies && formData.assignedStudies.length > 0) {
            for (const s of formData.assignedStudies) {
              try {
                await administrationApi.grantStudyAccess(s.studyId, userToEdit.id, {
                  studyRole: s.permission || 'Study Member',
                  studyPermission: s.permission,
                });
              } catch (studyErr: any) {
                console.error(`Failed to assign study ${s.studyName}:`, studyErr);
                const sMsg = getApiErrorMessage(studyErr, 'Access error');
                toast.warning(`Study access to '${s.studyName}' could not be granted: ${sMsg}`);
              }
            }
          }

          if (formData.unassignedStudies && formData.unassignedStudies.length > 0) {
            for (const s of formData.unassignedStudies) {
              await administrationApi.removeStudyAccess(s.studyId, userToEdit.id).catch(() => {});
            }
          }

          await fetchUsers(true);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('enrollnow_permissions_updated', {
                detail: { userId: userToEdit.id, siteId: resolvedSiteId },
              })
            );
          }
          toast.success(`User '${formData.firstName} ${formData.lastName}' updated successfully.`);
          setIsAddUserModalOpen(false);
          setUserToEdit(null);
        } catch (err: any) {
          const status = err?.response?.status;
          const rawMsg = getApiErrorMessage(err, '');
          const isEmailConflict =
            status === 409 ||
            rawMsg.toLowerCase().includes('already exist') ||
            rawMsg.toLowerCase().includes('email already exists');

          if (isEmailConflict) {
            toast.error(
              'A user with this email address already exists. Use the Reset Password or Resend Enrollment options if they cannot access the system.'
            );
          } else {
            const msg = rawMsg || 'Failed to update user.';
            toast.error(msg, { title: 'Update Failed' });
          }
        }
      } else {
        // Create new user
        try {
          const created = await administrationApi.createUser({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
          });

          const resolvedSiteId = activeSiteId || undefined;

          // If site permission was selected, assign it
          if (created?.id && formData.sitePermissions) {
            const siteRoleCode = normalizeSiteRoleCode(formData.sitePermissions);
            const sitePerm = toSitePermissionLabel(siteRoleCode);
            if (siteRoleCode !== 'NONE') {
              const roleCode =
                SITE_PERMISSION_TO_ROLE_CODE[sitePerm] || siteRoleCode;
              try {
                await administrationApi.assignScopedRole(created.id, {
                  roleCode,
                  scopeType: 'SITE',
                  scopeId: resolvedSiteId as any,
                });
              } catch (siteErr: any) {
                console.error('Failed to assign site permission:', siteErr);
                const sMsg = getApiErrorMessage(siteErr, 'Access error');
                toast.warning(`User created, but site permission '${sitePerm}' could not be granted: ${sMsg}`);
              }
            }
          }

          // If study assignments were selected, grant access
          if (created?.id && formData.assignedStudies && formData.assignedStudies.length > 0) {
            for (const s of formData.assignedStudies) {
              try {
                await administrationApi.grantStudyAccess(s.studyId, created.id, {
                  studyRole: s.permission || 'Study Member',
                  studyPermission: s.permission,
                });
              } catch (studyErr: any) {
                console.error(`Failed to assign study ${s.studyName}:`, studyErr);
                const sMsg = getApiErrorMessage(studyErr, 'Access error');
                toast.warning(`User created, but study access to '${s.studyName}' could not be granted: ${sMsg}`);
              }
            }
          }

          // Send invitation email to the newly registered email address
          let invitationSent = false;
          if (created?.id) {
            try {
              await administrationApi.sendUserInvitation(created.id);
              invitationSent = true;
            } catch (invErr: any) {
              console.error('Failed to send invitation email:', invErr);
              const invMsg = getApiErrorMessage(invErr, 'Email delivery failed.');
              toast.warning(`User created, but invitation email could not be sent: ${invMsg}`);
            }
          }

          await fetchUsers(true);
          if (invitationSent) {
            toast.success(`User '${formData.firstName} ${formData.lastName}' created and invitation sent to ${formData.email}.`);
          } else {
            toast.success(`User '${formData.firstName} ${formData.lastName}' created successfully.`);
          }
          setIsAddUserModalOpen(false);
          setUserToEdit(null);
        } catch (err: any) {
          const status = err?.response?.status;
          const rawMsg = getApiErrorMessage(err, '');
          const isEmailConflict =
            status === 409 ||
            rawMsg.toLowerCase().includes('already exist') ||
            rawMsg.toLowerCase().includes('email already exists');

          if (isEmailConflict) {
            toast.error(
              'A user with this email address already exists. Use the Reset Password or Resend Enrollment options if they cannot access the system.'
            );
          } else {
            const msg = rawMsg || 'Failed to create user.';
            toast.error(msg, { title: 'Creation Failed' });
          }
        }
      }
    },
    [userToEdit, fetchUsers, activeSiteId]
  );

  const handleLockUserFromModal = useCallback(
    async (user: SiteAdminUser) => {
      try {
        await administrationApi.deactivateUser(user.id);
        await fetchUsers(true);
        toast.warning(`User account for '${user.name}' has been locked (deactivated).`);
        setIsAddUserModalOpen(false);
        setUserToEdit(null);
      } catch (err: any) {
        const msg = getApiErrorMessage(err, 'Failed to deactivate user.');
        toast.error(msg, { title: 'Lock Failed' });
      }
    },
    [fetchUsers]
  );

  const handleUnlockUserFromModal = useCallback(
    async (user: SiteAdminUser) => {
      try {
        await administrationApi.activateUser(user.id);
        await fetchUsers(true);
        toast.success(`User '${user.name}' has been unlocked.`);
        setIsAddUserModalOpen(false);
        setUserToEdit(null);
      } catch (err: any) {
        const msg = getApiErrorMessage(err, 'Failed to unlock user.');
        toast.error(msg, { title: 'Unlock Failed' });
      }
    },
    [fetchUsers]
  );

  const handleResendEnrollment = useCallback(async (user: SiteAdminUser) => {
    try {
      await administrationApi.sendUserInvitation(user.id);
      toast.success(`Enrollment invitation sent to ${user.email}.`);
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to send enrollment invitation.');
      toast.error(msg, { title: 'Invitation Failed' });
    }
  }, []);

  const handleResetPassword = useCallback(async (user: SiteAdminUser) => {
    try {
      await administrationApi.requestPasswordReset(user.email);
      toast.success(`Password reset instructions sent to ${user.email}.`);
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to send password reset request.');
      toast.error(msg, { title: 'Reset Failed' });
    }
  }, []);

  const handleDeleteUser = useCallback(
    (user: SiteAdminUser) => {
      void requestConfirmation({
        entityName: user.name,
        intent: 'warning',
        title: 'Deactivate user account',
        confirmText: 'Deactivate User',
        loadingText: 'Deactivating user account...',
        message: `The backend does not support physical user deletion. Deactivate user account “${user.name}” (${user.email}) instead?`,
        onConfirm: async () => {
          try {
            await administrationApi.deactivateUser(user.id);
            await fetchUsers(true);
            toast.warning(`User '${user.name}' deactivated (status: Disabled).`);
          } catch (err: any) {
            const msg = getApiErrorMessage(err, 'Failed to deactivate user.');
            toast.error(msg, { title: 'Deactivation Failed' });
          }
        },
      });
    },
    [fetchUsers]
  );

  const handleToggleStatus = useCallback(
    (user: SiteAdminUser) => {
      const isCurrentlyActive = user.status === 'Active';
      if (isCurrentlyActive) {
        void requestConfirmation({
          intent: 'danger',
          title: `Temporarily Lock User: ${user.name}`,
          confirmText: 'Lock User',
          cancelText: 'Cancel',
          loadingText: 'Locking user...',
          message:
            "A locked account won't be able to log in until it is manually unlocked. Only an admin will be able to unlock the user later. Are you sure you want to proceed?",
          onConfirm: async () => {
            try {
              await administrationApi.deactivateUser(user.id);
              await fetchUsers(true);
              toast.warning(`User account for '${user.name}' has been locked.`);
            } catch (err: any) {
              const msg = getApiErrorMessage(err, 'Failed to lock user.');
              toast.error(msg, { title: 'Lock Failed' });
            }
          },
        });
      } else {
        void requestConfirmation({
          intent: 'danger',
          title: `Unlock User: ${user.name}`,
          confirmText: 'Unlock User',
          cancelText: 'Cancel',
          loadingText: 'Unlocking user...',
          message:
            'The user will be able to login again. Are you sure you want to proceed?',
          onConfirm: async () => {
            try {
              await administrationApi.activateUser(user.id);
              await fetchUsers(true);
              toast.success(`User '${user.name}' has been unlocked.`);
            } catch (err: any) {
              const msg = getApiErrorMessage(err, 'Failed to unlock user.');
              toast.error(msg, { title: 'Unlock Failed' });
            }
          },
        });
      }
    },
    [fetchUsers]
  );

  const handleRefresh = useCallback(() => {
    fetchUsers(true);
    toast.info('Refreshed user directory.');
  }, [fetchUsers]);

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'users':
        return (
          <UsersGrid
            users={users}
            loading={loadingUsers}
            error={usersError}
            onAddUser={handleOpenAddUser}
            onEditUser={handleOpenEditUser}
            onDeleteUser={handleDeleteUser}
            onToggleStatus={handleToggleStatus}
            onRefresh={handleRefresh}
            onRetry={() => fetchUsers(false)}
          />
        );
      case 'studies':
        return <StudiesView />;
      case 'import':
        return <ImportView />;
      case 'export':
        return <ExportView selectedSubOption={selectedExportOption} />;
      case 'audit':
        return isFullSiteAdmin ? (
          <AuditLogView />
        ) : (
          <UsersGrid
            users={users}
            loading={loadingUsers}
            error={usersError}
            onAddUser={handleOpenAddUser}
            onEditUser={handleOpenEditUser}
            onDeleteUser={handleDeleteUser}
            onToggleStatus={handleToggleStatus}
            onRefresh={handleRefresh}
            onRetry={() => fetchUsers(false)}
          />
        );
      case 'security':
        return (
          <SecurityView
            tenantId={currentUser?.tenantId}
            isFullSiteAdmin={canManageSiteSettings}
            canEdit={canManageSiteSettings}
          />
        );
      case 'settings':
        return (
          <GeneralSettingsView
            tenantId={currentUser?.tenantId}
            isFullSiteAdmin={canManageSiteSettings}
            canEdit={canManageSiteSettings}
          />
        );
      default:
        return (
          <UsersGrid
            users={users}
            loading={loadingUsers}
            error={usersError}
            onAddUser={handleOpenAddUser}
            onEditUser={handleOpenEditUser}
            onDeleteUser={handleDeleteUser}
            onToggleStatus={handleToggleStatus}
            onRefresh={handleRefresh}
            onRetry={() => fetchUsers(false)}
          />
        );
    }
  };

  return (
    <div className="site-admin-container">
      {/* Horizontal Nav Bar (Replaces vertical side nav) */}
      <SiteAdminHorizontalNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        usersCount={users.length}
        onSelectExportOption={setSelectedExportOption}
        isFullSiteAdmin={isFullSiteAdmin}
      />

      {/* Screen Content for Active Tab */}
      {renderActiveTabContent()}

      {/* Add / Edit User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => {
          setIsAddUserModalOpen(false);
          setUserToEdit(null);
        }}
        onSave={handleSaveUser}
        userToEdit={userToEdit}
        availableStudies={availableStudies}
        loadingStudies={loadingStudies}
        siteRoles={siteRoles}
        studyRoles={studyRoles}
        canManageSiteAdmins={isFullSiteAdmin}
        currentUserId={currentUser?.id}
        currentUserEmail={currentUser?.email}
        onLockUser={handleLockUserFromModal}
        onUnlockUser={handleUnlockUserFromModal}
        onResendEnrollment={handleResendEnrollment}
        onResetPassword={handleResetPassword}
      />



    </div>
  );
};

export default SiteAdminDashboard;
