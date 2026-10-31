// frontend/microfrontends/participant/src/components/ParticipantEmailSection.tsx - Full Legacy Parity Email Communication History
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Mail,
  Plus,
  Pin,
  Loader2,
  AlertCircle,
  Search,
  X,
} from 'lucide-react';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { participantApi, CommunicationItem } from '../../../../shared/api/participantApi';
import { DataGrid, type ColDef, type ICellRendererParams } from '../../../../shared/design-system/components/DataGrid';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { ComposeEmailModal } from './ComposeEmailModal';

const formatEmailDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return (
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ', ' +
      date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    );
  } catch {
    return dateStr;
  }
};

export interface ParticipantEmailSectionProps {
  participantId: string;
  participantName: string;
  studyId?: string;
  tenantId?: string;
  siteId?: string;
}

export const getEmailPreviewDocument = (body: string, isHtml: boolean): string => {
  if (isHtml) return body;

  const escapedBody = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  return `<!doctype html><html><body style="font-family:Arial,sans-serif;white-space:pre-wrap;overflow-wrap:anywhere">${escapedBody}</body></html>`;
};

interface EmailPreviewContentProps {
  email: CommunicationItem;
  participantName: string;
}

const EmailPreviewContent: React.FC<EmailPreviewContentProps> = ({
  email,
  participantName,
}) => {
  const recipients = email.recipients || [];
  const to = recipients
    .filter((recipient) => recipient.recipientType === 'TO')
    .map((recipient) => recipient.recipientValue || recipient.recipientName)
    .join(', ');
  const cc = recipients
    .filter((recipient) => recipient.recipientType === 'CC')
    .map((recipient) => recipient.recipientValue || recipient.recipientName)
    .join(', ');
  const bcc = recipients
    .filter((recipient) => recipient.recipientType === 'BCC')
    .map((recipient) => recipient.recipientValue || recipient.recipientName)
    .join(', ');

  return (
    <div className="participant-email-preview-layout">
      <div className="participant-email-preview-details">
        <div>
          <span className="font-semibold text-slate-600">From</span>
          <p className="mt-1 break-all text-slate-800">{email.senderName || email.authorName || 'Study Coordinator'}</p>
        </div>
        <div>
          <span className="font-semibold text-slate-600">To</span>
          <p className="mt-1 break-all text-slate-800">{to || participantName}</p>
        </div>
        {cc && (
          <div>
            <span className="font-semibold text-slate-600">Cc</span>
            <p className="mt-1 break-all text-slate-800">{cc}</p>
          </div>
        )}
        {bcc && (
          <div>
            <span className="font-semibold text-slate-600">Bcc</span>
            <p className="mt-1 break-all text-slate-800">{bcc}</p>
          </div>
        )}
        {email.replyTo && (
          <div>
            <span className="font-semibold text-slate-600">Reply-To</span>
            <p className="mt-1 break-all text-slate-800">{email.replyTo}</p>
          </div>
        )}
        <div>
          <span className="font-semibold text-slate-600">Sent</span>
          <p className="mt-1 text-slate-800">{formatEmailDate(email.sentAt || email.createdAt)}</p>
        </div>
      </div>
      <iframe
        title={`Email preview: ${email.subject || 'No subject'}`}
        srcDoc={getEmailPreviewDocument(email.body, Boolean(email.messageIsHtml))}
        sandbox=""
        referrerPolicy="no-referrer"
        className="participant-email-preview-frame"
      />
    </div>
  );
};

export const ParticipantEmailSection: React.FC<ParticipantEmailSectionProps> = ({
  participantId,
  participantName,
  studyId,
  tenantId,
  siteId,
}) => {
  const [emails, setEmails] = useState<CommunicationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [previewEmailId, setPreviewEmailId] = useState<string | null>(null);
  const [updatingFlagId, setUpdatingFlagId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchEmails = useCallback(async () => {
    if (!participantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await participantApi.getEmails(participantId, { tenantId, siteId });
      setEmails(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to load email history');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [participantId, tenantId, siteId]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handlePinEmail = useCallback(async (email: CommunicationItem) => {
    setUpdatingFlagId(`${email.id}-sticky`);
    const isSticky = Boolean(email.sticky || email.pinned);
    const newValue = !isSticky;
    try {
      await participantApi.pinEmail(participantId, email.id, newValue, { tenantId, siteId });
      toast.success(newValue ? 'Email pinned to top' : 'Email unpinned');
      await fetchEmails();
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to update email flag');
      toast.error(msg);
    } finally {
      setUpdatingFlagId(null);
    }
  }, [participantId, tenantId, siteId, fetchEmails]);

  // Sticky first sorter matching legacy Ripple stickyFirstSorter
  const sortedEmails = useMemo(() => {
    return [...emails].sort((a, b) => {
      const aSticky = Boolean(a.sticky || a.pinned);
      const bSticky = Boolean(b.sticky || b.pinned);
      if (aSticky !== bSticky) {
        return aSticky ? -1 : 1;
      }
      const timeA = new Date(a.sentAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.sentAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [emails]);

  const columnDefs = useMemo<ColDef<CommunicationItem>[]>(() => [
    {
      field: 'sentAt',
      headerName: 'Date/Time Sent',
      minWidth: 175,
      valueGetter: (params) => params.data?.sentAt || params.data?.createdAt || '',
      valueFormatter: (params) => formatEmailDate(params.value),
    },
    {
      colId: 'from',
      headerName: 'From',
      minWidth: 125,
      valueGetter: (params) => params.data?.senderName || params.data?.authorName || 'Study Coordinator',
      tooltipValueGetter: (params) => params.value,
    },
    {
      field: 'subject',
      headerName: 'Subject',
      minWidth: 190,
      flex: 1,
      valueGetter: (params) => params.data?.subject || '(No Subject)',
      tooltipValueGetter: (params) => params.value,
    },
    {
      colId: 'recipients',
      headerName: 'To',
      minWidth: 180,
      valueGetter: (params) => (params.data?.recipients || [])
        .filter((recipient) => recipient.recipientType === 'TO')
        .map((recipient) => recipient.recipientValue || recipient.recipientName)
        .join(', '),
      tooltipValueGetter: (params) => params.value,
    },
    {
      colId: 'attachments',
      headerName: 'Attachments',
      minWidth: 130,
      valueGetter: (params) => params.data?.attachments?.join(', ') || '—',
      tooltipValueGetter: (params) => params.value,
    },
    {
      colId: 'pinned',
      headerName: 'Pin',
      width: 82,
      minWidth: 82,
      maxWidth: 92,
      sortable: false,
      filter: false,
      floatingFilter: false,
      cellRenderer: (params: ICellRendererParams<CommunicationItem>) => {
        const email = params.data;
        if (!email) return null;
        const isSticky = Boolean(email.sticky || email.pinned);
        const isUpdating = updatingFlagId === `${email.id}-sticky`;
        return (
          <button
            type="button"
            aria-label={isSticky ? 'Unpin email' : 'Pin email'}
            aria-pressed={isSticky}
            title={isSticky ? 'Unpin email' : 'Pin email to top'}
            disabled={isUpdating}
            onClick={(event) => {
              event.stopPropagation();
              void handlePinEmail(email);
            }}
            className="flex h-full w-full items-center justify-center disabled:cursor-not-allowed"
            style={{ color: isSticky ? '#b45309' : '#94a3b8' }}
          >
            <Pin size={16} fill={isSticky ? 'currentColor' : 'none'} strokeWidth={2.25} />
          </button>
        );
      },
    },
  ], [updatingFlagId, handlePinEmail]);

  const defaultColDef = useMemo<ColDef<CommunicationItem>>(() => ({
    sortable: true,
    resizable: true,
    filter: true,
    floatingFilter: true,
  }), []);

  const previewEmail = useMemo(
    () => sortedEmails.find((email) => email.id === previewEmailId) || null,
    [sortedEmails, previewEmailId]
  );

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-800">Email Communication History</h3>
          <button
            type="button"
            onClick={() => setIsComposeOpen(true)}
            className="btn btn-sm btn-primary flex items-center gap-1.5 custom-tooltip-btn"
            data-tooltip="Compose Email"
          >
            <Plus size={14} /> Compose Email
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && emails.length === 0 && (
        <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
          <Loader2 size={24} className="animate-spin text-blue-600" />
          <span className="text-xs">Loading email communication history...</span>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
          <button type="button" onClick={fetchEmails} className="underline">
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && emails.length === 0 && (
        <div className="p-8 text-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center">
          <Mail size={32} className="text-gray-400 mb-2" />
          <h5 className="text-sm font-medium text-gray-700 mb-1">No emails logged</h5>
          <p className="text-xs text-gray-500 max-w-sm mb-4">
            No outbound emails have been logged for {participantName} yet.
          </p>
          <button
            type="button"
            onClick={() => setIsComposeOpen(true)}
            className="btn btn-sm btn-primary flex items-center gap-1.5"
          >
            <Plus size={14} /> Add First Email
          </button>
        </div>
      )}

      {/* Email history grid */}
      {!isLoading && sortedEmails.length > 0 && (
        <div className="space-y-3">
          <label className="relative block max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search emails..."
              aria-label="Search emails"
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Clear email search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={14} />
              </button>
            )}
          </label>
          <DataGrid<CommunicationItem>
            wrapperClassName="participant-email-grid"
            rowData={sortedEmails}
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
              if (!event.data || target?.closest('button')) return;
              setPreviewEmailId(event.data.id);
            }}
            rowClass="cursor-pointer"
            overlayNoRowsTemplate="<span class='text-slate-500'>No emails match your search.</span>"
          />
        </div>
      )}

      <Modal
        isOpen={Boolean(previewEmail)}
        onClose={() => setPreviewEmailId(null)}
        title={previewEmail?.subject || 'Email preview'}
        size="wide"
        className="email-preview-modal"
      >
        {previewEmail && (
          <EmailPreviewContent email={previewEmail} participantName={participantName} />
        )}
      </Modal>

      {/* Compose / Add Email Modal */}
      <ComposeEmailModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        participantId={participantId}
        participantName={participantName}
        studyId={studyId}
        tenantId={tenantId}
        siteId={siteId}
        onEmailSent={() => fetchEmails()}
      />
    </div>
  );
};

export default ParticipantEmailSection;
