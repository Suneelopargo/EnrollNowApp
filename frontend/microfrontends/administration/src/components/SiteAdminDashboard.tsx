// frontend/microfrontends/administration/src/components/SiteAdminDashboard.tsx - Site Admin Master Dashboard
import React, { useState, useCallback } from 'react';
import { toast } from '../../../../shared/toaster';
import { requestConfirmation } from '../../../../shared/confirmation';
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
    (userData: Partial<SiteAdminUser>) => {
      if (userToEdit) {
        // Edit existing
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
        setUsers((prev) => [newUser, ...prev]);
        toast.success(`Invitation sent to ${newUser.name} (${newUser.email}) successfully.`);
      }
      setIsAddUserModalOpen(false);
      setUserToEdit(null);
    },
    [userToEdit]
  );

  const handleDeleteUser = useCallback((user: SiteAdminUser) => {
    requestConfirmation({
      title: 'Delete User Account',
      message: `Are you sure you want to permanently delete '${user.name}' (${user.email})? This action cannot be undone.`,
      confirmText: 'Delete User',
      cancelText: 'Cancel',
      intent: 'danger',
      onConfirm: () => {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        toast.success(`User '${user.name}' has been deleted.`);
      },
    });
  }, []);

  const handleToggleStatus = useCallback((user: SiteAdminUser) => {
    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
    );
    toast.info(`User '${user.name}' marked as ${nextStatus}.`);
  }, []);

  const handleRefresh = useCallback(() => {
    toast.info('Refreshed user directory.');
  }, []);

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
    </div>
  );
};

export default SiteAdminDashboard;
