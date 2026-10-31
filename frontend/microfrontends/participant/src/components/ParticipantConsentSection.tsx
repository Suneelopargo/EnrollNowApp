// frontend/microfrontends/participant/src/components/ParticipantConsentSection.tsx - Participant Consent History & Management
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  FileText,
  AlertCircle,
  Pin,
  Pencil,
  Trash2,
  Globe,
  Loader2,
  Eye,
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
import { TooltipButton } from '../../../../shared/design-system/components/TooltipButton';
import { Modal } from '../../../../shared/design-system/components/Modal';
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

  const handlePreviewAttachment = async (log: ConsentLogItem) => {
    const previewTab = window.open('about:blank', '_blank');
    if (!previewTab) {
      toast.error('Allow pop-ups to preview this attachment in a new tab.');
      return;
    }

    previewTab.opener = null;
    try {
      const file = await participantApi.getConsentAttachment(participantId, log.id, { tenantId, siteId });
      const previewUrl = URL.createObjectURL(file);
      previewTab.location.href = previewUrl;
      const cleanup = window.setInterval(() => {
        if (previewTab.closed) {
          URL.revokeObjectURL(previewUrl);
          window.clearInterval(cleanup);
        }
      }, 1000);
    } catch (err: unknown) {
      previewTab.close();
      toast.error(getApiErrorMessage(err, 'Unable to load the consent attachment.'));
    }
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
      minWidth: 165,
      width: 170,
      valueFormatter: (params) => formatDateTime(params.value),
    },
    { field: 'consentType', headerName: 'Consent Type', minWidth: 145, width: 150 },
    {
      field: 'consentTitle',
      headerName: 'Consent Title',
      minWidth: 145,
      flex: 1,
      maxWidth: 240,
      tooltipValueGetter: (params) => params.value,
    },
    {
      field: 'consentedBy',
      headerName: 'Consented By',
      minWidth: 145,
      width: 150,
      valueGetter: (params) => params.data?.consentedBy || params.data?.createdByName || '—',
    },
    {
      colId: 'actions',
      headerName: 'Actions',
      width: 168,
      minWidth: 168,
      maxWidth: 168,
      sortable: false,
      filter: false,
      floatingFilter: false,
      cellRenderer: (params: ICellRendererParams<ConsentLogItem>) => {
        const log = params.data;
        if (!log) return null;
        return (
          <div className="participant-grid__row-actions">
            <TooltipButton
              label={log.sticky ? 'Unpin consent' : 'Pin consent'}
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
            {log.fileAttached && log.downloadUrl ? (
              <TooltipButton
                label={`Preview ${log.fileName || 'consent attachment'}`}
                onClick={(event) => {
                  event.stopPropagation();
                  void handlePreviewAttachment(log);
                }}
                className="participant-grid__row-action"
              >
                <Eye size={14} />
              </TooltipButton>
            ) : (
              <span className="text-gray-400">—</span>
            )}
            {log.editable !== false && (
              <>
                <TooltipButton
                  label="Edit consent log"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenEditModal(log);
                  }}
                  className="participant-grid__row-action"
                >
                  <Pencil size={14} />
                </TooltipButton>
                <TooltipButton
                  label="Delete consent log"
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

  const defaultColDef = useMemo<ColDef<ConsentLogItem>>(() => ({
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
            placeholder="Search consents..."
            aria-label="Search consents"
            className="w-full min-h-[46px] rounded-md border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label="Clear consent search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          )}
        </label>
        <TooltipButton
          label="Add Consent"
          id="add-consent-log-modal-button"
          onClick={handleOpenAddModal}
          className="btn btn-primary flex min-h-[46px] shrink-0 items-center gap-1.5 px-4 text-sm"
        >
          <Plus size={14} /> Add Consent
        </TooltipButton>
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
        </div>
      )}

      {!isLoading && logs.length > 0 && (
        <div className="space-y-3">
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
              setSelectedLog(event.data ?? null);
            }}
            rowClass="cursor-pointer"
            overlayNoRowsTemplate="<span class='text-slate-500'>No consents match your search.</span>"
          />
        </div>
      )}

      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title={selectedLog?.consentTitle || 'Consent details'}
        size="wide"
        className="consent-details-modal"
      >
        {selectedLog && (
          <div className="consent-details-content">
            <div className="consent-details-grid">
              <div><span>Consent Type</span><p>{selectedLog.consentType || '—'}</p></div>
              <div><span>Consent Date</span><p>{formatDateTime(selectedLog.consentDate) || '—'}</p></div>
              <div><span>Consented By</span><p>{selectedLog.consentedBy || selectedLog.createdByName || '—'}</p></div>
              <div><span>Version</span><p>{selectedLog.version || '—'}</p></div>
              <div><span>Expiration</span><p>{formatDateOnly(selectedLog.expiration)}</p></div>
              <div>
                <span>Attachment</span>
                {selectedLog.fileAttached && selectedLog.downloadUrl ? (
                  <button
                    type="button"
                    onClick={() => void handlePreviewAttachment(selectedLog)}
                    className="consent-details-attachment"
                  >
                    <FileText size={15} />
                    {selectedLog.fileName || 'Preview attachment'}
                    {selectedLog.fileSizeBytes ? ` (${Math.round(selectedLog.fileSizeBytes / 1024)} KB)` : ''}
                  </button>
                ) : <p>None</p>}
              </div>
            </div>
            <div className="consent-details-comments">
              <span>Comments</span>
              <p>{selectedLog.comments || 'No comments'}</p>
            </div>
            <div className="consent-details-meta">
              {selectedLog.sticky && <span><Pin size={14} /> Pinned</span>}
              {selectedLog.global && <span><Globe size={14} /> Global</span>}
              {selectedLog.lastContact && <span>Date of Last Contact</span>}
              {selectedLog.createdByName && <span>Created by {selectedLog.createdByName}</span>}
              {selectedLog.updatedByName && selectedLog.updatedByName !== selectedLog.createdByName && (
                <span>Modified by {selectedLog.updatedByName}</span>
              )}
            </div>
          </div>
        )}
      </Modal>

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
