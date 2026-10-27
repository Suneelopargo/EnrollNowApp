// frontend/microfrontends/participant/src/components/ComposeEmailModal.tsx - Compose and Send Real Email
import React, { useState, useEffect } from 'react';
import { Mail, Send, Loader2, X, Plus } from 'lucide-react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { participantApi, CommunicationItem } from '../../../../shared/api/participantApi';

export interface ComposeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  participantName: string;
  studyId?: string;
  tenantId?: string;
  siteId?: string;
  onEmailSent: (email: CommunicationItem) => void;
}

export const ComposeEmailModal: React.FC<ComposeEmailModalProps> = ({
  isOpen,
  onClose,
  participantId,
  participantName,
  studyId,
  tenantId,
  siteId,
  onEmailSent,
}) => {
  const [toRecipients, setToRecipients] = useState<string[]>([]);
  const [newToInput, setNewToInput] = useState('');
  const [availableRecipients, setAvailableRecipients] = useState<string[]>([]);

  const [ccRecipients, setCcRecipients] = useState<string[]>([]);
  const [newCcInput, setNewCcInput] = useState('');
  const [showCc, setShowCc] = useState(false);

  const [bccRecipients, setBccRecipients] = useState<string[]>([]);
  const [newBccInput, setNewBccInput] = useState('');
  const [showBcc, setShowBcc] = useState(false);

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);

  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && participantId) {
      setIsLoadingRecipients(true);
      participantApi
        .getEmailRecipients(participantId, { tenantId, siteId })
        .then((emails) => {
          setAvailableRecipients(emails);
          if (emails.length > 0) {
            setToRecipients([emails[0]]);
          }
        })
        .catch((err) => {
          console.warn('Failed to load email recipients:', err);
        })
        .finally(() => {
          setIsLoadingRecipients(false);
        });

      setSubject('');
      setBody('');
      setPinned(false);
      setErrors({});
    }
  }, [isOpen, participantId, tenantId, siteId]);

  if (!isOpen) return null;

  const handleAddRecipient = (
    type: 'TO' | 'CC' | 'BCC',
    val: string,
    setVal: React.Dispatch<React.SetStateAction<string>>,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (!list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
    setVal('');
  };

  const handleRemoveRecipient = (
    email: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList(list.filter((e) => e !== email));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    let effectiveTo = [...toRecipients];
    if (newToInput.trim() && !effectiveTo.includes(newToInput.trim())) {
      effectiveTo.push(newToInput.trim());
    }

    if (effectiveTo.length === 0) {
      newErrors.to = 'At least one recipient (To) is required';
    }
    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    if (!body.trim()) {
      newErrors.body = 'Email body is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSending(true);
    try {
      const sent = await participantApi.sendEmail(
        participantId,
        {
          to: effectiveTo,
          cc: ccRecipients,
          bcc: bccRecipients,
          subject: subject.trim(),
          body: body.trim(),
          pinned,
          studyId: studyId?.trim() || undefined,
        },
        { tenantId, siteId }
      );

      toast.success('Email sent successfully');
      onEmailSent(sent);
      onClose();
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to send email');
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Compose Email — ${participantName}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSending}>
            Cancel
          </button>
          <button
            type="submit"
            form="composeEmailForm"
            className="btn btn-primary flex items-center gap-1.5"
            disabled={isSending}
          >
            {isSending ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Sending...
              </>
            ) : (
              <>
                <Send size={15} /> Send Email
              </>
            )}
          </button>
        </div>
      }
    >
      <form id="composeEmailForm" onSubmit={handleSend} className="space-y-3.5 text-xs">
        {/* To Recipients */}
        <div className="form-group" data-error={Boolean(errors.to)}>
          <div className="flex items-center justify-between mb-1">
            <label className="form-label font-semibold text-gray-700" htmlFor="to-input">
              To <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2 text-[11px] text-blue-600">
              {!showCc && (
                <button type="button" onClick={() => setShowCc(true)} className="hover:underline">
                  + CC
                </button>
              )}
              {!showBcc && (
                <button type="button" onClick={() => setShowBcc(true)} className="hover:underline">
                  + BCC
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-2 border rounded-md bg-white min-h-[38px]">
            {toRecipients.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs"
              >
                {email}
                <button
                  type="button"
                  onClick={() => handleRemoveRecipient(email, toRecipients, setToRecipients)}
                  className="hover:text-red-600"
                >
                  <X size={12} />
                </button>
              </span>
            ))}

            <input
              id="to-input"
              type="email"
              value={newToInput}
              onChange={(e) => setNewToInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  handleAddRecipient('TO', newToInput, setNewToInput, toRecipients, setToRecipients);
                }
              }}
              placeholder={toRecipients.length === 0 ? 'Enter recipient email...' : 'Add another...'}
              className="flex-1 min-w-[140px] border-none outline-none text-xs p-0 focus:ring-0"
            />
          </div>

          {availableRecipients.length > 0 && (
            <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[11px] text-gray-500">
              <span>Known participant emails:</span>
              {availableRecipients.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => {
                    if (!toRecipients.includes(em)) setToRecipients([...toRecipients, em]);
                  }}
                  className="text-blue-600 hover:underline"
                >
                  {em}
                </button>
              ))}
            </div>
          )}

          {errors.to && <span className="text-red-500 text-xs block mt-1">{errors.to}</span>}
        </div>

        {/* CC */}
        {showCc && (
          <div className="form-group">
            <label className="form-label font-semibold text-gray-700" htmlFor="cc-input">CC</label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 border rounded-md bg-white min-h-[38px]">
              {ccRecipients.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(email, ccRecipients, setCcRecipients)}
                    className="hover:text-red-600"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                id="cc-input"
                type="email"
                value={newCcInput}
                onChange={(e) => setNewCcInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    handleAddRecipient('CC', newCcInput, setNewCcInput, ccRecipients, setCcRecipients);
                  }
                }}
                placeholder="Enter CC email..."
                className="flex-1 min-w-[140px] border-none outline-none text-xs p-0 focus:ring-0"
              />
            </div>
          </div>
        )}

        {/* BCC */}
        {showBcc && (
          <div className="form-group">
            <label className="form-label font-semibold text-gray-700" htmlFor="bcc-input">BCC</label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 border rounded-md bg-white min-h-[38px]">
              {bccRecipients.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(email, bccRecipients, setBccRecipients)}
                    className="hover:text-red-600"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                id="bcc-input"
                type="email"
                value={newBccInput}
                onChange={(e) => setNewBccInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    handleAddRecipient('BCC', newBccInput, setNewBccInput, bccRecipients, setBccRecipients);
                  }
                }}
                placeholder="Enter BCC email..."
                className="flex-1 min-w-[140px] border-none outline-none text-xs p-0 focus:ring-0"
              />
            </div>
          </div>
        )}

        {/* Subject */}
        <div className="form-group" data-error={Boolean(errors.subject)}>
          <label className="form-label font-semibold text-gray-700" htmlFor="email-subject">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            id="email-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Study Screening Confirmation"
            className={`form-input ${errors.subject ? 'border-red-500' : ''}`}
          />
          {errors.subject && <span className="text-red-500 text-xs block mt-1">{errors.subject}</span>}
        </div>

        {/* Message Body */}
        <div className="form-group" data-error={Boolean(errors.body)}>
          <label className="form-label font-semibold text-gray-700" htmlFor="email-body">
            Message Body <span className="text-red-500">*</span>
          </label>
          <textarea
            id="email-body"
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Compose your secure communication message..."
            className={`form-textarea text-xs ${errors.body ? 'border-red-500' : ''}`}
          />
          {errors.body && <span className="text-red-500 text-xs block mt-1">{errors.body}</span>}
        </div>

        {/* Pin Checkbox */}
        <div className="pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300"
            />
            <span>Pin this email to top of communication history</span>
          </label>
        </div>
      </form>
    </Modal>
  );
};
