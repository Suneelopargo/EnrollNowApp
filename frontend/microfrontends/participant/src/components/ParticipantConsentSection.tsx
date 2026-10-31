// frontend/microfrontends/participant/src/components/ParticipantConsentSection.tsx - Participant Consent History & Management
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  Plus,
  RefreshCw,
  FileText,
  Clock,
  AlertCircle,
  Pin,
  Pencil,
  Trash2,
  Globe,
  Loader2,
  Download,
  Search,
  X,
} from 'lucide-react';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { requestConfirmation } from '../../../../shared/confirmation';
import {
  participantApi,
  ConsentLogItem,
} from '../../../../shared/api/participantApi';
import { DataGrid, type ColDef, type ICellRendererParams } from '../../../../shared/design-system/components/DataGrid';
import { RecordConsentModal } from './RecordConsentModal';

export interface ParticipantConsentSectionProps {
  participantId: string;
  participantName: string;
  studyId?: string;
  tenantId?: string;
  siteId?: string;
  onParticipantUpdated?: () => void;
}

export const ParticipantConsentSection: React.FC<ParticipantConsentSectionProps> = ({
  participantId,
  participantName,
  studyId,
  tenantId,
  siteId,
  onParticipantUpdated,
}) => {
  const [logs, setLogs] = useState<ConsentLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLog, setSelectedLog] = useState<ConsentLogItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedLogForEdit, setSelectedLogForEdit] = useState<ConsentLogItem | null>(null);

  // Pin action loading state
  const [togglingPinId, setTogglingPinId] = useState<string | null>(null);

  const fetchConsentLogs = useCallback(async () => {
    if (!participantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await participantApi.getConsentLogs(participantId, { studyId, tenantId, siteId });
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to load consent logs');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [participantId, studyId, tenantId, siteId]);

  useEffect(() => {
    fetchConsentLogs();
  }, [fetchConsentLogs]);

  const handleOpenAddModal = () => {
    setSelectedLogForEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (log: ConsentLogItem) => {
    setSelectedLogForEdit(log);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLogForEdit(null);
  };

  const handleConsentSaved = () => {
    fetchConsentLogs();
    onParticipantUpdated?.();
  };

  const handleTogglePin = async (log: ConsentLogItem) => {
    setTogglingPinId(log.id);
    const newSticky = !log.sticky;
    try {
      await participantApi.pinConsentLog(participantId, log.id, newSticky, { tenantId, siteId });
      setSelectedLog((current) => current?.id === log.id ? { ...current, sticky: newSticky } : current);
      toast.success(newSticky ? 'Consent log pinned' : 'Consent log unpinned');
      await fetchConsentLogs();
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to update pin status');
      toast.error(msg);
    } finally {
      setTogglingPinId(null);
    }
  };

  const handleDeleteLog = (log: ConsentLogItem) => {
    const formattedDate = formatDateTime(log.consentDate);
    void requestConfirmation({
      entityName: `consent log from ${formattedDate || 'selected date'}`,
      intent: 'danger',
      confirmText: 'Delete Consent Log',
      loadingText: 'Deleting consent log...',
      title: 'Delete Consent Log',
      message: `Delete consent log entry for ${participantName}? This action cannot be undone.`,
      confirmWord: 'DELETE',
      onConfirm: async () => {
        try {
          await participantApi.deleteConsentLog(participantId, log.id, { tenantId, siteId });
          setSelectedLog((current) => current?.id === log.id ? null : current);
          toast.success('Consent log deleted successfully');
          await fetchConsentLogs();
          onParticipantUpdated?.();
        } catch (err: any) {
          const msg = getApiErrorMessage(err, 'Failed to delete consent log');
          toast.error(msg);
        }
      },
    });
  };

  const formatDateTime = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return (
        d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) +
        ', ' +
        d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    } catch {
      return isoStr;
    }
  };

  const formatDateOnly = (isoStr?: string) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  const columnDefs = useMemo<ColDef<ConsentLogItem>[]>(() => [
    {
      field: 'consentDate',
      headerName: 'Consent Date',
      minWidth: 170,
      valueFormatter: (params) => formatDateTime(params.value),
    },
    { field: 'consentType', headerName: 'Consent Type', minWidth: 135 },
    {
      field: 'consentTitle',
      headerName: 'Consent Title',
      minWidth: 190,
      flex: 1,
      tooltipValueGetter: (params) => params.value,
    },
    {
      field: 'consentedBy',
      headerName: 'Consented By',
      minWidth: 140,
      valueGetter: (params) => params.data?.consentedBy || params.data?.createdByName || '—',
    },
    { field: 'version', headerName: 'Version', minWidth: 100 },
    {
      field: 'expiration',
      headerName: 'Expiration',
      minWidth: 130,
      valueFormatter: (params) => formatDateOnly(params.value),
    },
    {
      colId: 'attachment',
      headerName: 'Attachment',
      minWidth: 150,
      sortable: false,
      filter: false,
      floatingFilter: false,
      cellRenderer: (params: ICellRendererParams<ConsentLogItem>) => {
        const log = params.data;
        if (!log?.fileAttached || !log.downloadUrl) return <span className="text-gray-400">—</span>;
        return (
          <a
            href={log.downloadUrl}
            download={log.fileName || 'attachment'}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex items-center gap-1 truncate text-blue-600 hover:text-blue-800"
            title={log.fileName || 'Download attachment'}
          >
            <FileText size={13} />
            <span className="max-w-[120px] truncate">{log.fileName || 'Attachment'}</span>
          </a>
        );
      },
    },
    {
      colId: 'pin',
      headerName: 'Pin',
      width: 74,
      minWidth: 74,
      maxWidth: 74,
      sortable: false,
      filter: false,
      floatingFilter: false,
      cellRenderer: (params: ICellRendererParams<ConsentLogItem>) => {
        const log = params.data;
        if (!log) return null;
        return (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void handleTogglePin(log);
            }}
            disabled={togglingPinId === log.id || log.pinnable === false}
            aria-label={log.sticky ? 'Unpin consent' : 'Pin consent'}
            title={log.sticky ? 'Unpin consent' : 'Pin consent'}
            className="flex h-full w-full items-center justify-center disabled:cursor-not-allowed"
            style={{ color: log.sticky ? '#b45309' : '#94a3b8' }}
          >
            {togglingPinId === log.id
              ? <Loader2 size={14} className="animate-spin" />
              : <Pin size={14} fill={log.sticky ? 'currentColor' : 'none'} />}
          </button>
        );
      },
    },
    {
      colId: 'actions',
      headerName: 'Actions',
      width: 90,
      minWidth: 90,
      maxWidth: 90,
      sortable: false,
      filter: false,
      floatingFilter: false,
      cellRenderer: (params: ICellRendererParams<ConsentLogItem>) => {
        const log = params.data;
        if (!log || log.editable === false) return null;
        return (
          <div className="flex h-full items-center justify-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleOpenEditModal(log);
              }}
              aria-label="Edit consent log"
              title="Edit consent log"
              className="text-gray-600 hover:text-blue-700"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleDeleteLog(log);
              }}
              aria-label="Delete consent log"
              title="Delete consent log"
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      },
    },
  ], [togglingPinId, handleTogglePin, handleOpenEditModal, handleDeleteLog]);

  const defaultColDef = useMemo<ColDef<ConsentLogItem>>(() => ({
    sortable: true,
    resizable: true,
    filter: true,
    floatingFilter: true,
  }), []);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="btn btn-sm btn-primary flex items-center gap-1.5"
            id="add-consent-log-modal-button"
            title="Record Consent"
            aria-label="Record Consent"
          >
            <Plus size={14} /> Add Consent
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && logs.length === 0 && (
        <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
          <Loader2 size={24} className="animate-spin text-indigo-600" />
          <span className="text-xs">Loading consent history...</span>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchConsentLogs}
            className="btn btn-sm btn-ghost text-red-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && logs.length === 0 && (
        <div className="p-8 text-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center">
          <FileText size={32} className="text-gray-400 mb-2" />
          <h5 className="text-sm font-medium text-gray-700 mb-1">No consent records found</h5>
          <p className="text-xs text-gray-500 max-w-sm mb-4">
            No administrative consent records have been logged for {participantName} yet.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="btn btn-sm btn-primary flex items-center gap-1.5"
          >
            <Plus size={14} /> Add Consent
          </button>
        </div>
      )}

      {!isLoading && logs.length > 0 && (
        <div className="space-y-3">
          <label className="relative block max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search consents..." aria-label="Search consents" className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            {searchTerm && <button type="button" onClick={() => setSearchTerm('')} aria-label="Clear consent search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"><X size={14} /></button>}
          </label>
          <DataGrid<ConsentLogItem>
            wrapperClassName="participant-email-grid"
            rowData={logs}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            quickFilterText={searchTerm}
            pagination
            paginationPageSize={10}
            paginationPageSizeSelector={[5, 10, 20, 50]}
            rowHeight={48}
            headerHeight={42}
            animateRows
            suppressCellFocus
            onRowClicked={(event) => {
              const target = event.event?.target as HTMLElement | null;
              if (!event.data || target?.closest('button, a')) return;
              setSelectedLog((current) => current?.id === event.data?.id ? null : event.data ?? null);
            }}
            rowClass="cursor-pointer"
            overlayNoRowsTemplate="<span class='text-slate-500'>No consents match your search.</span>"
          />
          {selectedLog && (
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" aria-label="Consent details">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div><h5 className="font-semibold text-slate-800">{selectedLog.consentTitle}</h5><p className="text-xs text-slate-500">{selectedLog.consentType} ? {formatDateTime(selectedLog.consentDate)}</p></div>
                <button type="button" onClick={() => setSelectedLog(null)} aria-label="Close consent details" className="text-xs text-slate-500 hover:text-slate-800">Close</button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div><span className="block text-xs font-medium text-slate-500">Consented By</span><span>{selectedLog.consentedBy || '—'}</span></div>
                <div><span className="block text-xs font-medium text-slate-500">Version</span><span>{selectedLog.version || '—'}</span></div>
                <div><span className="block text-xs font-medium text-slate-500">Expiration</span><span>{formatDateOnly(selectedLog.expiration)}</span></div>
                <div><span className="block text-xs font-medium text-slate-500">Attachment</span>{selectedLog.fileAttached && selectedLog.downloadUrl ? <a href={selectedLog.downloadUrl} download={selectedLog.fileName || 'attachment'} className="text-blue-600 hover:underline">{selectedLog.fileName || 'Download'}{selectedLog.fileSizeBytes ? ' (' + Math.round(selectedLog.fileSizeBytes / 1024) + ' KB)' : ''}</a> : <span>None</span>}</div>
              </div>
              {selectedLog.comments && <div className="mt-3"><span className="block text-xs font-medium text-slate-500">Comments</span><p className="mt-1 whitespace-pre-wrap rounded border border-slate-200 bg-white p-2">{selectedLog.comments}</p></div>}
              <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-3 text-xs text-slate-600">
                <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={Boolean(selectedLog.sticky)} disabled={togglingPinId === selectedLog.id || selectedLog.pinnable === false} onChange={() => void handleTogglePin(selectedLog)} />Pin Consent</label>
                {selectedLog.global && <span className="inline-flex items-center gap-1"><Globe size={12} />Global</span>}
                {selectedLog.lastContact && <span>Date of Last Contact</span>}
                <span>{selectedLog.createdByName ? 'Created by ' + selectedLog.createdByName : ''}{selectedLog.updatedByName && selectedLog.updatedByName !== selectedLog.createdByName ? ' ? Modified by ' + selectedLog.updatedByName : ''}</span>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Add / Edit Consent Modal */}
      <RecordConsentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        participantId={participantId}
        participantName={participantName}
        studyId={studyId}
        tenantId={tenantId}
        siteId={siteId}
        logToEdit={selectedLogForEdit}
        onConsentSaved={handleConsentSaved}
      />
    </div>
  );
};

export default ParticipantConsentSection;
