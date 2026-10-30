// frontend/microfrontends/participant/src/components/ParticipantEmailSection.tsx - Real Backend-Persisted Email History & Sender
import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Plus, Pin, Loader2, AlertCircle, RefreshCw, Send, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { participantApi, CommunicationItem } from '../../../../shared/api/participantApi';
import { ComposeEmailModal } from './ComposeEmailModal';

export interface ParticipantEmailSectionProps {
  participantId: string;
  participantName: string;
  studyId?: string;
  tenantId?: string;
  siteId?: string;
}

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
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [togglingPinId, setTogglingPinId] = useState<string | null>(null);

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

  const handleTogglePin = async (email: CommunicationItem) => {
    setTogglingPinId(email.id);
    const newPinned = !email.pinned;
    try {
      await participantApi.pinEmail(participantId, email.id, newPinned, { tenantId, siteId });
      toast.success(newPinned ? 'Email pinned' : 'Email unpinned');
      await fetchEmails();
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to update pin status');
      toast.error(msg);
    } finally {
      setTogglingPinId(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return (
        d.toLocaleDateString('en-GB') +
        ', ' +
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      );
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-gray-200">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <Mail size={16} className="text-blue-600" />
            Email Communication History
          </h4>
          <p className="text-xs text-gray-500">
            Audit history of secure outreach and study notifications sent to {participantName}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchEmails}
            disabled={isLoading}
            className="btn btn-ghost btn-xs text-gray-500 hover:text-gray-900 custom-tooltip-btn"
            data-tooltip="Refresh emails"
            aria-label="Refresh emails"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
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
            No outbound emails have been sent to {participantName} yet.
          </p>
          <button
            type="button"
            onClick={() => setIsComposeOpen(true)}
            className="btn btn-sm btn-primary flex items-center gap-1.5"
          >
            <Plus size={14} /> Compose First Email
          </button>
        </div>
      )}

      {/* Emails List */}
      {!isLoading && emails.length > 0 && (
        <div className="space-y-3">
          {emails.map((email) => {
            const isExpanded = expandedEmailId === email.id;
            const toRecipients = (email.recipients || [])
              .filter((r) => r.recipientType === 'TO')
              .map((r) => r.recipientValue)
              .join(', ');

            return (
              <div
                key={email.id}
                className={`border rounded-lg p-3 transition-all ${
                  email.pinned
                    ? 'border-amber-300 bg-amber-50/40 shadow-xs'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Email Header line */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTogglePin(email)}
                      disabled={togglingPinId === email.id}
                      data-tooltip={email.pinned ? 'Unpin email' : 'Pin email to top'}
                      aria-label={email.pinned ? 'Unpin email' : 'Pin email to top'}
                      className={`p-1 rounded text-xs flex items-center gap-1 custom-tooltip-btn ${
                        email.pinned
                          ? 'text-amber-700 font-semibold hover:bg-amber-100'
                          : 'text-gray-400 hover:text-amber-600 hover:bg-gray-100'
                      }`}
                    >
                      {togglingPinId === email.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Pin size={12} className={email.pinned ? 'fill-amber-500' : ''} />
                      )}
                      {email.pinned && <span>Pinned</span>}
                    </button>

                    <strong className="text-xs text-gray-900">{email.subject || '(No Subject)'}</strong>

                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                      <CheckCircle2 size={11} /> {email.status || 'Sent'}
                    </span>
                  </div>

                  <span className="text-[11px] text-gray-400 shrink-0">{formatDate(email.sentAt)}</span>
                </div>

                {/* Recipients meta */}
                <div className="pt-2 text-xs text-gray-600 flex items-center justify-between">
                  <div className="truncate max-w-md">
                    <span className="text-gray-400 mr-1">To:</span>
                    <span className="text-gray-800 font-medium">{toRecipients || participantName}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedEmailId(isExpanded ? null : email.id)}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 shrink-0"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronDown size={14} /> Hide Message
                      </>
                    ) : (
                      <>
                        <ChevronRight size={14} /> View Message
                      </>
                    )}
                  </button>
                </div>

                {/* Collapsible Body */}
                {isExpanded && (
                  <div className="mt-3 pt-2 border-t border-gray-100 text-xs">
                    <div className="p-3 bg-gray-50 rounded border border-gray-100 text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {email.body}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Compose Email Modal */}
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
