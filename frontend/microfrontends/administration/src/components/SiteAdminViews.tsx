// frontend/microfrontends/administration/src/components/SiteAdminViews.tsx - Sub-views for Site Administration Dashboard
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ChevronDown, Download, FileSearch, FileSpreadsheet, FileText, Search, Upload, X } from 'lucide-react';
import { ExportSubOption } from '../types/admin';
import { ComingSoon } from '../../../../shared/design-system/components/ComingSoon';
import { ManageStudiesView, ManageStudiesViewProps } from './ManageStudiesView';
import {
  administrationApi,
  type AuditEventDetail,
  type AuditEventRecord,
} from '../../../../shared/api/administrationApi';
import { DataGrid, type ColDef, type GridApi, type ICellRendererParams } from '../../../../shared/design-system/components/DataGrid';
import { Modal } from '../../../../shared/design-system/components/Modal';

// ---------------------------------------------------------------------------
// Studies View
// ---------------------------------------------------------------------------
export const StudiesView: React.FC<ManageStudiesViewProps> = (props) => {
  return <ManageStudiesView {...props} />;
};

// ---------------------------------------------------------------------------
// Import View
// ---------------------------------------------------------------------------
export const ImportView: React.FC = () => {
  return (
    <ComingSoon
      title="Data Intake & Batch Import"
      subtitle="Bulk provisioning of site accounts, clinical protocol parameters, and participant screening data"
      description="Batch data intake capabilities via CSV/Excel are in active development. No simulated import actions are performed without an active backend endpoint."
      targetRelease="Scheduled Sprint Release"
      icon={Upload}
    />
  );
};

// ---------------------------------------------------------------------------
// Export View
// ---------------------------------------------------------------------------
export interface ExportViewProps {
  selectedSubOption?: ExportSubOption;
}

export const ExportView: React.FC<ExportViewProps> = () => {
  return (
    <ComingSoon
      title="Export Configurations & Compliance Artifacts"
      subtitle="Automated regulatory packages, customized PHI de-identification filters, and shared data archives"
      description="Scheduled data delivery and export pipeline configurations are in active development. No simulated archive downloads or fake records are presented."
      targetRelease="Scheduled Sprint Release"
      icon={Download}
    />
  );
};

// ---------------------------------------------------------------------------
// Audit Log View
// ---------------------------------------------------------------------------
interface AuditEventRow extends AuditEventRecord {
  actorName: string;
  affectedUser: string;
  dataChange: string;
}

const formatAuditDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const jsonText = (value: unknown) => value === null || value === undefined ? '—' : JSON.stringify(value, null, 2);

const JsonTreeNode: React.FC<{ name: string; value: unknown; depth?: number }> = ({ name, value, depth = 0 }) => {
  const isObject = value !== null && typeof value === 'object';
  if (!isObject) {
    return <div className="audit-json-tree__value"><span className="audit-json-tree__key">{name}</span><span>{value === null ? 'null' : String(value)}</span></div>;
  }

  const objectValue = value as Record<string, unknown>;
  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item] as const)
    : Object.entries(objectValue).filter(([key]) => {
        if (key !== 'studyId' && key !== 'study_id') return true;
        return !objectValue.studyName && !objectValue.study_name;
      });

  return (
    <details className="audit-json-tree__node" open={depth === 0}>
      <summary><span className="audit-json-tree__key">{name}</span><span className="audit-json-tree__type">{Array.isArray(value) ? `Array (${entries.length})` : `Object (${entries.length})`}</span></summary>
      <div className="audit-json-tree__children">
        {entries.length === 0 ? <span className="audit-json-tree__empty">{Array.isArray(value) ? '[]' : '{}'}</span> : entries.map(([key, child]) => (
          <JsonTreeNode key={key} name={key} value={child} depth={depth + 1} />
        ))}
      </div>
    </details>
  );
};

const AuditDataChangeCell: React.FC<ICellRendererParams<AuditEventRow>> = (params) => {
  if (!params.data) return null;
  return (
    <button
      type="button"
      className="participant-grid__row-action"
      onClick={(event) => {
        event.stopPropagation();
        params.context?.onViewDataChange?.(params.data);
      }}
      aria-label={`View data change for ${params.data.action}`}
      title="View before and after data"
    ><FileSearch size={16} aria-hidden="true" /></button>
  );
};

export const AuditLogView: React.FC = () => {
  const [rows, setRows] = useState<AuditEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [gridApi, setGridApi] = useState<GridApi<AuditEventRow> | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AuditEventRow | null>(null);
  const [selectedEventDetail, setSelectedEventDetail] = useState<AuditEventDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const exportMenuRef = React.useRef<HTMLDivElement>(null);
  const detailRequestId = React.useRef(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const query: Record<string, string | number> = { page, size: pageSize };
        if (fromDate) query.fromDate = fromDate;
        if (toDate) query.toDate = toDate;
        if (action.trim()) query.action = action.trim();
        if (search.trim()) query.search = search.trim();
        const auditResult = await administrationApi.getAuditLogs(query);
        const mapped = auditResult.content.map((event) => {
          const actorId = event.actorUserId;
          const entityId = event.entityId == null ? undefined : String(event.entityId);
          return {
            ...event,
            id: String(event.id),
            actorUserId: actorId == null ? undefined : String(actorId),
            actorName: event.actorName || (actorId ? `User ${actorId}` : 'System'),
            affectedUser: entityId || '—',
            action: event.action || '—',
            dataChange: event.beforeData != null || event.afterData != null
              ? `Before:\n${jsonText(event.beforeData)}\nAfter:\n${jsonText(event.afterData)}`
              : 'View detailed changes',
          };
        });
        if (!cancelled) {
          setRows(mapped);
          setTotalElements(auditResult.totalElements);
          setTotalPages(auditResult.totalPages);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.response?.data?.message || e?.message || 'Unable to load audit events.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [fromDate, toDate, action, search, page, pageSize, refreshKey]);

  const viewAuditDetails = useCallback(async (event: AuditEventRow) => {
    const requestId = ++detailRequestId.current;
    setSelectedEvent(event);
    setSelectedEventDetail(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      const detail = await administrationApi.getAuditEventDetail(event.id);
      if (requestId === detailRequestId.current) setSelectedEventDetail(detail);
    } catch (e: any) {
      if (requestId === detailRequestId.current) {
        setDetailError(e?.response?.data?.message || e?.message || 'Unable to load audit event details.');
      }
    } finally {
      if (requestId === detailRequestId.current) setDetailLoading(false);
    }
  }, []);

  const closeAuditDetails = useCallback(() => {
    detailRequestId.current += 1;
    setSelectedEvent(null);
    setSelectedEventDetail(null);
    setDetailError('');
    setDetailLoading(false);
  }, []);

  const columns = useMemo<ColDef<AuditEventRow>[]>(() => [
    { headerName: 'Date & Time', field: 'occurredAt', minWidth: 190, valueGetter: p => p.data?.occurredAt || p.data?.createdAt || '', valueFormatter: p => formatAuditDate(p.value), sort: 'desc' },
    { headerName: 'Changed By', field: 'actorName', minWidth: 180 },
    { headerName: 'Action', field: 'action', minWidth: 170 },
    { headerName: 'Affected User', field: 'affectedUser', minWidth: 190 },
    { headerName: 'Description', field: 'description', minWidth: 220, flex: 1 },
    { headerName: 'Data Change', field: 'dataChange', width: 115, minWidth: 100, maxWidth: 130, sortable: false, filter: false, floatingFilter: false, cellRenderer: AuditDataChangeCell },
  ], []);

  const onSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);
  const getExportRows = useCallback(() => {
    const exportRows: AuditEventRow[] = [];
    if (gridApi) {
      gridApi.forEachNodeAfterFilterAndSort(node => { if (node.data) exportRows.push(node.data); });
      return exportRows;
    }
    return rows;
  }, [gridApi, rows]);
  const exportFileName = `audit-log-${new Date().toISOString().slice(0, 10)}`;
  const exportCsv = () => {
    gridApi?.exportDataAsCsv({
      fileName: `${exportFileName}.csv`,
      columnKeys: ['occurredAt', 'actorName', 'action', 'affectedUser', 'description', 'dataChange'],
      processCellCallback: params => params.value ?? '',
    });
    setExportMenuOpen(false);
  };
  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Audit Log', { views: [{ state: 'frozen', ySplit: 1 }] });
    sheet.columns = [
      { header: 'Date & Time', key: 'date', width: 24 },
      { header: 'Changed By', key: 'actor', width: 28 },
      { header: 'Action', key: 'action', width: 24 },
      { header: 'Affected User', key: 'affectedUser', width: 28 },
      { header: 'Description', key: 'description', width: 55 },
      { header: 'Data Change', key: 'dataChange', width: 70 },
    ];
    getExportRows().forEach(row => sheet.addRow({
      date: formatAuditDate(row.occurredAt || row.createdAt), actor: row.actorName,
      action: row.action, affectedUser: row.affectedUser, description: row.description || '', dataChange: row.dataChange,
    }));
    sheet.autoFilter = { from: 'A1', to: `F${Math.max(1, sheet.rowCount)}` };
    sheet.getRow(1).eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF123A5A' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${exportFileName}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
    setExportMenuOpen(false);
  };
  const exportPdf = () => {
    const exportRows = getExportRows();
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('System & Security Audit Ledger', 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [['Date & Time', 'Changed By', 'Action', 'Affected User', 'Description', 'Data Change']],
      body: exportRows.map(row => [formatAuditDate(row.occurredAt || row.createdAt), row.actorName, row.action, row.affectedUser, row.description || '', row.dataChange]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [18, 58, 90] },
    });
    doc.save(`${exportFileName}.pdf`);
    setExportMenuOpen(false);
  };
  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) setExportMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setExportMenuOpen(false); };
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);
  return (
    <section className="card site-admin-users-card" aria-label="System and security audit ledger">
      <div className="card-header data-grid-toolbar site-admin-users-toolbar audit-log-toolbar">
        <div className="data-grid-toolbar__heading">
          
        </div>
        <div className="data-grid-toolbar__actions">
          <label className="site-admin-filter-select-wrap">From <input className="form-input" type="date" aria-label="Audit events from date" value={fromDate} max={toDate || undefined} onChange={e => { setPage(0); setFromDate(e.target.value); }} /></label>
          <label className="site-admin-filter-select-wrap">To <input className="form-input" type="date" aria-label="Audit events to date" value={toDate} min={fromDate || undefined} onChange={e => { setPage(0); setToDate(e.target.value); }} /></label>
          <label className="site-admin-filter-select-wrap">
            Action
            <input
              className="form-input"
              type="text"
              aria-label="Filter audit events by action"
              placeholder="e.g. USER_ACCESS_UPDATED"
              value={action}
              onChange={event => {
                setPage(0);
                setAction(event.target.value);
              }}
            />
          </label>
          <div className="data-grid-toolbar__search">
            <input className="form-input" placeholder="Search audit events..." aria-label="Search audit events" value={search} onChange={e => onSearchChange(e.target.value)} />
            {search && <button type="button" className="btn btn-ghost btn-sm" onClick={() => onSearchChange('')} aria-label="Clear search"><X size={14} /></button>}
            <Search size={14} aria-hidden="true" />
          </div>
          <button
            type="button"
            className="btn btn-secondary audit-log-refresh-btn"
            onClick={() => setRefreshKey(key => key + 1)}
          >
            Refresh
          </button>
          <div className="data-grid-export-menu-wrap" ref={exportMenuRef}>
            <button
              type="button"
              className="data-grid-export-trigger"
              aria-haspopup="menu"
              aria-expanded={exportMenuOpen}
              onClick={() => setExportMenuOpen(open => !open)}
              aria-label="Export audit log"
            >
              <Download size={15} /> Export <ChevronDown size={14} />
            </button>
            {exportMenuOpen && <div className="data-grid-export-menu" role="menu" aria-label="Choose export format">
              <button type="button" role="menuitem" onClick={exportCsv}>
                <Download size={15} /><span>CSV</span><small>Comma-separated values</small>
              </button>
              <button type="button" role="menuitem" onClick={() => void exportExcel()}>
                <FileSpreadsheet size={15} /><span>Excel</span><small>Excel workbook (.xlsx)</small>
              </button>
              <button type="button" role="menuitem" onClick={exportPdf}>
                <FileText size={15} /><span>PDF</span><small>Portable document</small>
              </button>
            </div>}
          </div>
        </div>
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {!loading && !error && rows.length === 0 && <p className="text-muted p-3">No audit events found for this date range.</p>}
      <div className="site-admin-users-card-body">
        <DataGrid loading={loading} rowData={rows} columnDefs={columns}
          defaultColDef={{ resizable: true, sortable: true, filter: true, floatingFilter: true }}
          context={{ onViewDataChange: (event: AuditEventRow) => { void viewAuditDetails(event); } }}
          onGridReady={params => setGridApi(params.api)}
          getRowId={p => String(p.data.id)} rowHeight={48} headerHeight={44}
          floatingFiltersHeight={38} animateRows />
      </div>
      <div className="data-grid-toolbar__actions" aria-label="Audit log pagination">
        <span>
          {totalElements === 0
            ? '0 events'
            : `${page * pageSize + 1}-${Math.min((page + 1) * pageSize, totalElements)} of ${totalElements} events`}
        </span>
        <label className="site-admin-filter-select-wrap">
          Rows per page
          <select
            className="form-select"
            aria-label="Audit log rows per page"
            value={pageSize}
            onChange={event => {
              setPageSize(Number(event.target.value));
              setPage(0);
            }}
          >
            {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          aria-label="Previous audit log page"
          disabled={loading || page <= 0}
          onClick={() => setPage(current => Math.max(0, current - 1))}
        >
          Previous
        </button>
        <span aria-live="polite">
          Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          aria-label="Next audit log page"
          disabled={loading || page + 1 >= totalPages}
          onClick={() => setPage(current => Math.min(totalPages - 1, current + 1))}
        >
          Next
        </button>
      </div>
      <Modal
        isOpen={selectedEvent !== null}
        onClose={closeAuditDetails}
        title="Audit data change"
        size="wide"
      >
        {selectedEvent && <>
          <div className="mb-3">
            <p><strong>{selectedEvent.action}</strong> · {selectedEvent.actorName} · {formatAuditDate(selectedEvent.occurredAt || selectedEvent.createdAt)}</p>
            <p className="text-muted">Affected user: {selectedEvent.affectedUser}</p>
          </div>
          {detailLoading && <p role="status">Loading audit event details...</p>}
          {detailError && <div className="alert alert-danger" role="alert">{detailError}</div>}
          {!detailLoading && !detailError && selectedEventDetail && (
            selectedEventDetail.changes.length > 0 ? (
              <div className="audit-data-change">
                {selectedEventDetail.changes.map((change, index) => (
                  <div
                    className="audit-data-change__panel"
                    key={`${change.entityType}-${change.entityId}-${change.fieldName}-${index}`}
                  >
                    <h4>{change.entityType} · {change.entityId}</h4>
                    <p><strong>{change.fieldName}</strong></p>
                    <JsonTreeNode name="Previous value" value={change.previousValue} />
                    <JsonTreeNode name="New value" value={change.newValue} />
                  </div>
                ))}
              </div>
            ) : selectedEventDetail.beforeData != null || selectedEventDetail.afterData != null ? (
              <div className="audit-data-change">
                <div className="audit-data-change__panel">
                  <h4>Before</h4>
                  {selectedEventDetail.beforeData != null
                    ? <JsonTreeNode name="Before" value={selectedEventDetail.beforeData} />
                    : <span className="audit-json-tree__empty">No previous data</span>}
                </div>
                <div className="audit-data-change__panel">
                  <h4>After</h4>
                  {selectedEventDetail.afterData != null
                    ? <JsonTreeNode name="After" value={selectedEventDetail.afterData} />
                    : <span className="audit-json-tree__empty">No new data</span>}
                </div>
              </div>
            ) : (
              <p className="text-muted">No field-level changes are recorded for this event.</p>
            )
          )}
        </>}
      </Modal>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Security View
// ---------------------------------------------------------------------------
export { SecurityView } from './SecurityView';
export type { SecurityViewProps } from './SecurityView';

// ---------------------------------------------------------------------------
// General Settings View
// ---------------------------------------------------------------------------
export { GeneralSettingsView } from './GeneralSettingsView';
export type { GeneralSettingsViewProps } from './GeneralSettingsView';
