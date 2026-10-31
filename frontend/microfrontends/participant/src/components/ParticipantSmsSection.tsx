// frontend/microfrontends/participant/src/components/ParticipantSmsSection.tsx - Legacy Ripple Grid Style Text Messages
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Loader2, Pin, Search, X } from 'lucide-react';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { participantApi, CommunicationItem } from '../../../../shared/api/participantApi';
import { AuthUser } from '../../../../shared/contracts';
import { DataGrid, type ColDef, type ICellRendererParams } from '../../../../shared/design-system/components/DataGrid';
import { ComposeSmsModal } from './ComposeSmsModal';

export interface ParticipantSmsSectionProps {
  participantId: string;
  participantName: string;
  studyId?: string;
  tenantId?: string;
  siteId?: string;
  currentUser?: AuthUser | null;
}

export const ParticipantSmsSection: React.FC<ParticipantSmsSectionProps> = ({
  participantId,
  participantName,
  studyId,
  tenantId,
  siteId,
  currentUser,
}) => {
  const [messages, setMessages] = useState<CommunicationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingPinId, setTogglingPinId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMessages = useCallback(async () => {
    if (!participantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await participantApi.getSms(participantId, { tenantId, siteId });
      setMessages(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to load text message history');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [participantId, tenantId, siteId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleTogglePin = async (msg: CommunicationItem) => {
    setTogglingPinId(msg.id);
    const newPinned = !msg.pinned;
    try {
      await participantApi.pinSms(participantId, msg.id, newPinned, { tenantId, siteId });
      toast.success(newPinned ? 'Text message pinned' : 'Text message unpinned');
      await fetchMessages();
    } catch (err: any) {
      const errorMsg = getApiErrorMessage(err, 'Failed to update pin status');
      toast.error(errorMsg);
    } finally {
      setTogglingPinId(null);
    }
  };

  const getRecipientString = (msg: CommunicationItem) => {
    if (msg.recipients && msg.recipients.length > 0) {
      return msg.recipients.map((r) => r.recipientValue).join(', ');
    }
    return msg.subject ? msg.subject.replace(/^SMS to\s*/i, '') : '—';
  };

  const getSenderName = (msg: CommunicationItem) => {
    if (msg.senderName && msg.senderName.trim()) return msg.senderName.trim();
    if (currentUser?.fullName && currentUser.fullName.trim()) return currentUser.fullName.trim();
    const parts = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).map((s) => s?.trim()).filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    if (currentUser?.username) return currentUser.username.trim();
    return 'Suneel Kumar';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return (
        d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
        ', ' +
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    } catch {
      return dateStr;
    }
  };

  const sortedMessages = useMemo(() => {
    const list = [...messages];
    // Separate pinned vs unpinned: pinned always on top
    return list.sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }
      const timeA = new Date(a.sentAt || 0).getTime();
      const timeB = new Date(b.sentAt || 0).getTime();
      return timeB - timeA;
    });
  }, [messages]);

  const columnDefs = useMemo<ColDef<CommunicationItem>[]>(() => [
    {
      colId: 'sentAt',
      headerName: 'Date/Time Sent',
      minWidth: 180,
      valueGetter: (params) => params.data?.sentAt || params.data?.createdAt || '',
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      colId: 'from',
      headerName: 'From',
      minWidth: 150,
      valueGetter: (params) => params.data ? getSenderName(params.data) : '',
      tooltipValueGetter: (params) => params.value,
    },
    {
      colId: 'to',
      headerName: 'To',
      minWidth: 170,
      valueGetter: (params) => params.data ? getRecipientString(params.data) : '',
      tooltipValueGetter: (params) => params.value,
    },
    {
      colId: 'scope',
      headerName: 'Scope',
      minWidth: 125,
      valueGetter: (params) => params.data?.global ? 'Global Registry' : '',
    },
    {
      field: 'body',
      headerName: 'Message',
      minWidth: 220,
      flex: 1,
      tooltipValueGetter: (params) => params.value,
      cellStyle: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    },
    {
      colId: 'pin',
      headerName: 'Pin',
      width: 76,
      minWidth: 76,
      maxWidth: 76,
      sortable: false,
      filter: false,
      floatingFilter: false,
      cellRenderer: (params: ICellRendererParams<CommunicationItem>) => {
        const message = params.data;
        if (!message) return null;
        const isUpdating = togglingPinId === message.id;
        return (
          <button
            type="button"
            aria-label={message.pinned ? 'Unpin text' : 'Pin text'}
            title={message.pinned ? 'Unpin text' : 'Pin text'}
            disabled={isUpdating}
            onClick={(event) => {
              event.stopPropagation();
              void handleTogglePin(message);
            }}
            className="flex h-full w-full items-center justify-center disabled:cursor-not-allowed"
            style={{ color: message.pinned ? '#b45309' : '#94a3b8' }}
          >
            {isUpdating ? <Loader2 size={15} className="animate-spin" /> : (
              <Pin size={15} fill={message.pinned ? 'currentColor' : 'none'} />
            )}
          </button>
        );
      },
    },
  ], [togglingPinId, currentUser, handleTogglePin]);

  const defaultColDef = useMemo<ColDef<CommunicationItem>>(() => ({
    sortable: true,
    resizable: true,
    filter: true,
    floatingFilter: true,
  }), []);

  return (
    <div className="space-y-3">
      {/* Top action row matching Image 2 */}
      <div className="flex items-center justify-between pb-1">
        <button
          id="add-text-log-modal-button"
          type="button"
          onClick={() => setIsComposeOpen(true)}
          className="btn btn-primary flex items-center gap-1.5 custom-tooltip-btn"
          data-tooltip="Add Text"
          style={{
            backgroundColor: '#1d4ed8',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '13px',
            padding: '7px 18px',
            borderRadius: '4px',
            border: 'none',
          }}
        >
          <Plus size={15} /> Add Text
        </button>
      </div>

      {/* Loading state */}
      {isLoading && messages.length === 0 && (
        <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
          <Loader2 size={24} className="animate-spin text-blue-600" />
          <span className="text-xs">Loading text messages...</span>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={fetchMessages} className="underline font-semibold hover:text-red-800">
            Retry
          </button>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-3">
          <label className="relative block max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search text messages..."
              aria-label="Search text messages"
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Clear text message search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={14} />
              </button>
            )}
          </label>
          <DataGrid<CommunicationItem>
            wrapperClassName="participant-email-grid"
            rowData={sortedMessages}
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
            overlayNoRowsTemplate="<span class='text-slate-500'>No text messages match your search.</span>"
          />
        </div>
      )}

      {/* Compose / Add Text Modal */}
      <ComposeSmsModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        participantId={participantId}
        participantName={participantName}
        studyId={studyId}
        tenantId={tenantId}
        siteId={siteId}
        onSmsSent={() => fetchMessages()}
      />
    </div>
  );
};

export default ParticipantSmsSection;
