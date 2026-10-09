// frontend/microfrontends/administration/src/components/UsersGrid.tsx - AG Grid Users Table & Toolbar
import React, { useState, useMemo, useCallback } from 'react';
import {
  DataGrid,
  type ColDef,
  type GridApi,
  type ICellRendererParams,
} from '../../../../shared/design-system/components/DataGrid';
import {
  UserPlus,
  Search,
  X,
  RotateCw,
  Mail,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { SiteAdminUser, UserStatus } from '../types/admin';

// ---------------------------------------------------------------------------
// Custom Cell Renderers (CSS classes only - NO inline styles!)
// ---------------------------------------------------------------------------
const UserNameCellRenderer: React.FC<ICellRendererParams<SiteAdminUser>> = (params) => {
  const user = params.data;
  if (!user) return null;

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    params.context?.onEditUser?.(user);
  };

  return (
    <div className="site-admin-user-cell">
      <div className="site-admin-avatar" aria-hidden="true">
        {initials || 'U'}
      </div>
      <button
        type="button"
        className="site-admin-user-name-btn"
        onClick={handleClick}
        title={`View or edit ${user.name}`}
      >
        {user.name}
      </button>
    </div>
  );
};

const UserEmailCellRenderer: React.FC<ICellRendererParams<SiteAdminUser>> = (params) => {
  const email = params.value;
  if (!email) return null;

  return (
    <div className="site-admin-email-cell">
      <Mail size={14} aria-hidden="true" />
      <span>{email}</span>
    </div>
  );
};

const UserPermissionCellRenderer: React.FC<ICellRendererParams<SiteAdminUser>> = (params) => {
  const permission = params.value || 'Viewer';

  return (
    <div className="site-admin-permission-cell">
      <span className="site-admin-permission-pill">
        <ShieldCheck size={13} aria-hidden="true" />
        <span>{permission}</span>
      </span>
    </div>
  );
};

const UserStudiesCellRenderer: React.FC<ICellRendererParams<SiteAdminUser>> = (params) => {
  const studies: string[] = params.value || [];
  if (!studies || studies.length === 0) {
    return <span className="site-admin-studies-cell">None assigned</span>;
  }

  return (
    <div className="site-admin-studies-cell" title={studies.join(', ')}>
      <span>{studies.join(', ')}</span>
    </div>
  );
};

const UserStatusCellRenderer: React.FC<ICellRendererParams<SiteAdminUser>> = (params) => {
  const status: UserStatus = params.value || 'Active';
  const isActive = status === 'Active';

  return (
    <div className="site-admin-status-cell">
      <span
        className={`site-admin-status-badge ${
          isActive ? 'is-active' : 'is-inactive'
        }`}
      >
        {status}
      </span>
    </div>
  );
};

const UserActionsCellRenderer: React.FC<ICellRendererParams<SiteAdminUser>> = (params) => {
  const user = params.data;
  if (!user) return null;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    params.context?.onEditUser?.(user);
  };

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    params.context?.onToggleStatus?.(user);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    params.context?.onDeleteUser?.(user);
  };

  const isUserActive = user.status === 'Active';

  return (
    <div className="site-admin-actions-cell">
      <button
        type="button"
        className="site-admin-row-btn"
        onClick={handleEdit}
        title="Edit user details"
        aria-label={`Edit ${user.name}`}
      >
        <Pencil size={14} aria-hidden="true" />
      </button>

      <button
        type="button"
        className="site-admin-row-btn"
        onClick={handleToggleStatus}
        title={isUserActive ? 'Deactivate user' : 'Activate user'}
        aria-label={isUserActive ? `Deactivate ${user.name}` : `Activate ${user.name}`}
      >
        {isUserActive ? (
          <XCircle size={14} aria-hidden="true" />
        ) : (
          <CheckCircle2 size={14} aria-hidden="true" />
        )}
      </button>

      <button
        type="button"
        className="site-admin-row-btn is-danger"
        onClick={handleDelete}
        title="Delete user"
        aria-label={`Delete ${user.name}`}
      >
        <Trash2 size={14} aria-hidden="true" />
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export interface UsersGridProps {
  users: SiteAdminUser[];
  onAddUser: () => void;
  onEditUser: (user: SiteAdminUser) => void;
  onDeleteUser: (user: SiteAdminUser) => void;
  onToggleStatus: (user: SiteAdminUser) => void;
  onRefresh: () => void;
}

export const UsersGrid: React.FC<UsersGridProps> = ({
  users,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onToggleStatus,
  onRefresh,
}) => {
  const [gridApi, setGridApi] = useState<GridApi<SiteAdminUser> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('Active');

  // Filter users based on search query and status dropdown
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Status filter
      if (statusFilter === 'Active' && u.status !== 'Active') return false;
      if (statusFilter === 'Inactive' && u.status !== 'Inactive') return false;

      // Search term filter
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchPerms = u.sitePermissions.toLowerCase().includes(q);
      const matchStudies = u.studies.some((s) => s.toLowerCase().includes(q));

      return matchName || matchEmail || matchPerms || matchStudies;
    });
  }, [users, statusFilter, searchTerm]);

  // Counts
  const activeCount = useMemo(() => users.filter((u) => u.status === 'Active').length, [users]);
  const inactiveCount = users.length - activeCount;

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<SiteAdminUser>[]>(
    () => [
      {
        headerName: 'Name',
        field: 'name',
        sortable: true,
        sort: 'asc', // Default sorted ascending as in screenshot
        filter: true,
        minWidth: 220,
        flex: 1.2,
        cellRenderer: UserNameCellRenderer,
      },
      {
        headerName: 'Email',
        field: 'email',
        sortable: true,
        filter: true,
        minWidth: 240,
        flex: 1.3,
        cellRenderer: UserEmailCellRenderer,
      },
      {
        headerName: 'Site Permissions',
        field: 'sitePermissions',
        sortable: true,
        filter: true,
        minWidth: 170,
        flex: 1,
        cellRenderer: UserPermissionCellRenderer,
      },
      {
        headerName: 'Studies',
        field: 'studies',
        sortable: false,
        filter: true,
        minWidth: 320,
        flex: 2,
        cellRenderer: UserStudiesCellRenderer,
        valueFormatter: (params) => {
          return Array.isArray(params.value) ? params.value.join(', ') : '';
        },
      },
      {
        headerName: 'Status',
        field: 'status',
        sortable: true,
        filter: true,
        minWidth: 120,
        width: 130,
        cellRenderer: UserStatusCellRenderer,
      },
      {
        headerName: 'Actions',
        field: 'id',
        sortable: false,
        filter: false,
        minWidth: 110,
        width: 120,
        pinned: 'right',
        cellRenderer: UserActionsCellRenderer,
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      suppressMovable: false,
    }),
    []
  );

  const handleExportCsv = useCallback(() => {
    gridApi?.exportDataAsCsv({
      fileName: `site-users-${new Date().toISOString().slice(0, 10)}.csv`,
      columnKeys: ['name', 'email', 'sitePermissions', 'studies', 'status'],
      processCellCallback: (params) => {
        if (params.column.getColId() === 'studies' && Array.isArray(params.value)) {
          return params.value.join(', ');
        }
        return params.value ?? '';
      },
    });
  }, [gridApi]);

  return (
    <div className="site-admin-users-card">
      {/* Top Toolbar matching screenshot: Edit Users title + "+ Add User" on left, Filter + Search on right */}
      <div className="site-admin-users-toolbar">
        <div className="site-admin-toolbar-left">
          <div className="site-admin-title-wrap">
            <h2 className="site-admin-screen-title">Edit Users</h2>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onAddUser}
          >
            <UserPlus size={16} aria-hidden="true" />
            <span>Add User</span>
          </button>
        </div>

        <div className="site-admin-toolbar-right">
          {/* Status Filter Dropdown matching screenshot ("Active Users") */}
          <div className="site-admin-filter-select-wrap">
            <select
              aria-label="Filter users by active status"
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Active' | 'Inactive')}
            >
              <option value="Active">Active Users</option>
              <option value="Inactive">Inactive Users</option>
              <option value="All">All Users</option>
            </select>
          </div>

          {/* Search Box matching screenshot */}
          <div className="site-admin-search-wrap">
            <input
              type="text"
              placeholder="Search users..."
              className="form-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="site-admin-search-clear"
                onClick={() => setSearchTerm('')}
                title="Clear search"
                aria-label="Clear search query"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              className="site-admin-search-btn"
              title="Search"
              aria-label="Search"
            >
              <Search size={15} aria-hidden="true" />
            </button>
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onRefresh}
            title="Refresh user list"
            aria-label="Refresh user list"
          >
            <RotateCw size={15} aria-hidden="true" />
          </button>

          {/* Export Action */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCsv}
            title="Export CSV"
            aria-label="Export CSV"
          >
            <Download size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Stats counter strip */}
      <div className="site-admin-stats-bar">
        <span className="site-admin-stat-item">
          Total Users: <strong>{users.length}</strong>
        </span>
        <span className="site-admin-stat-item">
          Active: <strong>{activeCount}</strong>
        </span>
        <span className="site-admin-stat-item">
          Inactive: <strong>{inactiveCount}</strong>
        </span>
        {searchTerm && (
          <span className="site-admin-stat-item">
            Filtered matches: <strong>{filteredUsers.length}</strong>
          </span>
        )}
      </div>

      {/* AG Grid Component with project global theme and styles */}
      <DataGrid
        rowData={filteredUsers}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        context={{ onEditUser, onDeleteUser, onToggleStatus }}
        onGridReady={(event) => setGridApi(event.api)}
        rowHeight={56}
        headerHeight={44}
        pagination={true}
        paginationPageSize={10}
        paginationPageSizeSelector={[5, 10, 20, 50]}
        animateRows={true}
        suppressCellFocus={true}
      />
    </div>
  );
};

export default UsersGrid;
