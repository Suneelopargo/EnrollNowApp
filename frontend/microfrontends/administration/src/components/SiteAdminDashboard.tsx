import React, { useState, useCallback, useEffect } from 'react';
import { toast } from '../../../../shared/toaster';
import { requestConfirmation, ConfirmationContainer } from '../../../../shared/confirmation';
import { administrationApi } from '../../../../shared/api/administrationApi';
import { SiteAdminHorizontalNav } from './SiteAdminHorizontalNav';
import { UsersGrid } from './UsersGrid';
import { AddUserModal, UserFormData } from './AddUserModal';
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
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (quiet = false) => {
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
            sitePermissions: u.sitePermission || '',
            studies: studyNames,
            status: u.status === 'ACTIVE' ? 'Active' : 'Inactive',
            title: u.title || '',
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
      if (!quiet) setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<SiteAdminUser | null>(null);

  // User Actions
  const handleOpenAddUser = useCallback(() => {
    setUserToEdit(null);
    setIsAddUserModalOpen(true);
  }, []);

  const handleOpenEditUser = useCallback((user: SiteAdminUser) => {
    setUserToEdit(user);
    setIsAddUserModalOpen(true);
  }, []);

  const handleSaveUser = useCallback(
    async (formData: UserFormData) => {
      if (userToEdit) {
        // Edit existing user
        try {
          await administrationApi.updateUser(userToEdit.id, {
            firstName: formData.firstName,
            lastName: formData.lastName,
            title: formData.title,
          });

          // Sync study access assignments
          if (formData.assignedStudies && formData.assignedStudies.length > 0) {
            for (const s of formData.assignedStudies) {
              await administrationApi.grantStudyAccess(s.studyId, userToEdit.id, {
                studyRole: s.permission || 'Admin',
                studyPermission: s.permission || 'Admin',
              });
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
          const msg = err?.response?.data?.message || err?.message || 'Failed to update user.';
          toast.error(msg, { title: 'Update Failed' });
        }
      } else {
        // Create new user
        try {
          const created = await administrationApi.createUser({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            title: formData.title,
          });

          // If study assignments were selected, grant access
          if (created?.id && formData.assignedStudies && formData.assignedStudies.length > 0) {
            for (const s of formData.assignedStudies) {
              await administrationApi.grantStudyAccess(s.studyId, created.id, {
                studyRole: s.permission || 'Admin',
                studyPermission: s.permission || 'Admin',
              });
            }
          }

          await fetchUsers(true);
          toast.success(`User '${formData.firstName} ${formData.lastName}' created successfully.`);
          setIsAddUserModalOpen(false);
          setUserToEdit(null);
        } catch (err: any) {
          const msg = err?.response?.data?.message || err?.message || 'Failed to create user.';
          toast.error(msg, { title: 'Creation Failed' });
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

  const handleUnlockUserFromModal = useCallback(async () => {
    toast.info('User reactivation is not supported by the Sprint 1 backend API.', {
      title: 'Action Unsupported',
    });
    setIsAddUserModalOpen(false);
    setUserToEdit(null);
  }, []);

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
          entityName: user.name,
          intent: 'warning',
          title: 'Deactivate user account',
          confirmText: 'Deactivate User',
          loadingText: 'Deactivating user account...',
          message: `Are you sure you want to deactivate “${user.name}” (${user.email})? The user will not be able to log in until reactivated.`,
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
      } else {
        toast.info('User reactivation is not supported by the Sprint 1 backend API.', {
          title: 'Action Unsupported',
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
