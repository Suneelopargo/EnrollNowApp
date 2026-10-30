// frontend/microfrontends/participant/src/components/ParticipantSmsSection.tsx - Legacy Ripple Grid Style Text Messages
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Loader2, Pin, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { participantApi, CommunicationItem } from '../../../../shared/api/participantApi';
import { AuthUser } from '../../../../shared/contracts';
import { ComposeSmsModal } from './ComposeSmsModal';

export interface ParticipantSmsSectionProps {
  participantId: string;
  participantName: string;
  studyId?: string;
  tenantId?: string;
  siteId?: string;
  currentUser?: AuthUser | null;
}

type SortField = 'date' | 'from' | 'to' | 'message';
type SortDirection = 'asc' | 'desc';

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
  const [hoveredAvatarId, setHoveredAvatarId] = useState<string | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'date' ? 'desc' : 'asc');
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

  const getInitials = (nameStr: string) => {
    const parts = nameStr.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'CU';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
      let cmp = 0;
      if (sortField === 'date') {
        const timeA = a.sentAt ? new Date(a.sentAt).getTime() : 0;
        const timeB = b.sentAt ? new Date(b.sentAt).getTime() : 0;
        cmp = timeA - timeB;
      } else if (sortField === 'from') {
        cmp = getSenderName(a).localeCompare(getSenderName(b));
      } else if (sortField === 'to') {
        cmp = getRecipientString(a).localeCompare(getRecipientString(b));
      } else if (sortField === 'message') {
        cmp = (a.body || '').localeCompare(b.body || '');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [messages, sortField, sortDir]);

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="inline ml-1 text-gray-400 opacity-60" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp size={12} className="inline ml-1 text-gray-700" />
    ) : (
      <ArrowDown size={12} className="inline ml-1 text-gray-700" />
    );
  };

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

      {/* Legacy Table / Grid View */}
      {!isLoading && (
        <div className="border border-gray-200 rounded overflow-x-auto bg-white shadow-xs">
          <table className="w-full border-collapse text-xs text-left min-w-[500px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold select-none">
                <th
                  scope="col"
                  className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition-colors"
                  style={{ width: '25%' }}
                  onClick={() => handleSort('date')}
                >
                  Date/Time Sent {renderSortIndicator('date')}
                </th>
                <th
                  scope="col"
                  className="py-2.5 px-2 cursor-pointer hover:bg-gray-100 transition-colors"
                  style={{ width: '10%' }}
                  onClick={() => handleSort('from')}
                >
                  From {renderSortIndicator('from')}
                </th>
                <th
                  scope="col"
                  className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition-colors"
                  style={{ width: '20%' }}
                  onClick={() => handleSort('to')}
                >
                  To {renderSortIndicator('to')}
                </th>
                <th
                  scope="col"
                  className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition-colors"
                  style={{ width: '40%' }}
                  onClick={() => handleSort('message')}
                >
                  Message {renderSortIndicator('message')}
                </th>
                <th scope="col" className="py-2.5 px-2 text-right" style={{ width: '5%' }}>
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedMessages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                    No text messages logged yet.
                  </td>
                </tr>
              ) : (
                sortedMessages.map((msg) => {
                  const sender = getSenderName(msg);
                  const initials = getInitials(sender);
                  const recipients = getRecipientString(msg);

                  return (
                    <tr
                      key={msg.id}
                      className={`group hover:bg-gray-50 transition-colors ${
                        msg.pinned ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Date / Time Sent column */}
                      <td className="py-2.5 px-3 text-gray-800 align-top">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {msg.pinned && (
                            <Pin
                              size={13}
                              className="fill-gray-900 text-gray-900 -rotate-45 flex-shrink-0"
                              aria-label="Pinned"
                            />
                          )}
                          <span className="font-medium text-gray-900">
                            {formatDate(msg.sentAt || (msg as any).createdAt)}
                          </span>
                          <span
                            className="badge-global-comment"
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              color: '#ffffff',
                              backgroundColor: '#0070ba',
                              borderRadius: '10px',
                              lineHeight: '1.4',
                            }}
                          >
                            Global (Registry)
                          </span>
                        </div>
                      </td>

                      {/* From column: Initials box + custom tooltip */}
                      <td className="py-2.5 px-3 align-top">
                        <div
                          className="comment-avatar-wrap inline-block"
                          onMouseEnter={() => setHoveredAvatarId(msg.id)}
                          onMouseLeave={() => setHoveredAvatarId(null)}
                        >
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#374151',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            }}
                          >
                            {initials}
                          </div>
                          {hoveredAvatarId === msg.id && (
                            <div className="comment-avatar-tooltip is-visible" role="tooltip">
                              {sender}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* To column */}
                      <td className="py-2.5 px-3 text-gray-800 font-medium align-top">
                        {recipients}
                      </td>

                      {/* Message column */}
                      <td className="py-2.5 px-3 text-gray-700 align-top whitespace-pre-wrap leading-relaxed">
                        {msg.body}
                      </td>

                      {/* Actions / Pin column */}
                      <td className="py-2.5 px-2 align-top text-right">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(msg)}
                          disabled={togglingPinId === msg.id}
                          data-tooltip={msg.pinned ? 'Unpin text' : 'Pin text'}
                          aria-label={msg.pinned ? 'Unpin text' : 'Pin text'}
                          className={`p-1 rounded transition-colors custom-tooltip-btn tooltip-align-right ${
                            msg.pinned
                              ? 'text-gray-900 hover:bg-gray-200 opacity-100'
                              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100 opacity-0 group-hover:opacity-100 focus:opacity-100'
                          }`}
                        >
                          {togglingPinId === msg.id ? (
                            <Loader2 size={13} className="animate-spin inline" />
                          ) : (
                            <Pin
                              size={13}
                              className={msg.pinned ? 'fill-gray-900 text-gray-900 -rotate-45' : ''}
                            />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
