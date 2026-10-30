// frontend/microfrontends/participant/src/components/ParticipantEmailSection.tsx - Full Legacy Parity Email Communication History
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Mail,
  Plus,
  Pin,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Globe,
  Paperclip,
} from 'lucide-react';
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
  const [expandedEmailIds, setExpandedEmailIds] = useState<Set<string>>(new Set());
  const [updatingFlagId, setUpdatingFlagId] = useState<string | null>(null);

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

  const toggleRowExpansion = (id: string) => {
    setExpandedEmailIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleUpdateEmailFlag = async (
    email: CommunicationItem,
    flag: 'sticky' | 'global' | 'lastContact',
    currentValue: boolean
  ) => {
    setUpdatingFlagId(`${email.id}-${flag}`);
    const newValue = !currentValue;
    try {
      if (flag === 'sticky') {
        await participantApi.pinEmail(participantId, email.id, newValue, { tenantId, siteId });
        toast.success(newValue ? 'Email pinned to top' : 'Email unpinned');
      } else {
        await participantApi.updateEmailLog(
          participantId,
          email.id,
          { [flag]: newValue },
          { tenantId, siteId }
        );
        toast.success(`Updated email ${flag} status`);
      }
      await fetchEmails();
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to update email flag');
      toast.error(msg);
    } finally {
      setUpdatingFlagId(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return (
        d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
        ', ' +
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      );
    } catch {
      return dateStr;
    }
  };

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

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2">
        
        <div className="flex items-center gap-2">
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

      {/* Legacy Parity Email History Table with Dark Header #1a405f */}
      {!isLoading && sortedEmails.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-gray-200 shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1a405f] text-white">
                <th className="py-2.5 px-3 font-semibold w-10 text-center"></th>
                <th className="py-2.5 px-3 font-semibold w-[25%]">Date/Time Sent</th>
                <th className="py-2.5 px-3 font-semibold w-[12%]">From</th>
                <th className="py-2.5 px-3 font-semibold w-[43%]">Subject</th>
                <th className="py-2.5 px-3 font-semibold w-[15%]">Attachment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sortedEmails.map((email) => {
                const isExpanded = expandedEmailIds.has(email.id);
                const isSticky = Boolean(email.sticky || email.pinned);
                const authorName = email.senderName || email.authorName || 'Study Coordinator';
                const avatarInitials = email.authorInitials || 'SK';

                const toList = (email.recipients || [])
                  .filter((r) => r.recipientType === 'TO')
                  .map((r) => r.recipientValue || r.recipientName)
                  .join(', ');

                const ccList = (email.recipients || [])
                  .filter((r) => r.recipientType === 'CC')
                  .map((r) => r.recipientValue || r.recipientName)
                  .join(', ');

                const bccList = (email.recipients || [])
                  .filter((r) => r.recipientType === 'BCC')
                  .map((r) => r.recipientValue || r.recipientName)
                  .join(', ');

                const attachmentsList = email.attachments || [];

                return (
                  <React.Fragment key={email.id}>
                    {/* Primary Row */}
                    <tr
                      className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${
                        isSticky ? 'bg-amber-50/40' : ''
                      }`}
                      onClick={() => toggleRowExpansion(email.id)}
                    >
                      {/* Chevron Column */}
                      <td className="py-2.5 px-3 text-center align-middle">
                        <button
                          type="button"
                          className="p-0.5 text-gray-400 hover:text-gray-700 focus:outline-none"
                          aria-label={isExpanded ? 'Collapse row details' : 'Expand row details'}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowExpansion(email.id);
                          }}
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </td>

                      {/* Date/Time Sent */}
                      <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-1.5">
                            {isSticky && (
                              <span
                                className="inline-flex text-amber-600 custom-tooltip-btn cursor-default"
                                data-tooltip="Pinned to top"
                                aria-label="Pinned Email"
                              >
                                <Pin size={13} className="fill-amber-500" />
                              </span>
                            )}
                            <span className="font-medium text-gray-800">
                              {formatDate(email.sentAt || email.createdAt)}
                            </span>
                          </div>

                          {email.global && (
                            <span
                              className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-0.5 custom-tooltip-btn cursor-default"
                              data-tooltip={email.studyName ? `Global (${email.studyName})` : 'Global (Registry)'}
                            >
                              <Globe size={10} className="shrink-0" />
                              <span>Global ({email.studyName || 'Registry'})</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* From Column with Initials Avatar & Single Dark Tooltip */}
                      <td className="py-2.5 px-3 whitespace-nowrap align-middle overflow-visible">
                        <div className="comment-avatar-wrap inline-flex items-center justify-center cursor-pointer">
                          <span>{avatarInitials}</span>
                          <div className="comment-avatar-tooltip" role="tooltip">
                            {authorName}
                          </div>
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="py-2.5 px-3 text-gray-800 font-medium align-middle">
                        <div className="truncate max-w-md">{email.subject || '(No Subject)'}</div>
                      </td>

                      {/* Attachment */}
                      <td className="py-2.5 px-3 text-gray-700 align-middle">
                        {attachmentsList.length > 0 ? (
                          <div className="flex items-center gap-1 flex-wrap">
                            {attachmentsList.map((att: any, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-blue-600 max-w-[140px] truncate"
                                title={att.fileName}
                              >
                                <Paperclip size={11} className="text-gray-400 shrink-0" />
                                <span className="truncate">{att.fileName}</span>
                                {idx < attachmentsList.length - 1 && <span>,</span>}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>

                    {/* Expandable Details Row (ExpandedRow matching Legacy Ripple) */}
                    {isExpanded && (
                      <tr className="bg-gray-50/80 border-b border-gray-200">
                        <td colSpan={5} className="px-6 py-4 text-xs text-gray-700">
                          <div className="space-y-3">
                            {/* Message */}
                            <div>
                              <span className="font-semibold text-gray-800 block mb-1">Message:</span>
                              <div className="p-3 bg-white rounded border border-gray-200 text-gray-800 whitespace-pre-wrap leading-relaxed">
                                {email.body}
                              </div>
                            </div>

                            {/* Recipients Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                              <div>
                                <span className="font-semibold text-gray-800">To: </span>
                                <span className="text-gray-600">{toList || participantName}</span>
                              </div>

                              {ccList && (
                                <div>
                                  <span className="font-semibold text-gray-800">Cc: </span>
                                  <span className="text-gray-600">{ccList}</span>
                                </div>
                              )}

                              {bccList && (
                                <div>
                                  <span className="font-semibold text-gray-800">Bcc: </span>
                                  <span className="text-gray-600">{bccList}</span>
                                </div>
                              )}

                              {email.replyTo && (
                                <div>
                                  <span className="font-semibold text-gray-800">Reply-To: </span>
                                  <span className="text-gray-600">{email.replyTo}</span>
                                </div>
                              )}
                            </div>

                            {/* Mark Email As Checkboxes matching legacy Ripple ExpandedRow */}
                            <div className="pt-2 border-t border-gray-200 flex items-center gap-6 flex-wrap">
                              <span className="font-semibold text-gray-800">Mark Email As:</span>

                              {/* Contact checkbox */}
                              <label
                                className="flex items-center gap-1.5 cursor-pointer custom-tooltip-btn"
                                data-tooltip="Mark as 'Date of Last Contact' for participant."
                              >
                                <input
                                  type="checkbox"
                                  checked={Boolean(email.lastContact)}
                                  disabled={updatingFlagId === `${email.id}-lastContact`}
                                  onChange={() =>
                                    handleUpdateEmailFlag(email, 'lastContact', Boolean(email.lastContact))
                                  }
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                />
                                <span>Contact</span>
                              </label>

                              {/* Pin Email checkbox */}
                              <label
                                className="flex items-center gap-1.5 cursor-pointer custom-tooltip-btn"
                                data-tooltip="Pin current email to top of list."
                              >
                                <input
                                  type="checkbox"
                                  checked={isSticky}
                                  disabled={updatingFlagId === `${email.id}-sticky`}
                                  onChange={() => handleUpdateEmailFlag(email, 'sticky', isSticky)}
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                />
                                <span>Pin Email</span>
                              </label>

                              {/* Global checkbox */}
                              <label
                                className="flex items-center gap-1.5 cursor-pointer custom-tooltip-btn"
                                data-tooltip="Save contact log to global registry data."
                              >
                                <input
                                  type="checkbox"
                                  checked={Boolean(email.global)}
                                  disabled={updatingFlagId === `${email.id}-global`}
                                  onChange={() =>
                                    handleUpdateEmailFlag(email, 'global', Boolean(email.global))
                                  }
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                />
                                <span>Global</span>
                              </label>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
