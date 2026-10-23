// frontend/microfrontends/administration/src/components/ManageStudiesView.tsx - Manage Studies Table with Global AG Grid
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  DataGrid,
  type ColDef,
  type GridApi,
  type ICellRendererParams,
} from '../../../../shared/design-system/components/DataGrid';
import { AddStudyModal } from '../../../../shared/design-system/components/AddStudyModal';
import { studyApi, Study, StudyAdmin } from '../../../../shared/api/studyApi';
import { toast } from '../../../../shared/toaster';
import { confirmation } from '../../../../shared/confirmation';
import { getApiErrorMessage } from '../../../../shared/api-client';
import {
  Plus,
  Search,
  X,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
} from 'lucide-react';

// Format LocalDate (YYYY-MM-DD or ISO) to MM/DD/YY
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const parts = String(dateStr).split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parts[0].slice(-2);
      const month = parts[1];
      const day = parts[2];
      return `${month}/${day}/${year}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      return `${mm}/${dd}/${yy}`;
    }
  } catch {
    // fallback
  }
  return '';
}

// ---------------------------------------------------------------------------
// Custom Cell Renderers (matching UsersGrid styling and standards)
// ---------------------------------------------------------------------------
const StudyNameCellRenderer: React.FC<ICellRendererParams<Study>> = (params) => {
  const study = params.data;
  if (!study) return null;
  const name = study.name || study.title || 'Untitled Study';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    params.context?.onOpenStudy?.(study);
  };

  return (
    <div className="site-admin-user-cell">
      <button
        type="button"
        className="site-admin-user-name-btn"
        onClick={handleClick}
        title={`Open ${name}`}
      >
        {name}
      </button>
    </div>
  );
};

const StudyAdminCellRenderer: React.FC<ICellRendererParams<Study>> = (params) => {
  const admins: StudyAdmin[] = params.data?.admins || [];
  if (!admins || admins.length === 0) {
    return <span className="site-admin-studies-cell text-muted">—</span>;
  }

  return (
    <div className="site-admin-user-cell" style={{ gap: '4px', flexWrap: 'wrap', overflow: 'visible' }}>
      {admins.map((adm, idx) => {
        const adminName = adm.name || 'Admin';
        return (
          <span
            key={adm.userId || adm.email || idx}
            className="site-admin-avatar site-admin-tooltip-btn"
            style={{ width: '28px', height: '28px', fontSize: '11px', cursor: 'default' }}
            data-tooltip={adminName}
            aria-label={adminName}
          >
            {adm.initials || 'AD'}
          </span>
        );
      })}
    </div>
  );
};

const StudyDateCellRenderer: React.FC<ICellRendererParams<Study>> = (params) => {
  const val = params.value;
  if (!val) return <span className="site-admin-studies-cell text-muted">—</span>;
  return (
    <div className="site-admin-studies-cell">
      <span>{val}</span>
    </div>
  );
};

const StudyActionsCellRenderer: React.FC<ICellRendererParams<Study>> = (params) => {
  const study = params.data;
  if (!study) return null;
  const isArchived = study.archived || String(study.status || '').toUpperCase() === 'ARCHIVED';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      const cell = (e.currentTarget as HTMLElement).closest<HTMLElement>('.ag-cell');
      cell?.focus();
    }
  };

  const studyName = study.name || study.title || 'Study';

  if (isArchived) {
    return (
      <div className="participant-grid__row-actions">
        <button
          type="button"
          className="participant-grid__row-action participant-grid__row-action--success site-admin-tooltip-btn"
          onClick={(e) => {
            e.stopPropagation();
            params.context?.onRestoreStudy?.(study);
          }}
          onKeyDown={handleKeyDown}
          data-tooltip={`Unarchive ${studyName}`}
          aria-label={`Unarchive ${studyName}`}
        >
          <ArchiveRestore size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="participant-grid__row-action participant-grid__row-action--danger site-admin-tooltip-btn"
          onClick={(e) => {
            e.stopPropagation();
            params.context?.onDeleteStudy?.(study);
          }}
          onKeyDown={handleKeyDown}
          data-tooltip={`Delete ${studyName}`}
          aria-label={`Delete ${studyName}`}
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="participant-grid__row-actions">
      <button
        type="button"
        className="participant-grid__row-action site-admin-tooltip-btn"
        onClick={(e) => {
          e.stopPropagation();
          params.context?.onEditStudy?.(study);
        }}
        onKeyDown={handleKeyDown}
        data-tooltip={`Edit ${studyName}`}
        aria-label={`Edit ${studyName}`}
      >
        <Pencil size={15} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="participant-grid__row-action participant-grid__row-action--warning site-admin-tooltip-btn"
        onClick={(e) => {
          e.stopPropagation();
          params.context?.onArchiveStudy?.(study);
        }}
        onKeyDown={handleKeyDown}
        data-tooltip={`Archive ${studyName}`}
        aria-label={`Archive ${studyName}`}
      >
        <Archive size={15} aria-hidden="true" />
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export interface ManageStudiesViewProps {
  onAddStudy?: () => void;
  initialAddModalOpen?: boolean;
}

export const ManageStudiesView: React.FC<ManageStudiesViewProps> = ({
  initialAddModalOpen = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [studyToEdit, setStudyToEdit] = useState<Study | null>(null);
  const [isAddStudyModalOpen, setIsAddStudyModalOpen] = useState<boolean>(() => {
    if (initialAddModalOpen) return true;
    try {
      const params = new URLSearchParams(location.search);
      return params.get('action') === 'add';
    } catch {
      return false;
    }
  });

  const [gridApi, setGridApi] = useState<GridApi<Study> | null>(null);

  const handleCloseModal = useCallback(() => {
    setIsAddStudyModalOpen(false);
    setStudyToEdit(null);
    try {
      const params = new URLSearchParams(location.search);
      if (params.has('action')) {
        params.delete('action');
        const searchStr = params.toString() ? `?${params.toString()}` : '';
        navigate(`${location.pathname}${searchStr}`, { replace: true });
      }
    } catch {
      // ignore
    }
  }, [location.pathname, location.search, navigate]);

  // Check URL query parameters for action=add
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add') {
      setIsAddStudyModalOpen(true);
    }
  }, [location.search]);

  // Close export dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
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

  // Load studies from API based on filter
  const fetchStudies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await studyApi.getStudies({
        status: filter,
        includeArchived: filter === 'archived' || filter === 'all',
      });
      setStudies(Array.isArray(list) ? list : []);
    } catch (err: any) {
      const msg = getApiErrorMessage(err) || 'Failed to load studies list.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchStudies();
  }, [fetchStudies]);

  // Quick filter search handlers matching UsersGrid
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    gridApi?.setGridOption('quickFilterText', val);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    gridApi?.setGridOption('quickFilterText', '');
  };

  const onGridReady = useCallback(
    (params: { api: GridApi<Study> }) => {
      setGridApi(params.api);
      if (searchTerm) {
        params.api.setGridOption('quickFilterText', searchTerm);
      }
    },
    [searchTerm]
  );

  // Study Action Handlers
  const handleOpenStudy = useCallback(
    (study: Study) => {
      const targetId = String(study.id ?? study.studyId ?? study.protocolNumber);
      navigate(`/studies?studyId=${encodeURIComponent(targetId)}`);
    },
    [navigate]
  );

  const handleEditStudy = useCallback((study: Study) => {
    setStudyToEdit(study);
    setIsAddStudyModalOpen(true);
  }, []);

  const handleArchiveStudy = useCallback(
    async (study: Study) => {
      const targetId = String(study.id ?? study.studyId ?? study.protocolNumber);
      const confirmed = await confirmation.confirm({
        title: 'Are you sure?',
        message: `Are you sure you want to archive the ${study.name || study.title} study? Archiving the study will make it read-only to all study users.`,
        confirmText: 'Yes, Archive',
        cancelText: 'Cancel',
        intent: 'warning',
      });

      if (!confirmed) return;

      try {
        await studyApi.archiveStudy(targetId);
        toast.success('Success! Study Archived');
        fetchStudies();
      } catch (err: any) {
        const msg = getApiErrorMessage(err) || 'Something went wrong when archiving the study.';
        toast.error(msg);
      }
    },
    [fetchStudies]
  );

  const handleRestoreStudy = useCallback(
    async (study: Study) => {
      const targetId = String(study.id ?? study.studyId ?? study.protocolNumber);
      const confirmed = await confirmation.confirm({
        title: 'Are you sure?',
        message: `Are you sure you want to unarchive the ${study.name || study.title} study? Restoring the study will make it editable to all study users.`,
        confirmText: 'Yes, Restore',
        cancelText: 'Cancel',
        intent: 'info',
      });

      if (!confirmed) return;

      try {
        await studyApi.restoreStudy(targetId);
        toast.success('Success! Study Restored');
        fetchStudies();
      } catch (err: any) {
        const msg = getApiErrorMessage(err) || 'Something went wrong when restoring the study.';
        toast.error(msg);
      }
    },
    [fetchStudies]
  );

  const handleDeleteStudy = useCallback(
    async (study: Study) => {
      const targetId = String(study.id ?? study.studyId ?? study.protocolNumber);
      const confirmed = await confirmation.confirm({
        title: 'Delete Study?',
        message: `Are you sure you want to permanently delete the ${study.name || study.title} study and all its associated data? This action cannot be undone.`,
        confirmText: 'Delete Study',
        cancelText: 'Cancel',
        intent: 'danger',
      });

      if (!confirmed) return;

      try {
        await studyApi.deleteStudy(targetId);
        toast.success('Study deleted successfully');
        fetchStudies();
      } catch (err: any) {
        const msg = getApiErrorMessage(err) || 'Failed to delete study.';
        toast.error(msg);
      }
    },
    [fetchStudies]
  );

  // Keyboard navigation on grid cells
  const handleCellKeyDown = useCallback(
    (event: any) => {
      if (!event.event) return;
      const key = event.event.key;
      if (key === 'Enter' || key === ' ') {
        const colId = event.column?.getColId();
        if (colId === 'name' && event.data) {
          event.event.preventDefault();
          handleOpenStudy(event.data);
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
    [handleOpenStudy]
  );

  // Export handlers
  const getExportRows = useCallback(() => {
    const rows: Study[] = [];
    if (gridApi) {
      gridApi.forEachNodeAfterFilterAndSort((node) => {
        if (node.data) rows.push(node.data);
      });
      return rows;
    }
    return studies;
  }, [gridApi, studies]);

  const exportFileName = `studies-${new Date().toISOString().slice(0, 10)}`;

  const exportCsv = () => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: `${exportFileName}.csv`,
        columnKeys: ['name', 'admins', 'startDate', 'endDate'],
      });
    }
    setIsExportMenuOpen(false);
  };

  const exportExcel = async () => {
    const rows = getExportRows();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Studies');

    worksheet.columns = [
      { header: 'Study Name', key: 'name', width: 30 },
      { header: 'Admins', key: 'admins', width: 25 },
      { header: 'Date Active', key: 'startDate', width: 15 },
      { header: 'Date Ending', key: 'endDate', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    rows.forEach((s) => {
      const adminNames = Array.isArray(s.admins) ? s.admins.map((a) => a.name).join(', ') : '';
      worksheet.addRow({
        name: s.name || s.title || '',
        admins: adminNames,
        startDate: formatDate(s.startDate),
        endDate: formatDate(s.endDate),
        status: s.archived ? 'Archived' : 'Active',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportFileName}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };

  const exportPdf = () => {
    const rows = getExportRows();
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Manage Studies Export', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor('#61798D');
    doc.text(`${rows.length} ${rows.length === 1 ? 'study' : 'studies'}`, 14, 22);

    autoTable(doc, {
      startY: 26,
      head: [['Study Name', 'Admins', 'Date Active', 'Date Ending', 'Status']],
      body: rows.map((s) => [
        s.name || s.title || '',
        Array.isArray(s.admins) ? s.admins.map((a) => a.name).join(', ') : '',
        formatDate(s.startDate),
        formatDate(s.endDate),
        s.archived ? 'Archived' : 'Active',
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

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<Study>[]>(
    () => [
      {
        headerName: 'Name',
        field: 'name',
        sortable: true,
        filter: 'agTextColumnFilter',
        minWidth: 180,
        flex: 1.5,
        cellRenderer: StudyNameCellRenderer,
        valueGetter: (params) => params.data?.name || params.data?.title || '',
      },
      {
        headerName: 'Admin',
        field: 'admins' as any,
        sortable: false,
        filter: 'agTextColumnFilter',
        minWidth: 160,
        flex: 1.5,
        cellClass: 'site-admin-tooltip-cell',
        cellRenderer: StudyAdminCellRenderer,
        filterValueGetter: (params) => {
          const admins: StudyAdmin[] = params.data?.admins || [];
          return admins.map((a) => `${a.name} ${a.email} ${a.initials}`).join(' ');
        },
      },
      {
        headerName: 'Date Active',
        field: 'startDate',
        sortable: true,
        filter: 'agTextColumnFilter',
        minWidth: 130,
        flex: 1,
        cellRenderer: StudyDateCellRenderer,
        valueGetter: (params) => {
          return formatDate(params.data?.startDate || params.data?.recruitmentStartDate);
        },
      },
      {
        headerName: 'Date Ending',
        field: 'endDate',
        sortable: true,
        filter: 'agTextColumnFilter',
        minWidth: 130,
        flex: 1,
        cellRenderer: StudyDateCellRenderer,
        valueGetter: (params) => {
          return formatDate(params.data?.endDate || params.data?.recruitmentEndDate);
        },
      },
      {
        headerName: 'Actions',
        field: 'id' as any,
        sortable: false,
        filter: false,
        floatingFilter: false,
        suppressMenu: true,
        suppressSizeToFit: true,
        width: 140,
        minWidth: 120,
        pinned: 'right',
        resizable: false,
        cellClass: 'p-0 flex items-center justify-center site-admin-tooltip-cell',
        cellRenderer: StudyActionsCellRenderer,
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

  return (
    <div className="card site-admin-users-card">
      {/* Top Toolbar using shared data-grid-toolbar classes matching UsersGrid */}
      <div className="card-header data-grid-toolbar site-admin-users-toolbar">
        <div className="data-grid-toolbar__heading">
          <h2 className="site-admin-screen-title">Manage Studies</h2>
          <button
            type="button"
            className="btn btn-primary site-admin-add-user-btn"
            onClick={() => setIsAddStudyModalOpen(true)}
          >
            <Plus size={16} aria-hidden="true" />
            <span>Add Study</span>
          </button>
        </div>

        <div className="data-grid-toolbar__actions">
          {/* Status Filter Dropdown */}
          <div className="site-admin-filter-select-wrap">
            <select
              aria-label="Filter by Study Status"
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'active' | 'archived' | 'all')}
              className="form-select"
            >
              <option value="active">Active Studies</option>
              <option value="archived">Archived Studies</option>
              <option value="all">All Studies</option>
            </select>
          </div>

          {/* Global Data Grid Search */}
          <div className="data-grid-toolbar__search">
            <input
              type="text"
              placeholder="Search studies..."
              className="form-input"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label="Search studies"
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

          {/* Refresh Button */}
          <button
            type="button"
            className="btn btn-outline-secondary site-admin-refresh-btn"
            onClick={fetchStudies}
            title="Refresh studies list"
            aria-label="Refresh studies list"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Grid Body */}
      <div className="site-admin-users-card-body">
        {error ? (
          <div className="site-admin-error-banner" role="alert">
            <span className="site-admin-error-msg">{error}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={fetchStudies}>
              Retry
            </button>
          </div>
        ) : (
          <DataGrid<Study>
            loading={loading}
            rowData={studies}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            context={{
              onOpenStudy: handleOpenStudy,
              onEditStudy: handleEditStudy,
              onArchiveStudy: handleArchiveStudy,
              onRestoreStudy: handleRestoreStudy,
              onDeleteStudy: handleDeleteStudy,
            }}
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
        )}
      </div>

      {/* Add / Edit Study Modal (opens on top of Manage Studies) */}
      <AddStudyModal
        isOpen={isAddStudyModalOpen}
        onClose={handleCloseModal}
        studies={studies}
        studyToEdit={studyToEdit}
        onStudyCreated={() => {
          fetchStudies();
          handleCloseModal();
        }}
      />
    </div>
  );
};

export default ManageStudiesView;
