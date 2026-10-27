// frontend/microfrontends/participant/src/components/ComposeSmsModal.tsx - Compose and Send SMS Message
import React, { useState, useEffect } from 'react';
import { Phone, Send, Loader2 } from 'lucide-react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { participantApi, CommunicationItem } from '../../../../shared/api/participantApi';

export interface ComposeSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  participantName: string;
  studyId?: string;
  tenantId?: string;
  siteId?: string;
  onSmsSent: (sms: CommunicationItem) => void;
}

export const ComposeSmsModal: React.FC<ComposeSmsModalProps> = ({
  isOpen,
  onClose,
  participantId,
  participantName,
  studyId,
  tenantId,
  siteId,
  onSmsSent,
}) => {
  const [toPhone, setToPhone] = useState('');
  const [availablePhones, setAvailablePhones] = useState<string[]>([]);
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && participantId) {
      participantApi
        .getSmsRecipients(participantId, { tenantId, siteId })
        .then((phones) => {
          setAvailablePhones(phones);
          if (phones.length > 0) {
            setToPhone(phones[0]);
          } else {
            setToPhone('');
          }
        })
        .catch((err) => {
          console.warn('Failed to load SMS phones:', err);
        });

      setBody('');
      setErrors({});
    }
  }, [isOpen, participantId, tenantId, siteId]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!toPhone.trim()) {
      newErrors.toPhone = 'Recipient phone number is required';
    }
    if (!body.trim()) {
      newErrors.body = 'SMS message text cannot be empty';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSending(true);
    try {
      const sent = await participantApi.sendSms(
        participantId,
        {
          toPhone: toPhone.trim(),
          body: body.trim(),
          studyId: studyId?.trim() || undefined,
        },
        { tenantId, siteId }
      );

      toast.success('SMS sent successfully');
      onSmsSent(sent);
      onClose();
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to send SMS');
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Send SMS — ${participantName}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSending}>
            Cancel
          </button>
          <button
            type="submit"
            form="composeSmsForm"
            className="btn btn-primary flex items-center gap-1.5"
            disabled={isSending}
          >
            {isSending ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Sending...
              </>
            ) : (
              <>
                <Send size={15} /> Send SMS
              </>
            )}
          </button>
        </div>
      }
    >
      <form id="composeSmsForm" onSubmit={handleSend} className="space-y-3.5 text-xs">
        {/* Recipient Phone */}
        <div className="form-group" data-error={Boolean(errors.toPhone)}>
          <label className="form-label font-semibold text-gray-700" htmlFor="sms-phone">
            Recipient Mobile Phone <span className="text-red-500">*</span>
          </label>
          <input
            id="sms-phone"
            type="tel"
            value={toPhone}
            onChange={(e) => setToPhone(e.target.value)}
            placeholder="e.g. +1 (215) 555-0199"
            className={`form-input ${errors.toPhone ? 'border-red-500' : ''}`}
          />

          {availablePhones.length > 0 && (
            <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[11px] text-gray-500">
              <span>Known participant numbers:</span>
              {availablePhones.map((ph) => (
                <button
                  key={ph}
                  type="button"
                  onClick={() => setToPhone(ph)}
                  className="text-blue-600 hover:underline"
                >
                  {ph}
                </button>
              ))}
            </div>
          )}

          {errors.toPhone && <span className="text-red-500 text-xs block mt-1">{errors.toPhone}</span>}
        </div>

        {/* Message Body */}
        <div className="form-group" data-error={Boolean(errors.body)}>
          <div className="flex items-center justify-between mb-1">
            <label className="form-label font-semibold text-gray-700" htmlFor="sms-body">
              Text Message <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-gray-400">{body.length} / 160 chars</span>
          </div>

          <textarea
            id="sms-body"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type SMS notification or reminder message..."
            className={`form-textarea text-xs ${errors.body ? 'border-red-500' : ''}`}
          />
          {errors.body && <span className="text-red-500 text-xs block mt-1">{errors.body}</span>}
        </div>
      </form>
    </Modal>
  );
};
