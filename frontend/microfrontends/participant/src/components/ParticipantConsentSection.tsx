// frontend/microfrontends/participant/src/components/ParticipantConsentSection.tsx - Participant Consents List & Management
import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Plus, RefreshCw, FileText, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { participantApi, ConsentItem } from '../../../../shared/api/participantApi';
import { RecordConsentModal } from './RecordConsentModal';

export interface ParticipantConsentSectionProps {
  participantId: string;
  participantName: string;
  studyId?: string;
  tenantId?: string;
  siteId?: string;
}

export const ParticipantConsentSection: React.FC<ParticipantConsentSectionProps> = ({
  participantId,
  participantName,
  studyId,
  tenantId,
  siteId,
}) => {
  const [consents, setConsents] = useState<ConsentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const fetchConsents = useCallback(async () => {
    if (!participantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await participantApi.getConsents(participantId, { tenantId, siteId });
      setConsents(data);
    } catch (err: any) {
      console.error('Failed to load consents:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load consent records');
    } finally {
      setIsLoading(false);
    }
  }, [participantId, tenantId, siteId]);

  useEffect(() => {
    fetchConsents();
  }, [fetchConsents]);

  const handleConsentRecorded = (newConsent: ConsentItem) => {
    setConsents((prev) => [newConsent, ...prev.filter((c) => c.id !== newConsent.id)]);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONSENTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Consented
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Pending
          </span>
        );
      case 'DECLINED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> Declined
          </span>
        );
      case 'WITHDRAWN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300">
            <AlertCircle className="w-3 h-3 text-gray-500" /> Withdrawn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 p-6 space-y-4">
      {/* Header with Title and Actions */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Study Consents
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Active and historical consent records for {participantName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchConsents}
            disabled={isLoading}
            className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs text-gray-600"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsRecordModalOpen(true)}
            className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            Record Consent
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={fetchConsents} className="btn btn-ghost btn-sm text-red-700 hover:bg-red-100">
            Retry
          </button>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        {isLoading && consents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-2 text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            <p className="text-sm">Loading consent records...</p>
          </div>
        ) : consents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-medium text-gray-900">No consent records found</h4>
            <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4">
              There are no signed or recorded study consent forms for this participant yet.
            </p>
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(true)}
              className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Record First Consent
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3">Study</th>
                  <th scope="col" className="px-4 py-3">Consent Form / Version</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Consent Date</th>
                  <th scope="col" className="px-4 py-3">Method</th>
                  <th scope="col" className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {consents.map((consent) => (
                  <tr key={consent.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-gray-900">
                      {consent.studyName || 'Study'}
                    </td>
                    <td className="px-4 py-3.5 text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-gray-800">{consent.consentVersionTitle || 'Informed Consent Form'}</span>
                          {consent.versionNumber && (
                            <span className="ml-1.5 text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              v{consent.versionNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(consent.status)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-xs">
                      {formatDate(consent.consentedAt || consent.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-600">
                      <span className="capitalize">{consent.consentMethod?.toLowerCase() || 'Electronic'}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 max-w-xs truncate">
                      {consent.withdrawalReason ? (
                        <span className="text-red-600 italic" title={consent.withdrawalReason}>
                          Reason: {consent.withdrawalReason}
                        </span>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Consent Modal */}
      {isRecordModalOpen && (
        <RecordConsentModal
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          participantId={participantId}
          participantName={participantName}
          tenantId={tenantId}
          siteId={siteId}
          onConsentRecorded={handleConsentRecorded}
        />
      )}
    </div>
  );
};
