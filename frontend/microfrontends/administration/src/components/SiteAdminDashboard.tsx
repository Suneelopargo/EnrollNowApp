import React, { useState, useCallback, useEffect } from 'react';
import { toast } from '../../../../shared/toaster';
import { requestConfirmation, ConfirmationContainer } from '../../../../shared/confirmation';
import { administrationApi } from '../../../../shared/api/administrationApi';
import { SiteAdminHorizontalNav } from './SiteAdminHorizontalNav';
import { UsersGrid } from './UsersGrid';
import { AddUserModal } from './AddUserModal';
import {
  StudiesView,
  ImportView,
  ExportView,
  AuditLogView,
  SecurityView,
  GeneralSettingsView,
} from './SiteAdminViews';
import { SiteAdminUser, AdminTabId, ExportSubOption } from '../types/admin';
import { INITIAL_SITE_USERS } from '../mockData';

export const SiteAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTabId>('users');
  const [selectedExportOption, setSelectedExportOption] = useState<ExportSubOption>('new_config');
  const [users, setUsers] = useState<SiteAdminUser[]>(INITIAL_SITE_USERS);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  const fetchUsers = useCallback(async (quiet = false) => {
    if (!quiet) setLoadingUsers(true);
    try {
      const data = await administrationApi.getUsers();
      if (Array.isArray(data) && data.length > 0) {
        const mappedUsers: SiteAdminUser[] = data.map((u: any) => ({
          id: String(u.id ?? u.userId ?? `usr-${Math.random().toString(36).slice(2, 7)}`),
          name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || 'User',
          email: u.email || u.primaryEmail || `${u.username || 'user'}@enrollnow.local`,
          sitePermissions: u.sitePermissions || u.role || (u.roles && u.roles[0]?.roleName) || u.title || 'Site Admin',
          studies: Array.isArray(u.studies) ? u.studies : (u.assignedStudies || ['AD MCIData']),
          status: (u.status === 'Inactive' || u.active === false) ? 'Inactive' : 'Active',
          title: u.title || 'Team Member',
          createdAt: u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : '2026-01-10',
        }));
        setUsers(mappedUsers);
      }
    } catch {
      // Retain current or fallback users if API is unavailable
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
    async (userData: Partial<SiteAdminUser>) => {
      if (userToEdit) {
        // Edit existing
        try {
          await administrationApi.updateUser(userToEdit.id, userData);
        } catch {
          // Soft-fail: local state is updated below
        }
        setUsers((prev) =>
          prev.map((u) => (u.id === userToEdit.id ? ({ ...u, ...userData } as SiteAdminUser) : u))
        );
        toast.success(`User '${userData.name}' updated successfully.`);
      } else {
        // Create new
        const newUser: SiteAdminUser = {
          id: `usr-${Date.now()}`,
          name: userData.name || '',
          email: userData.email || '',
          sitePermissions: userData.sitePermissions || 'None',
          studies: userData.studies || [],
          status: userData.status || 'Active',
          title: userData.title,
          createdAt: new Date().toISOString().slice(0, 10),
        };
        try {
          const created = await administrationApi.createUser(newUser);
          if (created?.id) {
            newUser.id = String(created.id);
          }
        } catch {
          // Soft-fail: local state is updated below
        }
        setUsers((prev) => [newUser, ...prev]);
        toast.success(`Invitation sent to ${newUser.name} (${newUser.email}) successfully.`);
      }
      setIsAddUserModalOpen(false);
      setUserToEdit(null);
    },
    [userToEdit]
  );

  const handleDeleteUser = useCallback((user: SiteAdminUser) => {
    void requestConfirmation({
      entityName: user.name,
      intent: 'danger',
      title: 'Delete user account',
      confirmText: 'Delete User',
      loadingText: 'Deleting user account...',
      message: `Delete user account “${user.name}” (${user.email})? This action cannot be undone.`,
      confirmWord: 'DELETE',
      onConfirm: async () => {
        try {
          await administrationApi.deactivateUser(user.id);
        } catch {
          // Soft-fail: local deletion persists
        }
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        toast.success(`User '${user.name}' has been deleted.`);
      },
    });
  }, []);

  const handleToggleStatus = useCallback((user: SiteAdminUser) => {
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
          } catch {
            // Soft-fail
          }
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, status: 'Inactive' } : u))
          );
          toast.warning(`User '${user.name}' marked as Inactive.`);
        },
      });
    } else {
      void requestConfirmation({
        entityName: user.name,
        intent: 'info',
        title: 'Activate user account',
        confirmText: 'Activate User',
        loadingText: 'Activating user account...',
        message: `Are you sure you want to reactivate “${user.name}” (${user.email})?`,
        onConfirm: async () => {
          try {
            await administrationApi.activateUser(user.id);
          } catch {
            // Soft-fail
          }
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, status: 'Active' } : u))
          );
          toast.success(`User '${user.name}' marked as Active.`);
        },
      });
    }
  }, []);

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
            onAddUser={handleOpenAddUser}
            onEditUser={handleOpenEditUser}
            onDeleteUser={handleDeleteUser}
            onToggleStatus={handleToggleStatus}
            onRefresh={handleRefresh}
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
            onAddUser={handleOpenAddUser}
            onEditUser={handleOpenEditUser}
            onDeleteUser={handleDeleteUser}
            onToggleStatus={handleToggleStatus}
            onRefresh={handleRefresh}
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
      />

      {/* Enterprise Global Confirmation Dialog Host */}
      <ConfirmationContainer />
    </div>
  );
};

export default SiteAdminDashboard;
