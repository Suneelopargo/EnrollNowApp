// frontend/microfrontends/participant/src/components/RecordConsentModal.tsx - Record Participant Consent Decision
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, Loader2 } from 'lucide-react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { participantApi, ConsentOptionItem, ConsentItem } from '../../../../shared/api/participantApi';

export interface RecordConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  participantName: string;
  tenantId?: string;
  siteId?: string;
  onConsentRecorded: (consent: ConsentItem) => void;
}

export const RecordConsentModal: React.FC<RecordConsentModalProps> = ({
  isOpen,
  onClose,
  participantId,
  participantName,
  tenantId,
  siteId,
  onConsentRecorded,
}) => {
  const [consentOptions, setConsentOptions] = useState<ConsentOptionItem[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [status, setStatus] = useState<string>('CONSENTED');
  const [consentDate, setConsentDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [consentMethod, setConsentMethod] = useState<string>('ELECTRONIC');
  const [withdrawalReason, setWithdrawalReason] = useState<string>('');

  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && participantId) {
      setIsLoadingOptions(true);
      participantApi
        .getConsentOptions(participantId, { tenantId, siteId })
        .then((opts) => {
          setConsentOptions(opts);
          if (opts.length > 0) {
            setSelectedOptionId(opts[0].consentVersionId);
          }
        })
        .catch((err) => {
          console.warn('Failed to load consent options:', err);
        })
        .finally(() => {
          setIsLoadingOptions(false);
        });
      setErrors({});
    }
  }, [isOpen, participantId, tenantId, siteId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const opt = consentOptions.find((o) => o.consentVersionId === selectedOptionId) || consentOptions[0];
    if (!opt) {
      setErrors({ option: 'Please select a study consent form' });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await participantApi.recordConsent(
        participantId,
        {
          studyId: opt.studyId,
          consentVersionId: opt.consentVersionId,
          status,
          consentDate: consentDate ? new Date(consentDate).toISOString() : new Date().toISOString(),
          consentMethod,
          withdrawalReason: status === 'WITHDRAWN' || status === 'DECLINED' ? withdrawalReason.trim() : undefined,
        },
        { tenantId, siteId }
      );

      toast.success(`Consent recorded as ${status}`);
      onConsentRecorded(created);
      onClose();
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to record consent');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Consent Decision — ${participantName}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="submit"
            form="recordConsentForm"
            className="btn btn-primary flex items-center gap-1.5"
            disabled={isSubmitting || isLoadingOptions}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Recording...
              </>
            ) : (
              <>
                <Check size={15} /> Save Consent Record
              </>
            )}
          </button>
        </div>
      }
    >
      <form id="recordConsentForm" onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {/* Consent Form Selector */}
        <div className="form-group" data-error={Boolean(errors.option)}>
          <label className="form-label font-semibold text-gray-700" htmlFor="consent-form-select">
            Study Consent Form <span className="text-red-500">*</span>
          </label>
          <select
            id="consent-form-select"
            value={selectedOptionId}
            onChange={(e) => setSelectedOptionId(e.target.value)}
            className="form-select"
            disabled={isLoadingOptions}
          >
            {consentOptions.map((opt) => (
              <option key={opt.consentVersionId} value={opt.consentVersionId}>
                {opt.studyName} — {opt.consentVersionTitle} ({opt.versionNumber})
              </option>
            ))}
          </select>
          {errors.option && <span className="text-red-500 text-xs block mt-1">{errors.option}</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Status */}
          <div className="form-group">
            <label className="form-label font-semibold text-gray-700" htmlFor="consent-status">
              Consent Status <span className="text-red-500">*</span>
            </label>
            <select
              id="consent-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="form-select"
            >
              <option value="CONSENTED">Consented (Agreed)</option>
              <option value="PENDING">Pending Review</option>
              <option value="DECLINED">Declined</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>

          {/* Consent Date */}
          <div className="form-group">
            <label className="form-label font-semibold text-gray-700" htmlFor="consent-date">
              Effective Date <span className="text-red-500">*</span>
            </label>
            <input
              id="consent-date"
              type="date"
              value={consentDate}
              onChange={(e) => setConsentDate(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        {/* Method */}
        <div className="form-group">
          <label className="form-label font-semibold text-gray-700" htmlFor="consent-method">
            Consent Method
          </label>
          <select
            id="consent-method"
            value={consentMethod}
            onChange={(e) => setConsentMethod(e.target.value)}
            className="form-select"
          >
            <option value="ELECTRONIC">Electronic e-Signature</option>
            <option value="PAPER">Physical Paper Form</option>
            <option value="VERBAL_RECORDED">Verbal Consent (Recorded/Witnessed)</option>
            <option value="HISTORICAL_IMPORT">Historical Registry Import</option>
          </select>
        </div>

        {/* Reason for withdrawal or decline */}
        {(status === 'WITHDRAWN' || status === 'DECLINED') && (
          <div className="form-group">
            <label className="form-label font-semibold text-gray-700" htmlFor="withdrawal-reason">
              Reason for {status === 'DECLINED' ? 'Decline' : 'Withdrawal'}
            </label>
            <textarea
              id="withdrawal-reason"
              rows={2}
              value={withdrawalReason}
              onChange={(e) => setWithdrawalReason(e.target.value)}
              placeholder="Participant requested revocation of data storage..."
              className="form-textarea text-xs"
            />
          </div>
        )}
      </form>
    </Modal>
  );
};
