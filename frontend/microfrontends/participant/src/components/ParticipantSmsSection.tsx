// frontend/microfrontends/participant/src/components/ParticipantSmsSection.tsx - Real Backend-Persisted SMS Gateway & History
import React, { useState, useEffect, useCallback } from 'react';
import { Phone, Plus, Loader2, AlertCircle, RefreshCw, Send, CheckCircle2 } from 'lucide-react';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { participantApi, CommunicationItem } from '../../../../shared/api/participantApi';
import { ComposeSmsModal } from './ComposeSmsModal';

export interface ParticipantSmsSectionProps {
  participantId: string;
  participantName: string;
  studyId?: string;
  tenantId?: string;
  siteId?: string;
}

export const ParticipantSmsSection: React.FC<ParticipantSmsSectionProps> = ({
  participantId,
  participantName,
  studyId,
  tenantId,
  siteId,
}) => {
  const [messages, setMessages] = useState<CommunicationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);

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
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-gray-200">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <Phone size={16} className="text-blue-600" />
            SMS Communication Gateway
          </h4>
          <p className="text-xs text-gray-500">
            Real-time SMS gateway logs and outbound text communications for {participantName}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchMessages}
            disabled={isLoading}
            className="btn btn-ghost btn-xs text-gray-500 hover:text-gray-900"
            title="Refresh SMS"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => setIsComposeOpen(true)}
            className="btn btn-sm btn-primary flex items-center gap-1.5"
          >
            <Plus size={14} /> Send SMS
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && messages.length === 0 && (
        <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
          <Loader2 size={24} className="animate-spin text-blue-600" />
          <span className="text-xs">Loading SMS messages...</span>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
          <button type="button" onClick={fetchMessages} className="underline">
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && messages.length === 0 && (
        <div className="p-8 text-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center">
          <Phone size={32} className="text-gray-400 mb-2" />
          <h5 className="text-sm font-medium text-gray-700 mb-1">No SMS messages logged</h5>
          <p className="text-xs text-gray-500 max-w-sm mb-4">
            No text messages have been exchanged with {participantName} yet.
          </p>
          <button
            type="button"
            onClick={() => setIsComposeOpen(true)}
            className="btn btn-sm btn-primary flex items-center gap-1.5"
          >
            <Plus size={14} /> Send First SMS
          </button>
        </div>
      )}

      {/* Message History list */}
      {!isLoading && messages.length > 0 && (
        <div className="space-y-2.5 max-h-96 overflow-y-auto p-1">
          {messages.map((msg) => {
            const recipientPhone = (msg.recipients || [])
              .map((r) => r.recipientValue)
              .join(', ');

            return (
              <div
                key={msg.id}
                className="p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-all text-xs"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <strong className="text-gray-900">{recipientPhone || msg.subject || 'Mobile Phone'}</strong>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 size={10} /> {msg.status || 'Sent'}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">{formatDate(msg.sentAt)}</span>
                </div>

                <div className="pt-2 text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {msg.body}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compose Modal */}
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
