// frontend/microfrontends/participant/src/components/ParticipantContactLogs.tsx - Participant Contact Log History
import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pin,
  PinOff,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  User,
  MessageSquare,
  Globe,
  Tag,
  CheckCircle,
  HelpCircle,
  RefreshCw,
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
      await participantApi.pinContactLog(participantId, log.id, newSticky);
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
          await participantApi.deleteContactLog(participantId, log.id);
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
        <div>
          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <Clock size={16} className="text-blue-600" />
            Contact History
          </h4>
          <p className="text-xs text-gray-500">
            Audit log of participant outreach attempts, screening outcomes, and follow-ups.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchContactLogs}
            disabled={isLoading}
            className="btn btn-sm btn-ghost text-gray-600 hover:text-gray-900 p-1.5"
            title="Refresh Contact History"
            aria-label="Refresh Contact History"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
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

      {/* Contact Logs List */}
      {!isLoading && logs.length > 0 && (
        <div className="space-y-3">
          {logs.map((log) => {
            const isToggling = togglingPinId === log.id;
            return (
              <div
                key={log.id}
                className={`border rounded-lg p-3 transition-all ${
                  log.sticky
                    ? 'border-amber-300 bg-amber-50/40 shadow-xs'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Top Row: Sticky badge, Date, Type, Outcome, Actions */}
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-gray-100">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Pin button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePin(log)}
                      disabled={isToggling}
                      title={log.sticky ? 'Unpin contact log' : 'Pin contact log to top'}
                      aria-label={log.sticky ? 'Unpin contact log' : 'Pin contact log'}
                      className={`p-1 rounded-sm text-xs flex items-center gap-1 transition-colors ${
                        log.sticky
                          ? 'text-amber-700 hover:bg-amber-100 font-medium'
                          : 'text-gray-400 hover:text-amber-600 hover:bg-gray-100'
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Pin size={13} className={log.sticky ? 'fill-amber-500 text-amber-700' : ''} />
                      )}
                      {log.sticky && <span>Pinned</span>}
                    </button>

                    {/* Date/Time */}
                    <span className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                      <Clock size={12} className="text-gray-400" />
                      {formatDateTime(log.dateTimeOfContact)}
                    </span>

                    {/* Contact Type Badge */}
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                      {log.contactType}
                    </span>

                    {/* Outcome Badge */}
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getOutcomeBadgeStyle(
                        log.outcome
                      )}`}
                    >
                      {log.outcome}
                    </span>

                    {/* Global Scope Badge */}
                    {log.global && (
                      <span
                        className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1"
                        title={
                          log.studyName
                            ? `Global contact from study: ${log.studyName}`
                            : 'Global registry contact'
                        }
                      >
                        <Globe size={11} />
                        {log.studyName ? `Global (${log.studyName})` : 'Global (Registry)'}
                      </span>
                    )}
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(log)}
                      className="btn btn-ghost btn-xs text-gray-600 hover:text-blue-600 p-1 custom-tooltip-btn"
                      data-tooltip="Edit Contact Log"
                      aria-label="Edit Contact Log"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLog(log)}
                      className="btn btn-ghost btn-xs text-gray-500 hover:text-red-600 p-1 custom-tooltip-btn tooltip-align-right"
                      data-tooltip="Delete Contact Log"
                      aria-label="Delete Contact Log"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Details Section */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Contacted By</span>
                    <strong className="text-gray-800 flex items-center gap-1">
                      <User size={12} className="text-gray-400" />
                      {log.contactedByName || log.contactedBy || 'Unknown User'}
                    </strong>
                  </div>

                  {log.contactMethod && (
                    <div>
                      <span className="text-gray-400 block text-[11px]">Method</span>
                      <span className="text-gray-800">{log.contactMethod}</span>
                    </div>
                  )}

                  {log.spokeTo && (
                    <div>
                      <span className="text-gray-400 block text-[11px]">Spoke To</span>
                      <span className="text-gray-800">{log.spokeTo}</span>
                    </div>
                  )}

                  {log.regarding && (
                    <div>
                      <span className="text-gray-400 block text-[11px]">Regarding</span>
                      <span className="text-gray-800">{log.regarding}</span>
                    </div>
                  )}
                </div>

                {/* Comments / Notes */}
                {log.comments && (
                  <div className="mt-2.5 pt-2 border-t border-gray-100 text-xs">
                    <div className="text-gray-700 bg-gray-50 rounded-md p-2 border border-gray-100 whitespace-pre-wrap">
                      {log.comments}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
