// frontend/microfrontends/study/src/components/StudyDirectory.tsx
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
  Search,
  Plus,
  ArrowRight,
  X,
  Download,
  ChevronDown,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

export interface StudyDirectoryProps {
  studies: any[];
  loading?: boolean;
  onSelectStudy: (studyId: string, tab?: string) => void;
  onAddStudy: () => void;
  onRefresh?: () => void;
}

// ---------------------------------------------------------------------------
// Custom Cell Renderers for AG Grid
// ---------------------------------------------------------------------------

const StudyTitleCellRenderer: React.FC<ICellRendererParams> = (params) => {
  const study = params.data;
  if (!study) return null;
  const studyId = String(study.id ?? study.studyId ?? study.protocolNumber);
  const title = study.title || study.name || 'Untitled Study';

  return (
    <div className="study-grid__title-cell">
      <button
        type="button"
        className="site-admin-user-name-btn"
        onClick={(e) => {
          e.stopPropagation();
          params.context?.onSelectStudy?.(studyId, 'dashboard');
        }}
        title={`Open ${title}`}
        aria-label={`Open study ${title}`}
      >
        {title}
      </button>
    </div>
  );
};

const StudyProtocolCellRenderer: React.FC<ICellRendererParams> = (params) => {
  const study = params.data;
  if (!study) return null;
  const protocolCode = study.protocolId || study.protocolNumber || study.studyCode || '';
  if (!protocolCode) {
    return <span className="text-muted">—</span>;
  }
  return <span className="study-grid__code-badge">{protocolCode}</span>;
};

const StudyStatusCellRenderer: React.FC<ICellRendererParams> = (params) => {
  const study = params.data;
  if (!study) return null;
  const isArchived = Boolean(study.archived || String(study.status).toUpperCase() === 'ARCHIVED');
  const statusStr = String(study.status || 'Active');
  const displayStatus = isArchived
    ? 'Archived'
    : statusStr.charAt(0).toUpperCase() + statusStr.slice(1).toLowerCase();

  const badgeClass = isArchived
    ? 'archived'
    : displayStatus.toLowerCase() === 'recruiting'
    ? 'recruiting'
    : displayStatus.toLowerCase() === 'active'
    ? 'active'
    : 'other';

  return (
    <span className={`study-card__status-badge study-card__status-badge--${badgeClass}`}>
      {displayStatus}
    </span>
  );
};

const StudyActionsCellRenderer: React.FC<ICellRendererParams> = (params) => {
  const study = params.data;
  if (!study) return null;
  const studyId = String(study.id ?? study.studyId ?? study.protocolNumber);

  return (
    <div className="study-grid__actions" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="study-grid__action-btn study-grid__action-btn--primary"
        onClick={(e) => {
          e.stopPropagation();
          params.context?.onSelectStudy?.(studyId, 'dashboard');
        }}
        title="Open study workspace dashboard"
        aria-label="Open study dashboard"
      >
        <span>Dashboard</span>
        <ArrowRight size={12} aria-hidden="true" />
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main StudyDirectory Component
// ---------------------------------------------------------------------------

export const StudyDirectory: React.FC<StudyDirectoryProps> = ({
  studies,
  loading = false,
  onSelectStudy,
  onAddStudy,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu on outside click or escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter studies based on status dropdown filter
  const filteredStudies = useMemo(() => {
    return studies.filter((study) => {
      const studyStatus = String(study.status || '').toUpperCase();
      const isArchived = Boolean(study.archived || studyStatus === 'ARCHIVED');
      if (statusFilter === 'active') {
        return !isArchived && (studyStatus === 'ACTIVE' || studyStatus === '' || studyStatus === 'RECRUITING');
      }
      if (statusFilter === 'archived') {
        return isArchived;
      }
      return true;
    });
  }, [studies, statusFilter]);

  // AG Grid Column Definitions: Study Name, Protocol Code, Status, Actions (Role & Enrollment removed)
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: 'Study Name',
        field: 'title',
        minWidth: 260,
        flex: 2.5,
        sortable: true,
        filter: 'agTextColumnFilter',
        cellRenderer: StudyTitleCellRenderer,
        valueGetter: (params) => params.data?.title || params.data?.name || 'Untitled Study',
      },
      {
        headerName: 'Protocol Code',
        field: 'protocolId',
        minWidth: 150,
        flex: 1.2,
        sortable: true,
        filter: 'agTextColumnFilter',
        cellRenderer: StudyProtocolCellRenderer,
        valueGetter: (params) =>
          params.data?.protocolId ||
          params.data?.protocolNumber ||
          params.data?.studyCode ||
          '',
      },
      {
        headerName: 'Status',
        field: 'status',
        minWidth: 130,
        flex: 1,
        sortable: true,
        filter: 'agTextColumnFilter',
        cellRenderer: StudyStatusCellRenderer,
        valueGetter: (params) => {
          if (params.data?.archived) return 'Archived';
          return params.data?.status || 'Active';
        },
      },
      {
        headerName: 'Actions',
        field: 'id',
        pinned: 'right',
        minWidth: 140,
        width: 150,
        sortable: false,
        filter: false,
        floatingFilter: false,
        resizable: false,
        suppressMenu: true,
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
    }),
    []
  );

  const onGridReady = useCallback(
    (params: { api: GridApi }) => {
      setGridApi(params.api);
      if (searchTerm) {
        params.api.setGridOption('quickFilterText', searchTerm);
      }
    },
    [searchTerm]
  );

  // Sync search changes to AG Grid quick filter
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      if (gridApi) {
        gridApi.setGridOption('quickFilterText', value);
      }
    },
    [gridApi]
  );

  // Exports
  const exportFileName = `studies-${new Date().toISOString().slice(0, 10)}`;

  const exportCsv = () => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: `${exportFileName}.csv`,
        columnKeys: ['title', 'protocolId', 'status'],
      });
    }
    setIsExportMenuOpen(false);
  };

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Studies');

    worksheet.columns = [
      { header: 'Study Name', key: 'title', width: 32 },
      { header: 'Protocol Code', key: 'protocolId', width: 20 },
      { header: 'Status', key: 'status', width: 14 },
    ];

    filteredStudies.forEach((study) => {
      worksheet.addRow({
        title: study.title || study.name || '',
        protocolId: study.protocolId || study.protocolNumber || study.studyCode || '',
        status: study.archived ? 'Archived' : study.status || 'Active',
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
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Studies Directory', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor('#61798D');
    doc.text(`${filteredStudies.length} ${filteredStudies.length === 1 ? 'study' : 'studies'}`, 14, 22);

    autoTable(doc, {
      startY: 26,
      head: [['Study Name', 'Protocol Code', 'Status']],
      body: filteredStudies.map((s) => [
        s.title || s.name || '',
        s.protocolId || s.protocolNumber || s.studyCode || '',
        s.archived ? 'Archived' : s.status || 'Active',
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 4,
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

  // If there are no studies at all in the system, show the legacy empty state
  if (!loading && studies.length === 0) {
    return (
      <section className="study-selection-empty" aria-live="polite">
        <div className="study-selection-empty__icon">
          <Plus size={22} />
        </div>
        <h1>Select a study to continue</h1>
        <p>
          Use Select Study in the top navigation to open its recruitment dashboard, or choose Add Study to create a study.
        </p>
        <button
          type="button"
          className="study-directory__add-btn"
          style={{ marginTop: '20px' }}
          onClick={onAddStudy}
        >
          <Plus size={16} />
          <span>Add Study</span>
        </button>
      </section>
    );
  }

  return (
    <div className="study-directory" data-testid="study-directory">
      <div className="card site-admin-users-card">
        {/* Top Toolbar: All controls aligned to the right (status filter, search, add study, export) */}
        <div className="card-header data-grid-toolbar site-admin-users-toolbar" style={{ justifyContent: 'flex-end' }}>
          <div className="data-grid-toolbar__actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {/* Status Filter Dropdown */}
            <div className="site-admin-filter-select-wrap">
              <select
                aria-label="Filter by Study Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'active' | 'archived' | 'all')}
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
                  onClick={() => handleSearchChange('')}
                  title="Clear search"
                  aria-label="Clear search query"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
              <Search size={14} aria-hidden="true" />
            </div>

            {/* Add Study Button */}
            <button
              type="button"
              className="btn btn-primary site-admin-add-user-btn"
              onClick={onAddStudy}
              title="Add a new study"
              data-testid="add-study-button"
            >
              <Plus size={16} aria-hidden="true" />
              <span>Add Study</span>
            </button>

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
                <Download size={14} />
                <span>Export</span>
                <ChevronDown size={13} />
              </button>
              {isExportMenuOpen && (
                <div className="data-grid-export-menu" role="menu" aria-label="Choose export format">
                  <button type="button" role="menuitem" onClick={exportCsv}>
                    <Download size={14} />
                    <span>CSV</span>
                    <small>Comma-separated values</small>
                  </button>
                  <button type="button" role="menuitem" onClick={() => void exportExcel()}>
                    <FileSpreadsheet size={14} />
                    <span>Excel</span>
                    <small>Excel workbook (.xlsx)</small>
                  </button>
                  <button type="button" role="menuitem" onClick={exportPdf}>
                    <FileText size={14} />
                    <span>PDF</span>
                    <small>Portable document</small>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global AG Grid */}
        <div className="site-admin-users-card-body" data-testid="study-directory-grid">
          <DataGrid
            loading={loading}
            rowData={filteredStudies}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            context={{
              onSelectStudy,
            }}
            onGridReady={onGridReady}
            quickFilterText={searchTerm}
            rowHeight={52}
            pagination
            paginationPageSize={10}
            paginationPageSizeSelector={[10, 25, 50, 100]}
            onRowDoubleClicked={(event) => {
              if (event.data) {
                const studyId = String(
                  event.data.id ?? event.data.studyId ?? event.data.protocolNumber
                );
                onSelectStudy(studyId, 'dashboard');
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default StudyDirectory;
