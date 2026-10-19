import React, { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from '../../../../shared/toaster';
import { requestConfirmation, ConfirmationContainer } from '../../../../shared/confirmation';
import {
  administrationApi,
  RoleResponse,
  toSitePermissionLabel,
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

export const SiteAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTabId>('users');
  const [selectedExportOption, setSelectedExportOption] = useState<ExportSubOption>('new_config');
  const [users, setUsers] = useState<SiteAdminUser[]>([]);
  const [availableStudies, setAvailableStudies] = useState<AvailableStudy[]>([]);
  const [loadingStudies, setLoadingStudies] = useState<boolean>(false);
  const [siteRoles, setSiteRoles] = useState<RoleResponse[]>([]);
  const [studyRoles, setStudyRoles] = useState<RoleResponse[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const isFetchingUsersRef = useRef(false);
  const isFetchingRolesRef = useRef(false);
  const isFetchingStudiesRef = useRef(false);

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
      const data = await administrationApi.getDetailedUsers();
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
            sitePermissionCode: u.sitePermission,
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
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load user directory from backend.';
      setUsersError(msg);
      setUsers([]);
      toast.error(msg, { title: 'User Directory Error' });
    } finally {
      isFetchingUsersRef.current = false;
      if (!quiet) setLoadingUsers(false);
    }
  }, []);

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
          const oldSitePerm = toSitePermissionLabel(userToEdit.sitePermissions);
          const newSitePerm = toSitePermissionLabel(formData.sitePermissions);

          if (newSitePerm !== oldSitePerm) {
            if (newSitePerm === 'None' || !newSitePerm) {
              await administrationApi.removeSiteRole(userToEdit.id).catch((err) => {
                console.warn('Failed to remove site role:', err);
              });
            } else {
              const roleCode =
                SITE_PERMISSION_TO_ROLE_CODE[newSitePerm] ||
                (formData.sitePermissions ? SITE_PERMISSION_TO_ROLE_CODE[formData.sitePermissions] : undefined) ||
                newSitePerm;
              const resolvedSiteId = userToEdit.siteId || users.find((u) => u.siteId)?.siteId || undefined;
              try {
                await administrationApi.assignScopedRole(userToEdit.id, {
                  roleCode,
                  scopeType: 'SITE',
                  scopeId: resolvedSiteId as any,
                });
              } catch (siteErr: any) {
                console.error('Failed to update site permission:', siteErr);
                const sMsg = siteErr?.response?.data?.message || siteErr?.message || 'Access error';
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
                const sMsg = studyErr?.response?.data?.message || studyErr?.message || 'Access error';
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
          toast.success(`User '${formData.firstName} ${formData.lastName}' updated successfully.`);
          setIsAddUserModalOpen(false);
          setUserToEdit(null);
        } catch (err: any) {
          const status = err?.response?.status;
          const rawMsg = err?.response?.data?.message || err?.message || '';
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

          // If site permission was selected, assign it
          if (created?.id && formData.sitePermissions) {
            const sitePerm = toSitePermissionLabel(formData.sitePermissions);
            if (sitePerm && sitePerm !== 'None') {
              const roleCode = SITE_PERMISSION_TO_ROLE_CODE[sitePerm] || SITE_PERMISSION_TO_ROLE_CODE[formData.sitePermissions] || formData.sitePermissions;
              const resolvedSiteId = users.find((u) => u.siteId)?.siteId || undefined;
              try {
                await administrationApi.assignScopedRole(created.id, {
                  roleCode,
                  scopeType: 'SITE',
                  scopeId: resolvedSiteId as any,
                });
              } catch (siteErr: any) {
                console.error('Failed to assign site permission:', siteErr);
                const sMsg = siteErr?.response?.data?.message || siteErr?.message || 'Access error';
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
                const sMsg = studyErr?.response?.data?.message || studyErr?.message || 'Access error';
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
              const invMsg = invErr?.response?.data?.message || invErr?.message || 'Email delivery failed.';
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
          const rawMsg = err?.response?.data?.message || err?.message || '';
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
    [userToEdit, fetchUsers]
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
        const msg = err?.response?.data?.message || err?.message || 'Failed to deactivate user.';
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
        const msg = err?.response?.data?.message || err?.message || 'Failed to unlock user.';
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
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to send enrollment invitation.';
      toast.error(msg, { title: 'Invitation Failed' });
    }
  }, []);

  const handleResetPassword = useCallback(async (user: SiteAdminUser) => {
    try {
      await administrationApi.requestPasswordReset(user.email);
      toast.success(`Password reset instructions sent to ${user.email}.`);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to send password reset request.';
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
            const msg =
              err?.response?.data?.message ||
              err?.message ||
              'Failed to deactivate user.';
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
              const msg =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to lock user.';
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
              const msg =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to unlock user.';
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
        return <AuditLogView />;
      case 'security':
        return <SecurityView />;
      case 'settings':
        return <GeneralSettingsView />;
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
        onLockUser={handleLockUserFromModal}
        onUnlockUser={handleUnlockUserFromModal}
        onResendEnrollment={handleResendEnrollment}
        onResetPassword={handleResetPassword}
      />

      {/* Enterprise Global Confirmation Dialog Host */}
      <ConfirmationContainer />
    </div>
  );
};

export default SiteAdminDashboard;
