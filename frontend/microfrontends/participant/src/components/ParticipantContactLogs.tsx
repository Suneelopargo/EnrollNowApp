// frontend/microfrontends/participant/src/components/ParticipantContactLogs.tsx - Participant Contact Log History
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Pin,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  User,
  MessageSquare,
  Globe,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { requestConfirmation } from '../../../../shared/confirmation';
import {
  participantApi,
  ContactLogItem,
} from '../../../../shared/api/participantApi';
import { DataGrid, type ColDef, type ICellRendererParams } from '../../../../shared/design-system/components/DataGrid';
import { TooltipButton } from '../../../../shared/design-system/components/TooltipButton';
import { AddContactLogModal } from './AddContactLogModal';

export interface ParticipantContactLogsProps {
  participantId: string;
  participantName: string;
  studyId?: string;
  tenantId?: string;
  siteId?: string;
  onParticipantUpdated?: () => void;
}

export const ParticipantContactLogs: React.FC<ParticipantContactLogsProps> = ({
  participantId,
  participantName,
  studyId,
  tenantId,
  siteId,
  onParticipantUpdated,
}) => {
  const [logs, setLogs] = useState<ContactLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLog, setSelectedLog] = useState<ContactLogItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedLogForEdit, setSelectedLogForEdit] = useState<ContactLogItem | null>(null);

  // Pin action loading state
  const [togglingPinId, setTogglingPinId] = useState<string | null>(null);

  const fetchContactLogs = useCallback(async () => {
    if (!participantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await participantApi.getContactLogs(participantId, { studyId, tenantId, siteId });
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to load contact logs');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [participantId, studyId, tenantId, siteId]);

  useEffect(() => {
    fetchContactLogs();
  }, [fetchContactLogs]);

  const handleOpenAddModal = () => {
    setSelectedLogForEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (log: ContactLogItem) => {
    setSelectedLogForEdit(log);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLogForEdit(null);
  };

  const handleLogSaved = () => {
    fetchContactLogs();
    onParticipantUpdated?.();
  };

  const handleTogglePin = async (log: ContactLogItem) => {
    setTogglingPinId(log.id);
    const newSticky = !log.sticky;
    try {
      await participantApi.pinContactLog(participantId, log.id, newSticky, { tenantId, siteId });
      setSelectedLog((current) => current?.id === log.id ? { ...current, sticky: newSticky } : current);
      toast.success(newSticky ? 'Contact log pinned' : 'Contact log unpinned');
      await fetchContactLogs();
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to update pin status');
      toast.error(msg);
    } finally {
      setTogglingPinId(null);
    }
  };

  const handleDeleteLog = (log: ContactLogItem) => {
    const formattedDate = formatDateTime(log.dateTimeOfContact);
    void requestConfirmation({
      entityName: `contact log from ${formattedDate || 'selected date'}`,
      intent: 'danger',
      confirmText: 'Delete Contact Log',
      loadingText: 'Deleting contact log...',
      title: 'Delete Contact Log',
      message: `Delete contact log entry for ${participantName}? This action cannot be undone.`,
      confirmWord: 'DELETE',
      onConfirm: async () => {
        try {
          await participantApi.deleteContactLog(participantId, log.id, { tenantId, siteId });
          setSelectedLog((current) => current?.id === log.id ? null : current);
          toast.success('Contact log deleted successfully');
          await fetchContactLogs();
          onParticipantUpdated?.();
        } catch (err: any) {
          const msg = getApiErrorMessage(err, 'Failed to delete contact log');
          toast.error(msg);
        }
      },
    });
  };

  const formatDateTime = (isoStr: string) => {
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

  const getOutcomeBadgeStyle = (outcome: string) => {
    const lower = (outcome || '').toLowerCase();
    if (lower.includes('complete') || lower.includes('success') || lower.includes('reach') || lower.includes('schedul')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (lower.includes('busy') || lower.includes('voicemail') || lower.includes('message') || lower.includes('callback')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    if (lower.includes('refus') || lower.includes('disconnect') || lower.includes('wrong') || lower.includes('decline')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const columnDefs = useMemo<ColDef<ContactLogItem>[]>(() => [
    {
      field: 'dateTimeOfContact',
      headerName: 'Date/Time',
      minWidth: 175,
      valueFormatter: (params) => formatDateTime(params.value),
    },
    { field: 'contactType', headerName: 'Contact Type', minWidth: 140 },
    {
      field: 'outcome',
      headerName: 'Outcome',
      minWidth: 150,
      cellRenderer: (params: ICellRendererParams<ContactLogItem>) => params.data ? (
        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getOutcomeBadgeStyle(params.data.outcome)}`}>
          {params.data.outcome}
        </span>
      ) : null,
    },
    {
      colId: 'contactedBy',
      headerName: 'Contacted By',
      minWidth: 160,
      valueGetter: (params) => params.data?.contactedByName || params.data?.contactedBy || 'Unknown User',
      tooltipValueGetter: (params) => params.value,
    },
    {
      colId: 'actions',
      headerName: 'Actions',
      width: 132,
      minWidth: 132,
      maxWidth: 132,
      sortable: false,
      filter: false,
      floatingFilter: false,
      cellRenderer: (params: ICellRendererParams<ContactLogItem>) => {
        const log = params.data;
        if (!log) return null;
        return (
          <div className="participant-grid__row-actions">
            <TooltipButton
              label={log.sticky ? 'Unpin contact' : 'Pin contact'}
              disabled={togglingPinId === log.id || log.pinnable === false}
              onClick={(event) => {
                event.stopPropagation();
                void handleTogglePin(log);
              }}
              className={`participant-grid__row-action${log.sticky ? ' participant-grid__row-action--warning' : ''}`}
            >
              {togglingPinId === log.id
                ? <Loader2 size={14} className="animate-spin" />
                : <Pin size={14} fill={log.sticky ? 'currentColor' : 'none'} />}
            </TooltipButton>
            {log.editable !== false && (
              <>
                <TooltipButton
                  label="Edit contact log"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenEditModal(log);
                  }}
                  className="participant-grid__row-action"
                >
                  <Pencil size={14} />
                </TooltipButton>
                <TooltipButton
                  label="Delete contact log"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteLog(log);
                  }}
                  className="participant-grid__row-action participant-grid__row-action--danger"
                >
                  <Trash2 size={14} />
                </TooltipButton>
              </>
            )}
          </div>
        );
      },
    },
  ], [togglingPinId, handleTogglePin, handleOpenEditModal, handleDeleteLog]);

  const defaultColDef = useMemo<ColDef<ContactLogItem>>(() => ({
    sortable: true,
    resizable: true,
    filter: true,
    floatingFilter: true,
  }), []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <label className="relative block min-w-0 flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search contact history..."
            aria-label="Search contact history"
            className="w-full min-h-[46px] rounded-md border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label="Clear contact search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          )}
        </label>
        <TooltipButton
          label="Add Contact"
          id="add-contact-log-btn"
          onClick={handleOpenAddModal}
          className="btn btn-primary flex min-h-[46px] shrink-0 items-center gap-1.5 px-4 text-sm"
        >
          <Plus size={14} /> Add Contact
        </TooltipButton>
      </div>

      {/* Loading state */}
      {isLoading && logs.length === 0 && (
        <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
          <Loader2 size={24} className="animate-spin text-blue-600" />
          <span className="text-xs">Loading contact history...</span>
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
            onClick={fetchContactLogs}
            className="btn btn-sm btn-ghost text-red-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && logs.length === 0 && (
        <div className="p-8 text-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center">
          <MessageSquare size={32} className="text-gray-400 mb-2" />
          <h5 className="text-sm font-medium text-gray-700 mb-1">No contact history recorded</h5>
          <p className="text-xs text-gray-500 max-w-sm mb-4">
            No outreach attempts or communications have been logged for {participantName} yet.
          </p>
        </div>
      )}

      {!isLoading && logs.length > 0 && (
        <div className="space-y-3">
          <DataGrid<ContactLogItem>
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
            overlayNoRowsTemplate="<span class='text-slate-500'>No contact logs match your search.</span>"
          />
          {selectedLog && (
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" aria-label="Contact log details">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div><h5 className="font-semibold text-slate-800">{selectedLog.contactType} ? {selectedLog.outcome}</h5><p className="text-xs text-slate-500">{formatDateTime(selectedLog.dateTimeOfContact)}</p></div>
                <button type="button" onClick={() => setSelectedLog(null)} aria-label="Close contact details" className="text-xs text-slate-500 hover:text-slate-800">Close</button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div><span className="block text-xs font-medium text-slate-500">Spoke To</span><span>{selectedLog.spokeTo || '—'}</span></div>
                <div><span className="block text-xs font-medium text-slate-500">Method</span><span>{selectedLog.contactMethod || '—'}</span></div>
                <div><span className="block text-xs font-medium text-slate-500">Contacted By</span><span>{selectedLog.contactedByName || selectedLog.contactedBy || '—'}</span></div>
                <div><span className="block text-xs font-medium text-slate-500">Study</span><span>{selectedLog.studyName || 'General Registry'}</span></div>
              </div>
              {selectedLog.regarding && <div className="mt-3"><span className="block text-xs font-medium text-slate-500">Regarding</span><p className="mt-1 whitespace-pre-wrap rounded border border-slate-200 bg-white p-2">{selectedLog.regarding}</p></div>}
              {selectedLog.comments && <div className="mt-3"><span className="block text-xs font-medium text-slate-500">Comments</span><p className="mt-1 whitespace-pre-wrap rounded border border-slate-200 bg-white p-2">{selectedLog.comments}</p></div>}
              <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-3 text-xs text-slate-600">
                <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={Boolean(selectedLog.sticky)} disabled={togglingPinId === selectedLog.id || selectedLog.pinnable === false} onChange={() => void handleTogglePin(selectedLog)} />Pin Contact</label>
                {selectedLog.global && <span className="inline-flex items-center gap-1"><Globe size={12} />Global</span>}
                {selectedLog.lastContact && <span>Date of Last Contact</span>}
                <span>{selectedLog.createdByName ? 'Created by ' + selectedLog.createdByName : ''}{selectedLog.updatedByName && selectedLog.updatedByName !== selectedLog.createdByName ? ' ? Modified by ' + selectedLog.updatedByName : ''}</span>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Add / Edit Contact Modal */}
      <AddContactLogModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        participantId={participantId}
        studyId={studyId}
        logToEdit={selectedLogForEdit}
        onSaved={handleLogSaved}
        tenantId={tenantId}
        siteId={siteId}
      />
    </div>
  );
};

export default ParticipantContactLogs;
