// frontend/microfrontends/participant/src/components/ParticipantContactLogs.tsx - Participant Contact Log History
import React, { useState, useEffect, useCallback } from 'react';
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
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { requestConfirmation } from '../../../../shared/confirmation';
import {
  participantApi,
  ContactLogItem,
} from '../../../../shared/api/participantApi';
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

  // Expandable row state
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

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

  const toggleRowExpansion = (logId: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

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

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="btn btn-sm btn-primary flex items-center gap-1.5"
            id="add-contact-log-btn"
          >
            <Plus size={14} /> Add Contact
          </button>
        </div>
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
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="btn btn-sm btn-primary flex items-center gap-1.5"
          >
            <Plus size={14} /> Add Contact
          </button>
        </div>
      )}

      {/* Legacy Footable-style Contact History Table */}
      {!isLoading && logs.length > 0 && (
        <div className="table-container bg-white border border-gray-200 rounded-lg shadow-xs overflow-visible">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs" id="contact-log-list">
            <thead className="bg-gray-50 font-semibold text-gray-600">
              <tr>
                <th scope="col" className="px-3.5 py-2.5">Date/Time of Contact</th>
                <th scope="col" className="px-3.5 py-2.5">Contact Type</th>
                <th scope="col" className="px-3.5 py-2.5">Outcome</th>
                <th scope="col" className="px-3.5 py-2.5">Contacted By</th>
                <th scope="col" className="px-3.5 py-2.5 text-right">&nbsp;</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => {
                const isExpanded = expandedLogIds.has(log.id);
                const isToggling = togglingPinId === log.id;
                const formattedDate = formatDateTime(log.dateTimeOfContact);
                const authorName = log.updatedByName || log.contactedByName || log.createdByName || 'User';
                const avatarInitials = log.updatedByInitials || log.createdByInitials || 'SK';

                return (
                  <React.Fragment key={log.id}>
                    {/* Primary Row */}
                    <tr
                      className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${
                        log.sticky ? 'bg-amber-50/40' : ''
                      }`}
                      onClick={() => toggleRowExpansion(log.id)}
                    >
                      <td className="px-3.5 py-2.5 whitespace-nowrap overflow-visible">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="p-0.5 text-gray-400 hover:text-gray-700 focus:outline-none"
                            aria-label={isExpanded ? 'Collapse row details' : 'Expand row details'}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(log.id);
                            }}
                          >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>

                          {log.sticky && (
                            <span
                              className="inline-flex text-amber-600 custom-tooltip-btn cursor-default"
                              data-tooltip="Pinned to top"
                              aria-label="Pinned Contact"
                            >
                              <Pin size={13} className="fill-amber-500" />
                            </span>
                          )}

                          <span className="font-semibold text-gray-800">{formattedDate}</span>

                          {log.global && (
                            <span
                              className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-0.5 custom-tooltip-btn cursor-default"
                              data-tooltip={log.studyName ? `Global (${log.studyName})` : 'Global (Registry)'}
                              aria-label={log.studyName ? `Global (${log.studyName})` : 'Global (Registry)'}
                            >
                              <Globe size={10} />
                              Global ({log.studyName || 'Registry'})
                            </span>
                          )}

                          {log.editable !== false && (
                            <div className="participant-grid__row-actions inline-flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(log)}
                                className="participant-grid__row-action custom-tooltip-btn"
                                data-tooltip="Edit contact log"
                                aria-label="Edit contact log"
                              >
                                <Pencil size={13} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLog(log)}
                                className="participant-grid__row-action participant-grid__row-action--danger custom-tooltip-btn tooltip-align-right"
                                data-tooltip="Delete contact log"
                                aria-label="Delete contact log"
                              >
                                <Trash2 size={13} aria-hidden="true" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-3.5 py-2.5 whitespace-nowrap text-gray-700">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-medium">
                          {log.contactType}
                        </span>
                      </td>

                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full font-medium border ${getOutcomeBadgeStyle(
                            log.outcome
                          )}`}
                        >
                          {log.outcome}
                        </span>
                      </td>

                      <td className="px-3.5 py-2.5 whitespace-nowrap text-gray-700">
                        <span className="flex items-center gap-1 font-medium">
                          <User size={12} className="text-gray-400" />
                          {log.contactedByName || log.contactedBy || 'Unknown User'}
                        </span>
                      </td>

                      <td className="px-3.5 py-2.5 whitespace-nowrap text-right overflow-visible">
                        <div
                          className="comment-avatar-wrap inline-flex items-center justify-center cursor-pointer custom-tooltip-btn tooltip-align-right"
                          data-tooltip={authorName}
                          aria-label={authorName}
                        >
                          <span>{avatarInitials}</span>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Details Row */}
                    {isExpanded && (
                      <tr className="bg-gray-50/70 border-b border-gray-200">
                        <td colSpan={5} className="px-6 py-3 text-xs text-gray-700">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-2">
                            {/* Spoke To */}
                            <div>
                              <span className="font-semibold text-gray-500 block mb-0.5">Spoke To</span>
                              <span className="text-gray-800">{log.spokeTo || '—'}</span>
                            </div>

                            {/* Method */}
                            <div>
                              <span className="font-semibold text-gray-500 block mb-0.5">Method</span>
                              <span className="text-gray-800">{log.contactMethod || '—'}</span>
                            </div>

                            {/* Outcome Details */}
                            <div>
                              <span className="font-semibold text-gray-500 block mb-0.5">Outcome</span>
                              <span className="text-gray-800">{log.outcome || '—'}</span>
                            </div>
                          </div>

                          {/* Regarding */}
                          {log.regarding && (
                            <div className="mt-2">
                              <span className="font-semibold text-gray-500 block mb-0.5">Regarding</span>
                              <div className="bg-white p-2 rounded-md border border-gray-200 whitespace-pre-wrap text-gray-800">
                                {log.regarding}
                              </div>
                            </div>
                          )}

                          {/* Comments */}
                          {log.comments && (
                            <div className="mt-2">
                              <span className="font-semibold text-gray-500 block mb-0.5">Comments</span>
                              <div className="bg-white p-2 rounded-md border border-gray-200 whitespace-pre-wrap text-gray-800">
                                {log.comments}
                              </div>
                            </div>
                          )}

                          {/* Mark Contact As (Checkboxes) & Audit Info */}
                          <div className="mt-3 pt-2.5 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-500">
                            <div className="flex items-center gap-4">
                              <span className="font-semibold text-gray-600">Mark Contact As:</span>
                              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="form-checkbox h-3.5 w-3.5 text-blue-600 rounded-sm"
                                  checked={log.sticky}
                                  disabled={isToggling || log.pinnable === false}
                                  onChange={() => handleTogglePin(log)}
                                />
                                <span className={log.sticky ? 'font-medium text-amber-700' : ''}>Pin Contact</span>
                              </label>

                              {log.global && (
                                <span className="inline-flex items-center gap-1 text-indigo-700">
                                  <Globe size={11} /> Global
                                </span>
                              )}

                              {log.lastContact && (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                  Date of Last Contact
                                </span>
                              )}
                            </div>

                            <div className="text-gray-400">
                              {log.createdByName && <span>Created by {log.createdByName} </span>}
                              {log.updatedByName && log.updatedByName !== log.createdByName && (
                                <span>&bull; Modified by {log.updatedByName}</span>
                              )}
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
