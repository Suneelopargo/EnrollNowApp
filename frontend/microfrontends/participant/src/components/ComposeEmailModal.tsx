// frontend/microfrontends/participant/src/components/ComposeEmailModal.tsx - Full Legacy Parity Compose and Send Email Modal
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Loader2,
  X,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import EmailEditor from 'react-email-editor';
import type { Design, EditorRef, HtmlExport } from 'react-email-editor';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { TooltipButton } from '../../../../shared/design-system/components/TooltipButton';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage, getStoredAuthUser } from '../../../../shared/api-client';
import {
  participantApi,
  CommunicationItem,
  ParticipantContactDetail,
} from '../../../../shared/api/participantApi';
import type { AuthUser } from '../../../../shared/contracts';

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

interface KnownRecipient {
  email: string;
  isPreferred?: boolean;
  contactName?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const mapEmailRecipientOptions = (
  contacts: Array<Pick<ParticipantContactDetail, 'contactType' | 'contactValue' | 'contactName' | 'active' | 'isPreferred'>>,
  directEmails: string[],
): KnownRecipient[] => {
  const recipients = new Map<string, KnownRecipient>();

  contacts.forEach((contact) => {
    const email = contact.contactValue.trim();
    if (!contact.active || contact.contactType.toUpperCase() !== 'EMAIL' || !email) return;
    const key = email.toLowerCase();
    const existing = recipients.get(key);
    recipients.set(key, {
      email,
      contactName: contact.contactName?.trim() || existing?.contactName,
      isPreferred: Boolean(contact.isPreferred || existing?.isPreferred),
    });
  });

  directEmails.forEach((value) => {
    const email = value.trim();
    if (!email) return;
    const key = email.toLowerCase();
    if (!recipients.has(key)) recipients.set(key, { email });
  });

  return Array.from(recipients.values());
};

export const formatEmailRecipientOption = (recipient: KnownRecipient): string =>
  recipient.contactName ? `${recipient.email} (${recipient.contactName})` : recipient.email;

interface EmailRecipientInputProps {
  id: string;
  label: string;
  value: string;
  options: KnownRecipient[];
  placeholder: string;
  hasError: boolean;
  onChange: (value: string) => void;
}

const EmailRecipientInput: React.FC<EmailRecipientInputProps> = ({
  id,
  label,
  value,
  options,
  placeholder,
  hasError,
  onChange,
}) => {
  const listId = `${id}-options`;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      style={{ position: 'relative', width: '100%' }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsOpen(false);
      }}
    >
      <input
        id={id}
        type="email"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsOpen(options.length > 0)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && options.length > 0) setIsOpen(true);
          if (event.key === 'Escape') setIsOpen(false);
        }}
        placeholder={placeholder}
        className={`form-input ${hasError ? 'border-red-500' : ''}`}
        style={{ paddingRight: 40 }}
        aria-label={label}
        aria-invalid={hasError}
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listId}
        role="combobox"
        autoComplete="off"
      />
      <TooltipButton
        label={`Choose another email for ${label}`}
        onClick={() => setIsOpen((open) => !open)}
        disabled={options.length === 0}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
        className="text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <ChevronDown size={16} aria-hidden="true" />
      </TooltipButton>
      {isOpen && options.length > 0 && (
        <div
          id={listId}
          role="listbox"
          aria-label={`${label} options`}
          className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          style={{ position: 'absolute', zIndex: 50, top: '100%', left: 0 }}
        >
          {options.map((option) => (
            <button
              key={option.email.toLowerCase()}
              type="button"
              role="option"
              aria-selected={value.toLowerCase() === option.email.toLowerCase()}
              onClick={() => {
                onChange(option.email);
                setIsOpen(false);
              }}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
            >
              <span className="min-w-0 truncate">{formatEmailRecipientOption(option)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const isEmailDesignEmpty = (design: Design): boolean => {
  const rows = Array.isArray(design.body?.rows) ? design.body.rows : [];

  return !rows.some((row) => {
    if (!row || typeof row !== 'object') return false;
    const columns = (row as Record<string, unknown>).columns;
    if (!Array.isArray(columns)) return false;

    return columns.some((column) => {
      if (!column || typeof column !== 'object') return false;
      const contents = (column as Record<string, unknown>).contents;
      return Array.isArray(contents) && contents.length > 0;
    });
  });
};

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
  const [toRecipient, setToRecipient] = useState('');
  const [knownRecipients, setKnownRecipients] = useState<KnownRecipient[]>([]);

  const [ccRecipient, setCcRecipient] = useState('');
  const [showCc, setShowCc] = useState(true);

  const [bccRecipient, setBccRecipient] = useState('');
  const [showBcc, setShowBcc] = useState(true);

  const [replyTo, setReplyTo] = useState('');
  const [showReplyTo, setShowReplyTo] = useState(true);

  const storedUser = getStoredAuthUser<AuthUser>();
  const defaultSenderName = storedUser?.fullName ||
    [storedUser?.firstName, storedUser?.lastName].filter(Boolean).join(' ') ||
    'Study Coordinator';
  const [senderName, setSenderName] = useState(defaultSenderName);
  const [subject, setSubject] = useState('');
  const emailEditorRef = useRef<EditorRef | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [editorError, setEditorError] = useState('');

  // Mark Email As flags (matching legacy Ripple)
  const [lastContact, setLastContact] = useState(true);
  const [sticky, setSticky] = useState(false);
  const [globalEmail, setGlobalEmail] = useState(true);
  const [notify, setNotify] = useState(false);

  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && participantId) {
      setIsEditorReady(false);
      setEditorError('');
      setCcRecipient('');
      setBccRecipient('');
      setShowCc(true);
      setShowBcc(true);
      setShowReplyTo(true);
      setToRecipient('');
      setKnownRecipients([]);
      setSenderName(defaultSenderName);
      setIsLoadingRecipients(true);
      Promise.allSettled([
        participantApi.getEmailRecipients(participantId, { tenantId, siteId }),
        participantApi.getContacts(participantId, { tenantId, siteId }),
      ])
        .then(([emailsRes, contactsRes]) => {
          const directEmails = emailsRes.status === 'fulfilled' && Array.isArray(emailsRes.value) ? emailsRes.value : [];
          const contacts = contactsRes.status === 'fulfilled' && Array.isArray(contactsRes.value)
            ? contactsRes.value
            : [];
          setKnownRecipients(mapEmailRecipientOptions(contacts, directEmails));
        })
        .catch((err) => {
          console.warn('Failed to load email recipients:', err);
        })
        .finally(() => {
          setIsLoadingRecipients(false);
        });

      setSubject('');
      setReplyTo('');
      setLastContact(true);
      setSticky(false);
      setGlobalEmail(true);
      setNotify(false);
      setErrors({});
    }
  }, [isOpen, participantId, tenantId, siteId, defaultSenderName]);

  useEffect(() => {
    if (!isOpen || isEditorReady) return;
    const timeoutId = window.setTimeout(() => {
      setEditorError('The email designer could not load. Check your connection, then close and reopen this window.');
    }, 30000);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, isEditorReady]);

  const handleEditorReady = useCallback(() => {
    const editor = emailEditorRef.current?.editor;
    if (!editor) return;
    try {
      editor.loadBlank({});
      setEditorError('');
      setIsEditorReady(true);
    } catch {
      setEditorError('The email designer could not be initialized. Close and reopen this window to try again.');
    }
  }, []);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending) return;
    const newErrors: Record<string, string> = {};

    const effectiveTo = toRecipient.trim() ? [toRecipient.trim()] : [];
    const effectiveCc = ccRecipient.trim() ? [ccRecipient.trim()] : [];
    const effectiveBcc = bccRecipient.trim() ? [bccRecipient.trim()] : [];

    if (effectiveTo.length === 0) {
      newErrors.to = 'To is required';
    }
    if (!senderName.trim()) {
      newErrors.senderName = 'Sender Name is required';
    }
    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    // Check invalid emails across all inputs
    const allEmails: string[] = [];
    effectiveTo.forEach((em) => {
      if (!EMAIL_REGEX.test(em)) newErrors.to = 'Email is not valid.';
      allEmails.push(em.trim().toLowerCase());
    });
    effectiveCc.forEach((em) => {
      if (!EMAIL_REGEX.test(em)) newErrors.cc = 'Email is not valid.';
      allEmails.push(em.trim().toLowerCase());
    });
    effectiveBcc.forEach((em) => {
      if (!EMAIL_REGEX.test(em)) newErrors.bcc = 'Email is not valid.';
      allEmails.push(em.trim().toLowerCase());
    });
    if (replyTo.trim()) {
      if (!EMAIL_REGEX.test(replyTo.trim())) {
        newErrors.replyTo = 'Email is not valid.';
      }
      allEmails.push(replyTo.trim().toLowerCase());
    }

    // Uniqueness across to, cc, bcc, and replyTo (matching legacy Ripple)
    const uniqueEmails = new Set(allEmails);
    if (uniqueEmails.size !== allEmails.length) {
      newErrors.generic = 'Each email address should be unique between to, cc, bcc, and reply to.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.generic) {
        toast.error(newErrors.generic);
      }
      return;
    }

    const editor = emailEditorRef.current?.editor;
    if (!isEditorReady || !editor) {
      setErrors({ body: editorError || 'The email editor is still loading. Please wait and try again.' });
      return;
    }

    setErrors({});
    setIsSending(true);
    try {
      const { html, design } = await new Promise<HtmlExport>((resolve) => {
        editor.exportHtml(resolve);
      });
      if (!html.trim() || isEmailDesignEmpty(design)) {
        setErrors({ body: 'Message is required' });
        return;
      }

      const sent = await participantApi.sendEmail(
        participantId,
        {
          to: effectiveTo,
          cc: effectiveCc.length > 0 ? effectiveCc : undefined,
          bcc: effectiveBcc.length > 0 ? effectiveBcc : undefined,
          replyTo: replyTo.trim() || undefined,
          senderName: senderName.trim(),
          subject: subject.trim(),
          body: html.trim(),
          design: JSON.stringify(design),
          pinned: sticky,
          sticky,
          studyId: studyId?.trim() || undefined,
          lastContact,
          global: globalEmail,
          notify,
          messageIsHtml: true,
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
      title="Add Participant Email"
      size="wide"
      footer={
        <div className="flex items-center justify-between w-full">
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSending}>
            Cancel
          </button>
          <button
            type="submit"
            form="composeEmailForm"
            className="btn btn-primary flex items-center gap-1.5"
            disabled={isSending || !isEditorReady}
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
      <form id="composeEmailForm" onSubmit={handleSend} className="compose-email-form space-y-3.5 text-xs">
        {errors.generic && (
          <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errors.generic}</span>
          </div>
        )}

        {/* To Recipients */}
        <div className="form-group compose-email-row" data-error={Boolean(errors.to)}>
          <label className="form-label compose-email-label font-semibold text-gray-700" htmlFor="to-input">
            To <span className="text-red-500">*</span>
          </label>
          <div className="compose-email-control">
            <div className="flex items-center justify-end gap-2 mb-1 text-[11px] text-blue-600">
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
              {!showReplyTo && (
                <button type="button" onClick={() => setShowReplyTo(true)} className="hover:underline">
                  + Reply-To
                </button>
              )}
            </div>

            <EmailRecipientInput
              id="to-input"
              label="To recipient"
              value={toRecipient}
              onChange={setToRecipient}
              options={knownRecipients}
              placeholder="To"
              hasError={Boolean(errors.to)}
            />
            {isLoadingRecipients && (
              <span className="mt-1 block text-[11px] text-gray-500">Loading participant email addresses...</span>
            )}

            {errors.to && <span className="text-red-500 text-xs block mt-1">{errors.to}</span>}
          </div>
        </div>

        {/* CC */}
        {showCc && (
          <div className="form-group compose-email-row" data-error={Boolean(errors.cc)}>
            <label className="form-label compose-email-label font-semibold text-gray-700" htmlFor="cc-input">
              CC
            </label>
            <div className="compose-email-control">
              <div className="mb-1 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCc(false);
                  setCcRecipient('');
                }}
                className="text-[11px] text-gray-400 hover:text-gray-600"
              >
                Hide
              </button>
            </div>
            <EmailRecipientInput
              id="cc-input"
              label="CC recipient"
              value={ccRecipient}
              onChange={setCcRecipient}
              options={knownRecipients}
              placeholder="Cc"
              hasError={Boolean(errors.cc)}
            />
            {errors.cc && <span className="text-red-500 text-xs block mt-1">{errors.cc}</span>}
            </div>
          </div>
        )}

        {/* BCC */}
        {showBcc && (
          <div className="form-group compose-email-row" data-error={Boolean(errors.bcc)}>
            <label className="form-label compose-email-label font-semibold text-gray-700" htmlFor="bcc-input">
              BCC
            </label>
            <div className="compose-email-control">
              <div className="mb-1 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowBcc(false);
                  setBccRecipient('');
                }}
                className="text-[11px] text-gray-400 hover:text-gray-600"
              >
                Hide
              </button>
            </div>
            <EmailRecipientInput
                id="bcc-input"
                label="BCC recipient"
                value={bccRecipient}
                onChange={setBccRecipient}
                options={knownRecipients}
                placeholder="Bcc"
                hasError={Boolean(errors.bcc)}
              />
            {errors.bcc && <span className="text-red-500 text-xs block mt-1">{errors.bcc}</span>}
            </div>
          </div>
        )}

        {/* Reply-To Address */}
        {showReplyTo && (
          <div className="form-group compose-email-row" data-error={Boolean(errors.replyTo)}>
            <label className="form-label compose-email-label font-semibold text-gray-700" htmlFor="reply-to-input">
              Reply To Address
            </label>
            <div className="compose-email-control">
              <div className="mb-1 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowReplyTo(false);
                  setReplyTo('');
                }}
                className="text-[11px] text-gray-400 hover:text-gray-600"
              >
                Hide
              </button>
            </div>
            <input
              id="reply-to-input"
              type="email"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              placeholder="e.g. replies@study.org"
              className={`form-input ${errors.replyTo ? 'border-red-500' : ''}`}
            />
            {errors.replyTo && <span className="text-red-500 text-xs block mt-1">{errors.replyTo}</span>}
            </div>
          </div>
        )}

        <div className="form-group compose-email-row" data-error={Boolean(errors.senderName)}>
          <label className="form-label compose-email-label font-semibold text-gray-700" htmlFor="sender-name">
            Sender Name <span className="text-red-500">*</span>
          </label>
          <div className="compose-email-control">
            <input
              id="sender-name"
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. Dr. Jane Smith"
              className={`form-input ${errors.senderName ? 'border-red-500' : ''}`}
            />
            {errors.senderName && <span className="text-red-500 text-xs block mt-1">{errors.senderName}</span>}
          </div>
        </div>

        <div className="form-group compose-email-row" data-error={Boolean(errors.subject)}>
          <label className="form-label compose-email-label font-semibold text-gray-700" htmlFor="email-subject">
            Subject <span className="text-red-500">*</span>
          </label>
          <div className="compose-email-control">
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
        </div>

        {/* Drag-and-drop email builder */}
        <div className="form-group compose-email-row" data-error={Boolean(errors.body)}>
          <label className="form-label compose-email-label font-semibold text-gray-700">
            Message <span className="text-red-500">*</span>
          </label>
          <div className="compose-email-control">
            <div data-testid="email-design-editor" aria-label="Email message designer" className="relative overflow-hidden rounded-md border border-gray-200">
            {!isEditorReady && !editorError && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50 text-sm text-gray-500">
                Loading email designer...
              </div>
            )}
            <EmailEditor
              ref={emailEditorRef}
              minHeight={560}
              onReady={handleEditorReady}
              options={{ displayMode: 'email', appearance: { theme: 'light' } }}
            />
            </div>
            {editorError && <span className="text-red-600 text-xs block mt-1" role="alert">{editorError}</span>}
            {errors.body && <span className="text-red-500 text-xs block mt-1">{errors.body}</span>}
          </div>
        </div>

        {/* Mark Email As (Matching Legacy Ripple Checkboxes) */}
        <div className="compose-email-row mt-1 border-t border-slate-200 pt-3">
          <span className="font-semibold text-gray-700">Mark Email As:</span>
          <div className="flex flex-wrap items-center gap-5 text-xs">
            <label
              className="flex items-center gap-2 cursor-pointer text-gray-700"
              title="Pin current email to top of list."
            >
              <input
                type="checkbox"
                checked={sticky}
                onChange={(e) => setSticky(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
              />
              <span>Pin Email</span>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ComposeEmailModal;
