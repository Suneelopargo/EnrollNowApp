// frontend/microfrontends/administration/src/components/UsersGrid.tsx - AG Grid Users Table & Toolbar
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  Mail,
  Pencil,
  Lock,
  Unlock,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { SiteAdminUser, UserStatus } from '../types/admin';
import { toSitePermissionLabel } from '../../../../shared/api/administrationApi';

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
  const rawPermission = params.value;
  const permission = toSitePermissionLabel(rawPermission);
  if (!permission || permission === 'None') {
    return <span className="site-admin-permission-cell text-muted">—</span>;
  }

  return (
    <div className="site-admin-permission-cell" title={permission}>
      <span>{permission}</span>
    </div>
  );
};

const UserStudiesCellRenderer: React.FC<ICellRendererParams<SiteAdminUser>> = (params) => {
  const studies: string[] = params.value || [];
  if (!studies || studies.length === 0) {
    return <span className="site-admin-studies-cell text-muted">None assigned</span>;
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
          isActive ? 'is-active' : 'is-disabled'
        }`}
      >
        {isActive ? 'Active' : 'Disabled'}
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      const cell = (e.currentTarget as HTMLElement).closest<HTMLElement>('.ag-cell');
      cell?.focus();
    }
  };

  const isUserActive = user.status === 'Active';

  return (
    <div className="participant-grid__row-actions">
      <button
        type="button"
        className="participant-grid__row-action site-admin-tooltip-btn"
        onClick={handleEdit}
        onKeyDown={handleKeyDown}
        data-tooltip="Edit user details"
        aria-label={`Edit ${user.name}`}
      >
        <Pencil size={15} aria-hidden="true" />
      </button>

      <button
        type="button"
        className={`participant-grid__row-action ${
          isUserActive
            ? 'participant-grid__row-action--warning'
            : 'participant-grid__row-action--success'
        } site-admin-tooltip-btn`}
        onClick={handleToggleStatus}
        onKeyDown={handleKeyDown}
        data-tooltip={isUserActive ? 'Lock user' : 'Unlock user'}
        aria-label={isUserActive ? `Lock ${user.name}` : `Unlock ${user.name}`}
      >
        {isUserActive ? (
          <Lock size={15} aria-hidden="true" />
        ) : (
          <Unlock size={15} aria-hidden="true" />
        )}
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export interface UsersGridProps {
  users: SiteAdminUser[];
  loading?: boolean;
  error?: string | null;
  onAddUser: () => void;
  onEditUser: (user: SiteAdminUser) => void;
  onDeleteUser: (user: SiteAdminUser) => void;
  onToggleStatus: (user: SiteAdminUser) => void;
  onRefresh?: () => void;
  onRetry?: () => void;
}

export const UsersGrid: React.FC<UsersGridProps> = ({
  users,
  loading = false,
  error = null,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onToggleStatus,
  onRefresh,
  onRetry,
}) => {
  const [gridApi, setGridApi] = useState<GridApi<SiteAdminUser> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Disabled' | 'All'>('Active');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(e.target as Node)
      ) {
        setIsExportMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExportMenuOpen) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExportMenuOpen]);

  // Filter users based on status dropdown and sort latest record at the top
  const filteredUsers = useMemo(() => {
    const list = users.filter((u) => {
      if (statusFilter === 'Active') return u.status === 'Active';
      if (statusFilter === 'Disabled') return u.status === 'Inactive';
      return true; // 'All'
    });

    return list.slice().sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA && timeB) {
        return timeB - timeA;
      }
      if (timeB && !timeA) return 1;
      if (timeA && !timeB) return -1;
      return 0;
    });
  }, [users, statusFilter]);

  // Handle global search input change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    gridApi?.setGridOption('quickFilterText', value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    gridApi?.setGridOption('quickFilterText', '');
  };

  const onGridReady = useCallback((params: { api: GridApi<SiteAdminUser> }) => {
    setGridApi(params.api);
    if (searchTerm) {
      params.api.setGridOption('quickFilterText', searchTerm);
    }
  }, [searchTerm]);

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<SiteAdminUser>[]>(
    () => [
      {
        headerName: 'Name',
        field: 'name',
        sortable: true,
        filter: 'agTextColumnFilter',
        minWidth: 150,
        flex: 1.2,
        cellRenderer: UserNameCellRenderer,
      },
      {
        headerName: 'Email',
        field: 'email',
        sortable: true,
        filter: 'agTextColumnFilter',
        minWidth: 220,
        flex: 1.3,
        cellRenderer: UserEmailCellRenderer,
      },
      {
        headerName: 'Site Permissions',
        field: 'sitePermissions',
        sortable: true,
        filter: 'agTextColumnFilter',
        minWidth: 160,
        flex: 1,
        cellRenderer: UserPermissionCellRenderer,
        valueFormatter: (params) => {
          return toSitePermissionLabel(params.value) || '';
        },
      },
      {
        headerName: 'Studies',
        field: 'studies',
        sortable: false,
        filter: 'agTextColumnFilter',
        minWidth: 280,
        flex: 2.2,
        cellRenderer: UserStudiesCellRenderer,
        valueFormatter: (params) => {
          return Array.isArray(params.value) ? params.value.join(', ') : '';
        },
        filterValueGetter: (params) => {
          return Array.isArray(params.data?.studies)
            ? params.data.studies.join(', ')
            : params.data?.studies || '';
        },
      },
      {
        headerName: 'Status',
        field: 'status',
        sortable: true,
        filter: 'agTextColumnFilter',
        minWidth: 110,
        width: 120,
        cellRenderer: UserStatusCellRenderer,
      },
      {
        headerName: 'Actions',
        field: 'id',
        sortable: false,
        filter: false,
        floatingFilter: false,
        suppressMenu: true,
        suppressSizeToFit: true,
        width: 95,
        minWidth: 85,
        maxWidth: 105,
        pinned: 'right',
        resizable: false,
        cellClass: 'p-0 flex items-center justify-center',
        cellRenderer: UserActionsCellRenderer,
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      floatingFilter: true,
      suppressMovable: false,
    }),
    []
  );

  // Retrieve rows currently filtered and sorted in the grid
  const getExportRows = useCallback(() => {
    const rows: SiteAdminUser[] = [];
    if (gridApi) {
      gridApi.forEachNodeAfterFilterAndSort((node) => {
        if (node.data) rows.push(node.data);
      });
      return rows;
    }
    return filteredUsers;
  }, [gridApi, filteredUsers]);

  // Keyboard activation on grid cells (WAI-ARIA Grid navigation)
  const handleCellKeyDown = useCallback(
    (event: any) => {
      if (!event.event) return;
      const key = event.event.key;
      if (key === 'Enter' || key === ' ') {
        const colId = event.column?.getColId();
        if (colId === 'name' && event.data) {
          event.event.preventDefault();
          onEditUser(event.data);
        } else if (colId === 'actions' || colId === 'id') {
          event.event.preventDefault();
          const cellEl =
            (event.event.target as HTMLElement | null)?.closest?.('.ag-cell') ||
            (event.event.target as HTMLElement | null);
          const firstBtn = cellEl?.querySelector<HTMLButtonElement>('button');
          firstBtn?.focus();
        }
      }
    },
    [onEditUser]
  );

  const exportFileName = `site-users-${new Date().toISOString().slice(0, 10)}`;

  // CSV Export
  const exportCsv = () => {
    gridApi?.exportDataAsCsv({
      fileName: `${exportFileName}.csv`,
      columnKeys: ['name', 'email', 'sitePermissions', 'studies', 'status'],
      processCellCallback: (params) => {
        if (params.column.getColId() === 'studies' && Array.isArray(params.value)) {
          return params.value.join(', ');
        }
        return params.value ?? '';
      },
    });
    setIsExportMenuOpen(false);
  };

  // Excel (.xlsx) Export via ExcelJS matching participant & dashboard standard
  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Site Users', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = [
      { header: 'Name', key: 'name', width: 26 },
      { header: 'Email', key: 'email', width: 32 },
      { header: 'Site Permissions', key: 'sitePermissions', width: 20 },
      { header: 'Studies', key: 'studies', width: 45 },
      { header: 'Status', key: 'status', width: 14 },
    ];

    const rows = getExportRows();
    rows.forEach((user) => {
      sheet.addRow({
        name: user.name,
        email: user.email,
        sitePermissions: user.sitePermissions,
        studies: Array.isArray(user.studies) ? user.studies.join(', ') : (user.studies || ''),
        status: user.status,
      });
    });

    sheet.autoFilter = { from: 'A1', to: `E${Math.max(1, sheet.rowCount)}` };
    sheet.getRow(1).height = 25;
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF123A5A' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle' };
    });

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          if (rowNumber % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F7FB' } };
          }
          cell.font = { color: { argb: 'FF24445B' } };
          cell.border = { bottom: { style: 'hair', color: { argb: 'FFDCE7EE' } } };
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${exportFileName}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
    setIsExportMenuOpen(false);
  };

  // PDF Export via jsPDF & autoTable matching participant & dashboard standard
  const exportPdf = () => {
    const rows = getExportRows();
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.setTextColor('#123A5A');
    doc.text('Site Administrator Users', 14, 16);
    doc.setFontSize(9);
    doc.setTextColor('#61798D');
    doc.text(`${rows.length} user ${rows.length === 1 ? 'account' : 'accounts'}`, 14, 22);

    autoTable(doc, {
      startY: 26,
      head: [['Name', 'Email', 'Site Permissions', 'Studies', 'Status']],
      body: rows.map((user) => [
        user.name,
        user.email,
        user.sitePermissions,
        Array.isArray(user.studies) ? user.studies.join(', ') : (user.studies || ''),
        user.status,
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: [36, 68, 91],
        lineColor: [220, 231, 238],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [18, 58, 90],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [241, 247, 251] },
      margin: { left: 14, right: 14 },
    });

    doc.save(`${exportFileName}.pdf`);
    setIsExportMenuOpen(false);
  };

  return (
    <div className="card site-admin-users-card">
      {/* Top Toolbar using shared data-grid-toolbar classes */}
      <div className="card-header data-grid-toolbar site-admin-users-toolbar">
        <div className="data-grid-toolbar__heading">
          <h2 className="site-admin-screen-title">Edit Users</h2>
          <button
            type="button"
            className="btn btn-primary site-admin-add-user-btn"
            onClick={onAddUser}
          >
            <UserPlus size={16} aria-hidden="true" />
            <span>Add User</span>
          </button>
        </div>

        <div className="data-grid-toolbar__actions">
          {/* Status Filter Dropdown */}
          <div className="site-admin-filter-select-wrap">
            <select
              aria-label="Filter users by active status"
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'Active' | 'Disabled' | 'All')}
            >
              <option value="Active">Active Users</option>
              <option value="Disabled">Disabled Users</option>
              <option value="All">All Users</option>
            </select>
          </div>

          {/* Global Data Grid Search */}
          <div className="data-grid-toolbar__search">
            <input
              type="text"
              placeholder="Search users..."
              className="form-input"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label="Search users"
            />
            {searchTerm && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleClearSearch}
                title="Clear search"
                aria-label="Clear search query"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
            <Search size={14} aria-hidden="true" />
          </div>

          {/* Global Data Grid Export Menu */}
          <div className="data-grid-export-menu-wrap" ref={exportMenuRef}>
            <button
              type="button"
              className="data-grid-export-trigger"
              aria-haspopup="menu"
              aria-expanded={isExportMenuOpen}
              onClick={() => setIsExportMenuOpen((open) => !open)}
              title="Export data"
              aria-label="Export data options"
            >
              <Download size={15} /> Export <ChevronDown size={14} />
            </button>
            {isExportMenuOpen && (
              <div className="data-grid-export-menu" role="menu" aria-label="Choose export format">
                <button type="button" role="menuitem" onClick={exportCsv}>
                  <Download size={15} />
                  <span>CSV</span>
                  <small>Comma-separated values</small>
                </button>
                <button type="button" role="menuitem" onClick={() => void exportExcel()}>
                  <FileSpreadsheet size={15} />
                  <span>Excel</span>
                  <small>Excel workbook (.xlsx)</small>
                </button>
                <button type="button" role="menuitem" onClick={exportPdf}>
                  <FileText size={15} />
                  <span>PDF</span>
                  <small>Portable document</small>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="site-admin-users-card-body">
        {/* Global DataGrid */}
        <DataGrid
          loading={loading}
          rowData={filteredUsers}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          context={{ onEditUser, onDeleteUser, onToggleStatus }}
          onGridReady={onGridReady}
          quickFilterText={searchTerm}
          rowHeight={56}
          headerHeight={44}
          floatingFiltersHeight={38}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[5, 10, 20, 50]}
          animateRows={true}
          onCellKeyDown={handleCellKeyDown}
        />
      </div>
    </div>
  );
};

export default UsersGrid;
