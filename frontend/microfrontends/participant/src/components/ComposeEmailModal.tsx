// frontend/microfrontends/participant/src/components/ComposeEmailModal.tsx - Full Legacy Parity Compose and Send Email Modal
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Loader2,
  X,
  Plus,
  Paperclip,
  Star,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import EmailEditor from 'react-email-editor';
import type { Design, EditorRef, HtmlExport } from 'react-email-editor';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage, getStoredAuthUser } from '../../../../shared/api-client';
import { participantApi, CommunicationItem } from '../../../../shared/api/participantApi';
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
  label?: string;
}

interface EmailAttachment {
  fileName: string;
  fileSize?: number;
  fileUploadId?: string;
  fileContentBase64?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [toRecipients, setToRecipients] = useState<string[]>([]);
  const [newToInput, setNewToInput] = useState('');
  const [knownRecipients, setKnownRecipients] = useState<KnownRecipient[]>([]);

  const [ccRecipients, setCcRecipients] = useState<string[]>([]);
  const [newCcInput, setNewCcInput] = useState('');
  const [showCc, setShowCc] = useState(true);

  const [bccRecipients, setBccRecipients] = useState<string[]>([]);
  const [newBccInput, setNewBccInput] = useState('');
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

  // Attachments
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && participantId) {
      setIsEditorReady(false);
      setEditorError('');
      setCcRecipients([]);
      setBccRecipients([]);
      setShowCc(true);
      setShowBcc(true);
      setShowReplyTo(true);
      setToRecipients([]);
      setNewToInput('');
      setKnownRecipients([]);
      setNewCcInput('');
      setNewBccInput('');
      setSenderName(defaultSenderName);
      setIsLoadingRecipients(true);
      Promise.allSettled([
        participantApi.getEmailRecipients(participantId, { tenantId, siteId }),
        participantApi.getContacts(participantId, { tenantId, siteId }),
      ])
        .then(([emailsRes, contactsRes]) => {
          const directEmails = emailsRes.status === 'fulfilled' && Array.isArray(emailsRes.value) ? emailsRes.value : [];
          const contacts = contactsRes.status === 'fulfilled' && Array.isArray(contactsRes.value) ? contactsRes.value : [];

          const known: KnownRecipient[] = [];
          contacts.forEach((c: any) => {
            if (c.email && !known.some((k) => k.email.toLowerCase() === c.email.toLowerCase())) {
              known.push({
                email: c.email,
                isPreferred: !!c.preferred,
                label: c.relationshipType ? `${c.firstName || ''} (${c.relationshipType})` : undefined,
              });
            }
          });

          directEmails.forEach((e: string) => {
            if (!known.some((k) => k.email.toLowerCase() === e.toLowerCase())) {
              known.push({ email: e });
            }
          });

          setKnownRecipients(known);
        })
        .catch((err) => {
          console.warn('Failed to load email recipients:', err);
        })
        .finally(() => {
          setIsLoadingRecipients(false);
        });

      setSubject('');
      setReplyTo('');
      setAttachments([]);
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

  const handleAddRecipient = (
    type: 'TO' | 'CC' | 'BCC',
    val: string,
    setVal: React.Dispatch<React.SetStateAction<string>>,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (!EMAIL_REGEX.test(trimmed)) {
      setErrors((prev) => ({ ...prev, [type.toLowerCase()]: 'Email is not valid.' }));
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next[type.toLowerCase()];
      return next;
    });
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

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = typeof reader.result === 'string' ? reader.result.split(',')[1] : '';
        setAttachments((prev) => [
          ...prev,
          {
            fileName: file.name,
            fileSize: file.size,
            fileContentBase64: base64,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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

    let effectiveTo = [...toRecipients];
    if (newToInput.trim()) {
      if (!EMAIL_REGEX.test(newToInput.trim())) {
        newErrors.to = 'Email is not valid.';
      } else if (!effectiveTo.includes(newToInput.trim())) {
        effectiveTo.push(newToInput.trim());
      }
    }

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
    ccRecipients.forEach((em) => {
      if (!EMAIL_REGEX.test(em)) newErrors.cc = 'Email is not valid.';
      allEmails.push(em.trim().toLowerCase());
    });
    bccRecipients.forEach((em) => {
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
          cc: ccRecipients.length > 0 ? ccRecipients : undefined,
          bcc: bccRecipients.length > 0 ? bccRecipients : undefined,
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
          attachments: attachments.map((a) => ({
            fileName: a.fileName,
            fileUploadId: a.fileUploadId,
            fileContentBase64: a.fileContentBase64,
          })),
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
      title={`Add Participant Email — ${participantName}`}
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
      <form id="composeEmailForm" onSubmit={handleSend} className="space-y-3.5 text-xs">
        {errors.generic && (
          <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errors.generic}</span>
          </div>
        )}

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
              {!showReplyTo && (
                <button type="button" onClick={() => setShowReplyTo(true)} className="hover:underline">
                  + Reply-To
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
                  aria-label={`Remove ${email}`}
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

          {/* Known participant emails with preferred star */}
          {knownRecipients.length > 0 && (
            <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[11px] text-gray-500">
              <span>Participant emails:</span>
              {knownRecipients.map((item) => {
                const isSelected = toRecipients.includes(item.email);
                return (
                  <button
                    key={item.email}
                    type="button"
                    onClick={() => {
                      if (!isSelected) setToRecipients([...toRecipients, item.email]);
                    }}
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-100 text-blue-800 cursor-default'
                        : 'bg-gray-100 text-blue-600 hover:bg-gray-200 cursor-pointer'
                    }`}
                  >
                    {item.isPreferred && <Star size={10} className="fill-amber-400 text-amber-500" />}
                    <span>{item.email}</span>
                    {item.label && <span className="text-gray-400">· {item.label}</span>}
                  </button>
                );
              })}
            </div>
          )}
          {isLoadingRecipients && (
            <span className="mt-1 block text-[11px] text-gray-500">Loading participant email addresses...</span>
          )}

          {errors.to && <span className="text-red-500 text-xs block mt-1">{errors.to}</span>}
        </div>

        {/* CC */}
        {showCc && (
          <div className="form-group" data-error={Boolean(errors.cc)}>
            <div className="flex items-center justify-between mb-1">
              <label className="form-label font-semibold text-gray-700" htmlFor="cc-input">
                CC
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowCc(false);
                  setCcRecipients([]);
                }}
                className="text-[11px] text-gray-400 hover:text-gray-600"
              >
                Hide
              </button>
            </div>
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
                    aria-label={`Remove ${email}`}
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
            {errors.cc && <span className="text-red-500 text-xs block mt-1">{errors.cc}</span>}
          </div>
        )}

        {/* BCC */}
        {showBcc && (
          <div className="form-group" data-error={Boolean(errors.bcc)}>
            <div className="flex items-center justify-between mb-1">
              <label className="form-label font-semibold text-gray-700" htmlFor="bcc-input">
                BCC
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowBcc(false);
                  setBccRecipients([]);
                }}
                className="text-[11px] text-gray-400 hover:text-gray-600"
              >
                Hide
              </button>
            </div>
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
                    aria-label={`Remove ${email}`}
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
            {errors.bcc && <span className="text-red-500 text-xs block mt-1">{errors.bcc}</span>}
          </div>
        )}

        {/* Reply-To Address */}
        {showReplyTo && (
          <div className="form-group" data-error={Boolean(errors.replyTo)}>
            <div className="flex items-center justify-between mb-1">
              <label className="form-label font-semibold text-gray-700" htmlFor="reply-to-input">
                Reply To Address
              </label>
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
        )}

        <div className="space-y-3">
          <div className="form-group" data-error={Boolean(errors.senderName)}>
            <label className="form-label font-semibold text-gray-700" htmlFor="sender-name">
              Sender Name <span className="text-red-500">*</span>
            </label>
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

        {/* Drag-and-drop email builder */}
        <div className="form-group" data-error={Boolean(errors.body)}>
          <div className="flex items-center justify-between mb-1">
            <label className="form-label font-semibold text-gray-700">
              Message <span className="text-red-500">*</span>
            </label>
          </div>
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

        {/* Attachments Section */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-gray-700 flex items-center gap-1">
              <Paperclip size={13} /> Attachments
            </span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFilesSelected}
              multiple
              className="hidden"
              id="email-file-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
            >
              <Plus size={11} /> Attach Files
            </button>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-1 p-2 bg-gray-50 border rounded-md">
              {attachments.map((att, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-gray-700">
                  <span className="flex items-center gap-1.5 truncate max-w-sm">
                    <Paperclip size={12} className="text-gray-400" />
                    <span className="font-medium truncate">{att.fileName}</span>
                    {att.fileSize && (
                      <span className="text-[10px] text-gray-400">({formatFileSize(att.fileSize)})</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(idx)}
                    className="text-gray-400 hover:text-red-600 p-0.5"
                    aria-label={`Remove attachment ${att.fileName}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mark Email As (Matching Legacy Ripple Checkboxes) */}
        <div className="pt-2 border-t border-gray-200">
          <span className="font-semibold text-gray-700 block mb-1.5">Mark Email As:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            {/* Contact */}
            <label
              className="flex items-center gap-2 cursor-pointer text-gray-700 custom-tooltip-btn"
              data-tooltip="Mark as 'Date of Last Contact' for participant."
            >
              <input
                type="checkbox"
                checked={lastContact}
                onChange={(e) => setLastContact(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
              />
              <span>Contact</span>
            </label>

            {/* Pin Email */}
            <label
              className="flex items-center gap-2 cursor-pointer text-gray-700 custom-tooltip-btn"
              data-tooltip="Pin current email to top of list."
            >
              <input
                type="checkbox"
                checked={sticky}
                onChange={(e) => setSticky(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
              />
              <span>Pin Email</span>
            </label>

            {/* Global */}
            <label
              className="flex items-center gap-2 cursor-pointer text-gray-700 custom-tooltip-btn"
              data-tooltip="Save contact log to global registry data."
            >
              <input
                type="checkbox"
                checked={globalEmail}
                onChange={(e) => setGlobalEmail(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
              />
              <span>Global</span>
            </label>

            <label
              className="flex items-center gap-2 cursor-pointer text-gray-700 custom-tooltip-btn"
              data-tooltip="Notify the participant about this email."
            >
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
              />
              <span>Notify</span>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ComposeEmailModal;
