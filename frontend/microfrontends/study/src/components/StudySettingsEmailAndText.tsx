// frontend/microfrontends/study/src/components/StudySettingsEmailAndText.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  studyApi,
  StudyEmailTemplate,
  StudyTextTemplate,
  StudyScheduledAction,
  StudyEventOption,
  StudyEmailTextSettingsData,
  SaveEmailTemplatePayload,
  SaveTextTemplatePayload,
} from '../../../../shared/api/studyApi';
import {
  Mail,
  MessageSquare,
  Plus,
  Trash2,
  Copy,
  Archive,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  Clock,
  ExternalLink,
} from 'lucide-react';

export interface StudySettingsEmailAndTextProps {
  studyId: string;
  studyName?: string;
  isArchived?: boolean;
  canManageSettings?: boolean;
  onStudyUpdated?: () => void;
}

export type EmailFilterOption = 'Active Emails' | 'Archived Emails' | 'All Emails';
export type TextFilterOption = 'Active Texts' | 'Archived Texts' | 'All Texts';

export const MAX_SMS_LENGTH = 1600;

export const STANDARD_MERGE_TAGS = [
  { label: 'First Name', tag: '{{firstName}}' },
  { label: 'Last Name', tag: '{{lastName}}' },
  { label: 'Participant ID', tag: '{{customId}}' },
  { label: 'Study Name', tag: '{{studyName}}' },
  { label: 'Next Appt Date', tag: '{{event_date}}' },
  { label: 'Next Appt Name', tag: '{{event_name}}' },
];

/**
 * Checks message content for broken merge tag syntax or unmatched brackets.
 */
export function checkMessageForBrokenMergeTags(msg?: string | null): string | null {
  if (!msg) return null;

  // Check for unmatched open or close braces
  const openCount = (msg.match(/{{/g) || []).length;
  const closeCount = (msg.match(/}}/g) || []).length;
  if (openCount !== closeCount) {
    return 'Unmatched merge tag brackets';
  }

  // Check for broken empty merge tags {{}}
  if (/{{[\s]*}}/.test(msg)) {
    return 'Empty merge tag detected';
  }

  // Check for invalid characters inside tags
  const tags = msg.match(/{{([^{}]+)}}/g);
  if (tags) {
    for (const tag of tags) {
      const inner = tag.slice(2, -2).trim();
      if (!inner || /[^a-zA-Z0-9_.-]/.test(inner)) {
        return `Invalid tag syntax: ${tag}`;
      }
    }
  }

  return null;
}

export const StudySettingsEmailAndText: React.FC<StudySettingsEmailAndTextProps> = ({
  studyId,
  isArchived = false,
  canManageSettings = true,
  onStudyUpdated,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  const [emailTemplates, setEmailTemplates] = useState<StudyEmailTemplate[]>([]);
  const [textTemplates, setTextTemplates] = useState<StudyTextTemplate[]>([]);
  const [studyEvents, setStudyEvents] = useState<StudyEventOption[]>([]);
  const [textMessagingEnabled, setTextMessagingEnabled] = useState<boolean>(true);
  const [serverCanManage, setServerCanManage] = useState<boolean>(true);

  // Filters
  const [emailFilter, setEmailFilter] = useState<EmailFilterOption>('Active Emails');
  const [textFilter, setTextFilter] = useState<TextFilterOption>('Active Texts');

  // Email Template Modal state
  const [emailModalOpen, setEmailModalOpen] = useState<boolean>(false);
  const [editingEmail, setEditingEmail] = useState<StudyEmailTemplate | null>(null);
  const [emailName, setEmailName] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailDescription, setEmailDescription] = useState<string>('');
  const [emailReplyTo, setEmailReplyTo] = useState<string>('');
  const [emailSenderName, setEmailSenderName] = useState<string>('');
  const [emailMessage, setEmailMessage] = useState<string>('');
  const [emailScheduleEnabled, setEmailScheduleEnabled] = useState<boolean>(false);
  const [emailScheduleTriggerType, setEmailScheduleTriggerType] = useState<'event' | 'variable'>('event');
  const [emailScheduleTriggerId, setEmailScheduleTriggerId] = useState<string>('');
  const [emailScheduleInterval, setEmailScheduleInterval] = useState<number>(1);
  const [emailScheduleUnit, setEmailScheduleUnit] = useState<string>('days');
  const [emailScheduleBeforeAfter, setEmailScheduleBeforeAfter] = useState<string>('before');
  const [emailScheduleDateType, setEmailScheduleDateType] = useState<string>('scheduled');
  const [emailModalError, setEmailModalError] = useState<string | null>(null);

  // Text Template Modal state
  const [textModalOpen, setTextModalOpen] = useState<boolean>(false);
  const [editingText, setEditingText] = useState<StudyTextTemplate | null>(null);
  const [textName, setTextName] = useState<string>('');
  const [textDescription, setTextDescription] = useState<string>('');
  const [textMessage, setTextMessage] = useState<string>('');
  const [textScheduleEnabled, setTextScheduleEnabled] = useState<boolean>(false);
  const [textScheduleTriggerType, setTextScheduleTriggerType] = useState<'event' | 'variable'>('event');
  const [textScheduleTriggerId, setTextScheduleTriggerId] = useState<string>('');
  const [textScheduleInterval, setTextScheduleInterval] = useState<number>(1);
  const [textScheduleUnit, setTextScheduleUnit] = useState<string>('days');
  const [textScheduleBeforeAfter, setTextScheduleBeforeAfter] = useState<string>('before');
  const [textScheduleDateType, setTextScheduleDateType] = useState<string>('scheduled');
  const [textModalError, setTextModalError] = useState<string | null>(null);

  // Confirm Modal state (Archive, Restore, Delete)
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<'archive' | 'restore' | 'delete' | null>(null);
  const [confirmKind, setConfirmKind] = useState<'email' | 'text' | null>(null);
  const [targetTemplate, setTargetTemplate] = useState<StudyEmailTemplate | StudyTextTemplate | null>(null);

  const emailTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const textTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const effectiveCanManage = canManageSettings && !isArchived && serverCanManage;

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data: StudyEmailTextSettingsData = await studyApi.getStudyEmailTextSettings(studyId);
      setEmailTemplates(data.emailTemplates || []);
      setTextTemplates(data.textTemplates || []);
      setStudyEvents(data.events || []);
      setTextMessagingEnabled(data.textMessagingEnabled ?? true);
      setServerCanManage(data.canManage ?? true);
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to load email and text templates.');
    } finally {
      setLoading(false);
    }
  }, [studyId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Filtered lists
  const filteredEmailTemplates = useMemo(() => {
    if (emailFilter === 'Active Emails') {
      return emailTemplates.filter((t) => !t.archived);
    }
    if (emailFilter === 'Archived Emails') {
      return emailTemplates.filter((t) => t.archived);
    }
    return emailTemplates;
  }, [emailTemplates, emailFilter]);

  const filteredTextTemplates = useMemo(() => {
    if (textFilter === 'Active Texts') {
      return textTemplates.filter((t) => !t.archived);
    }
    if (textFilter === 'Archived Texts') {
      return textTemplates.filter((t) => t.archived);
    }
    return textTemplates;
  }, [textTemplates, textFilter]);

  const updateSnapshot = (data: StudyEmailTextSettingsData) => {
    setEmailTemplates(data.emailTemplates || []);
    setTextTemplates(data.textTemplates || []);
    setStudyEvents(data.events || []);
    setTextMessagingEnabled(data.textMessagingEnabled ?? true);
    setServerCanManage(data.canManage ?? true);
    if (onStudyUpdated) {
      onStudyUpdated();
    }
  };

  // ================= EMAIL MODAL HANDLERS =================
  const openAddEmailModal = () => {
    setEditingEmail(null);
    setEmailName('');
    setEmailSubject('');
    setEmailDescription('');
    setEmailReplyTo('');
    setEmailSenderName('');
    setEmailMessage('');
    setEmailScheduleEnabled(false);
    setEmailScheduleTriggerType('event');
    setEmailScheduleTriggerId(studyEvents[0]?._id || '');
    setEmailScheduleInterval(1);
    setEmailScheduleUnit('days');
    setEmailScheduleBeforeAfter('before');
    setEmailScheduleDateType('scheduled');
    setEmailModalError(null);
    setEmailModalOpen(true);
  };

  const openEditEmailModal = (template: StudyEmailTemplate) => {
    setEditingEmail(template);
    setEmailName(template.name || '');
    setEmailSubject(template.subject || '');
    setEmailDescription(template.description || '');
    setEmailReplyTo(template.replyTo || '');
    setEmailSenderName(template.senderName || '');
    setEmailMessage(template.message || '');
    const sa = template.scheduledAction;
    if (sa && (sa.action || sa.schedule)) {
      setEmailScheduleEnabled(true);
      setEmailScheduleTriggerType((sa.action?.actionTriggerType as any) || 'event');
      setEmailScheduleTriggerId(sa.action?.actionTriggerId || studyEvents[0]?._id || '');
      setEmailScheduleInterval(sa.schedule?.relativeInterval ?? 1);
      setEmailScheduleUnit(sa.schedule?.relativeUnit || 'days');
      setEmailScheduleBeforeAfter(sa.schedule?.relativeBeforeOrAfter || 'before');
      setEmailScheduleDateType(sa.schedule?.dateType || 'scheduled');
    } else {
      setEmailScheduleEnabled(false);
      setEmailScheduleTriggerType('event');
      setEmailScheduleTriggerId(studyEvents[0]?._id || '');
      setEmailScheduleInterval(1);
      setEmailScheduleUnit('days');
      setEmailScheduleBeforeAfter('before');
      setEmailScheduleDateType('scheduled');
    }
    setEmailModalError(null);
    setEmailModalOpen(true);
  };

  const insertEmailMergeTag = (tag: string) => {
    const el = emailTextareaRef.current;
    if (!el) {
      setEmailMessage((prev) => prev + tag);
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const updated = el.value.substring(0, start) + tag + el.value.substring(end);
    setEmailMessage(updated);
    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + tag.length;
    }, 0);
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = emailName.trim();
    const trimmedSubject = emailSubject.trim();
    if (!trimmedName) {
      setEmailModalError('Template name is required.');
      return;
    }
    if (!trimmedSubject) {
      setEmailModalError('Subject line is required.');
      return;
    }
    if (!emailMessage.trim()) {
      setEmailModalError('Message body is required.');
      return;
    }

    // Check duplicate name among active templates
    const lowerName = trimmedName.toLowerCase();
    const isDuplicate = emailTemplates.some(
      (t) => !t.archived && t.name.toLowerCase() === lowerName && (!editingEmail || t._id !== editingEmail._id)
    );
    if (isDuplicate) {
      setEmailModalError(`An active email template named "${trimmedName}" already exists.`);
      return;
    }

    if (emailReplyTo.trim() && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(emailReplyTo.trim())) {
      setEmailModalError('Reply-To must be a valid email address.');
      return;
    }

    let scheduledAction: StudyScheduledAction | null = null;
    if (emailScheduleEnabled) {
      const selectedEvent = studyEvents.find((ev) => ev._id === emailScheduleTriggerId);
      scheduledAction = {
        action: {
          actionTriggerStudyId: studyId,
          actionType: 'email',
          actionTriggerType: emailScheduleTriggerType,
          actionTriggerId: emailScheduleTriggerId,
          triggerName: selectedEvent ? selectedEvent.name : emailScheduleTriggerId,
        },
        schedule: {
          relativeInterval: emailScheduleInterval,
          relativeUnit: emailScheduleUnit,
          relativeBeforeOrAfter: emailScheduleBeforeAfter,
          dateType: emailScheduleDateType,
        },
      };
    }

    const payload: SaveEmailTemplatePayload = {
      name: trimmedName,
      subject: trimmedSubject,
      description: emailDescription.trim(),
      message: emailMessage,
      replyTo: emailReplyTo.trim(),
      senderName: emailSenderName.trim(),
      scheduledAction,
    };

    try {
      setSubmitting(true);
      setEmailModalError(null);
      let updatedSnapshot: StudyEmailTextSettingsData;
      if (editingEmail) {
        updatedSnapshot = await studyApi.updateEmailTemplate(studyId, editingEmail._id, payload);
        setBannerSuccess(`Email template "${trimmedName}" updated successfully.`);
      } else {
        updatedSnapshot = await studyApi.createEmailTemplate(studyId, payload);
        setBannerSuccess(`Email template "${trimmedName}" created successfully.`);
      }
      updateSnapshot(updatedSnapshot);
      setEmailModalOpen(false);
    } catch (err: any) {
      setEmailModalError(err?.message || 'Failed to save email template.');
    } finally {
      setSubmitting(false);
    }
  };

  // ================= TEXT MODAL HANDLERS =================
  const openAddTextModal = () => {
    setEditingText(null);
    setTextName('');
    setTextDescription('');
    setTextMessage('');
    setTextScheduleEnabled(false);
    setTextScheduleTriggerType('event');
    setTextScheduleTriggerId(studyEvents[0]?._id || '');
    setTextScheduleInterval(1);
    setTextScheduleUnit('days');
    setTextScheduleBeforeAfter('before');
    setTextScheduleDateType('scheduled');
    setTextModalError(null);
    setTextModalOpen(true);
  };

  const openEditTextModal = (template: StudyTextTemplate) => {
    setEditingText(template);
    setTextName(template.name || '');
    setTextDescription(template.description || '');
    setTextMessage(template.message || '');
    const sa = template.scheduledAction;
    if (sa && (sa.action || sa.schedule)) {
      setTextScheduleEnabled(true);
      setTextScheduleTriggerType((sa.action?.actionTriggerType as any) || 'event');
      setTextScheduleTriggerId(sa.action?.actionTriggerId || studyEvents[0]?._id || '');
      setTextScheduleInterval(sa.schedule?.relativeInterval ?? 1);
      setTextScheduleUnit(sa.schedule?.relativeUnit || 'days');
      setTextScheduleBeforeAfter(sa.schedule?.relativeBeforeOrAfter || 'before');
      setTextScheduleDateType(sa.schedule?.dateType || 'scheduled');
    } else {
      setTextScheduleEnabled(false);
      setTextScheduleTriggerType('event');
      setTextScheduleTriggerId(studyEvents[0]?._id || '');
      setTextScheduleInterval(1);
      setTextScheduleUnit('days');
      setTextScheduleBeforeAfter('before');
      setTextScheduleDateType('scheduled');
    }
    setTextModalError(null);
    setTextModalOpen(true);
  };

  const insertTextMergeTag = (tag: string) => {
    const el = textTextareaRef.current;
    if (!el) {
      if ((textMessage + tag).length <= MAX_SMS_LENGTH) {
        setTextMessage((prev) => prev + tag);
      }
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const updated = el.value.substring(0, start) + tag + el.value.substring(end);
    if (updated.length <= MAX_SMS_LENGTH) {
      setTextMessage(updated);
      setTimeout(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = start + tag.length;
      }, 0);
    }
  };

  const handleSaveText = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = textName.trim();
    if (!trimmedName) {
      setTextModalError('Template name is required.');
      return;
    }
    if (!textMessage.trim()) {
      setTextModalError('Text message is required.');
      return;
    }
    if (textMessage.length > MAX_SMS_LENGTH) {
      setTextModalError(`Message exceeds maximum limit of ${MAX_SMS_LENGTH} characters.`);
      return;
    }

    // Check duplicate name among active templates
    const lowerName = trimmedName.toLowerCase();
    const isDuplicate = textTemplates.some(
      (t) => !t.archived && t.name.toLowerCase() === lowerName && (!editingText || t._id !== editingText._id)
    );
    if (isDuplicate) {
      setTextModalError(`An active text template named "${trimmedName}" already exists.`);
      return;
    }

    let scheduledAction: StudyScheduledAction | null = null;
    if (textScheduleEnabled) {
      const selectedEvent = studyEvents.find((ev) => ev._id === textScheduleTriggerId);
      scheduledAction = {
        action: {
          actionTriggerStudyId: studyId,
          actionType: 'text',
          actionTriggerType: textScheduleTriggerType,
          actionTriggerId: textScheduleTriggerId,
          triggerName: selectedEvent ? selectedEvent.name : textScheduleTriggerId,
        },
        schedule: {
          relativeInterval: textScheduleInterval,
          relativeUnit: textScheduleUnit,
          relativeBeforeOrAfter: textScheduleBeforeAfter,
          dateType: textScheduleDateType,
        },
      };
    }

    const payload: SaveTextTemplatePayload = {
      name: trimmedName,
      description: textDescription.trim(),
      message: textMessage,
      scheduledAction,
    };

    try {
      setSubmitting(true);
      setTextModalError(null);
      let updatedSnapshot: StudyEmailTextSettingsData;
      if (editingText) {
        updatedSnapshot = await studyApi.updateTextTemplate(studyId, editingText._id, payload);
        setBannerSuccess(`Text template "${trimmedName}" updated successfully.`);
      } else {
        updatedSnapshot = await studyApi.createTextTemplate(studyId, payload);
        setBannerSuccess(`Text template "${trimmedName}" created successfully.`);
      }
      updateSnapshot(updatedSnapshot);
      setTextModalOpen(false);
    } catch (err: any) {
      setTextModalError(err?.message || 'Failed to save text template.');
    } finally {
      setSubmitting(false);
    }
  };

  // ================= ACTION HANDLERS =================
  const handleCopyEmail = async (template: StudyEmailTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setSubmitting(true);
      setBannerError(null);
      const updated = await studyApi.copyEmailTemplate(studyId, template._id);
      updateSnapshot(updated);
      setBannerSuccess(`Template copy created for "${template.name}".`);
    } catch (err: any) {
      setBannerError(err?.message || 'Template copy could not be created.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyText = async (template: StudyTextTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setSubmitting(true);
      setBannerError(null);
      const updated = await studyApi.copyTextTemplate(studyId, template._id);
      updateSnapshot(updated);
      setBannerSuccess(`Template copy created for "${template.name}".`);
    } catch (err: any) {
      setBannerError(err?.message || 'Template copy could not be created.');
    } finally {
      setSubmitting(false);
    }
  };

  const promptConfirm = (
    template: StudyEmailTemplate | StudyTextTemplate,
    kind: 'email' | 'text',
    action: 'archive' | 'restore' | 'delete',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setTargetTemplate(template);
    setConfirmKind(kind);
    setConfirmAction(action);
    setConfirmModalOpen(true);
  };

  const handleExecuteConfirm = async () => {
    if (!targetTemplate || !confirmKind || !confirmAction) return;

    try {
      setSubmitting(true);
      setBannerError(null);
      let updated: StudyEmailTextSettingsData;
      const tId = targetTemplate._id;
      const tName = targetTemplate.name;

      if (confirmKind === 'email') {
        if (confirmAction === 'archive') {
          updated = await studyApi.archiveEmailTemplate(studyId, tId);
          setBannerSuccess(`Email template "${tName}" archived.`);
        } else if (confirmAction === 'restore') {
          updated = await studyApi.restoreEmailTemplate(studyId, tId);
          setBannerSuccess(`Email template "${tName}" restored.`);
        } else {
          updated = await studyApi.deleteEmailTemplate(studyId, tId);
          setBannerSuccess(`Email template "${tName}" deleted.`);
        }
      } else {
        if (confirmAction === 'archive') {
          updated = await studyApi.archiveTextTemplate(studyId, tId);
          setBannerSuccess(`Text template "${tName}" archived.`);
        } else if (confirmAction === 'restore') {
          updated = await studyApi.restoreTextTemplate(studyId, tId);
          setBannerSuccess(`Text template "${tName}" restored.`);
        } else {
          updated = await studyApi.deleteTextTemplate(studyId, tId);
          setBannerSuccess(`Text template "${tName}" deleted.`);
        }
      }

      updateSnapshot(updated);
      setConfirmModalOpen(false);
    } catch (err: any) {
      setBannerError(err?.message || `Failed to ${confirmAction} template.`);
    } finally {
      setSubmitting(false);
    }
  };

  // Reorder Email Templates
  const handleMoveEmail = async (index: number, newIndex: number) => {
    if (newIndex < 0 || newIndex >= filteredEmailTemplates.length || submitting) return;
    const reordered = [...filteredEmailTemplates];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);
    const templateIds = reordered.map((t) => t._id);

    try {
      setSubmitting(true);
      const updated = await studyApi.reorderEmailTemplates(studyId, templateIds);
      updateSnapshot(updated);
    } catch (err: any) {
      setBannerError(err?.message || 'Failed to reorder email templates.');
    } finally {
      setSubmitting(false);
    }
  };

  // Reorder Text Templates
  const handleMoveText = async (index: number, newIndex: number) => {
    if (newIndex < 0 || newIndex >= filteredTextTemplates.length || submitting) return;
    const reordered = [...filteredTextTemplates];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);
    const templateIds = reordered.map((t) => t._id);

    try {
      setSubmitting(true);
      const updated = await studyApi.reorderTextTemplates(studyId, templateIds);
      updateSnapshot(updated);
    } catch (err: any) {
      setBannerError(err?.message || 'Failed to reorder text templates.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="study-settings-loading" role="status" aria-live="polite" data-testid="email-text-loading">
        <Loader2 className="study-settings-spinner" size={24} />
        <span>Loading Email and Text Settings...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="study-settings-error-state" role="alert" data-testid="email-text-load-error">
        <AlertCircle size={24} className="study-settings-error-icon" />
        <h3 className="study-settings-error-title">Could not load Email and Text Settings</h3>
        <p className="study-settings-error-desc">{loadError}</p>
        <button
          type="button"
          className="study-settings-btn study-settings-btn--secondary"
          onClick={loadSettings}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="study-settings-details" data-testid="study-settings-email-and-text">
      {/* Read-only notification if user lacks manage privileges */}
      {!effectiveCanManage && (
        <div className="study-settings-banner study-settings-banner--info" role="status">
          <AlertCircle size={16} />
          <span>
            {isArchived
              ? 'This study is archived. Email and Text settings are read-only.'
              : 'You have read-only access to Email and Text settings.'}
          </span>
        </div>
      )}

      {bannerError && (
        <div className="study-settings-banner study-settings-banner--error" role="alert">
          <AlertCircle size={16} />
          <span>{bannerError}</span>
          <button
            type="button"
            className="study-settings-banner__close"
            onClick={() => setBannerError(null)}
            aria-label="Dismiss alert"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {bannerSuccess && (
        <div className="study-settings-banner study-settings-banner--success" role="status">
          <CheckCircle2 size={16} />
          <span>{bannerSuccess}</span>
          <button
            type="button"
            className="study-settings-banner__close"
            onClick={() => setBannerSuccess(null)}
            aria-label="Dismiss success message"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Page Header */}
      <div className="study-bulk-tasks-header">
        <div className="study-bulk-tasks-header__title-group">
          <Mail size={20} className="study-settings-card__icon" />
          <div>
            <h2 className="study-bulk-tasks-header__title">
              {textMessagingEnabled ? 'Email and Text Settings' : 'Email Settings'}
            </h2>
            <p className="study-bulk-tasks-header__subtitle">
              Manage reusable notification templates, merge variables, and automated scheduled actions.
            </p>
          </div>
        </div>
      </div>

      {/* ================= 1. EMAIL TEMPLATES SECTION ================= */}
      <section className="study-settings-card" aria-labelledby="email-templates-heading">
        <div
          className="study-settings-card__header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={16} />
            <h3 id="email-templates-heading" className="study-settings-card__title">
              Email Templates
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label htmlFor="email-filter-select" className="sr-only">
              Filter by Email Template Status
            </label>
            <select
              id="email-filter-select"
              className="study-settings-select"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value as EmailFilterOption)}
              data-testid="email-filter-select"
              style={{ padding: '4px 8px', fontSize: '13px' }}
            >
              <option value="Active Emails">Active Emails</option>
              <option value="Archived Emails">Archived Emails</option>
              <option value="All Emails">All Emails</option>
            </select>
          </div>
        </div>

        <div className="study-settings-card__body">
          {filteredEmailTemplates.length === 0 ? (
            <div className="study-bulk-tasks-empty" data-testid="email-templates-empty">
              <p>No {emailFilter.toLowerCase()} found.</p>
            </div>
          ) : (
            <div className="study-settings-table-wrapper">
              <table className="study-settings-table" aria-label="Email templates table">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '30%' }}>Name</th>
                    <th scope="col" style={{ width: '40%' }}>Description</th>
                    <th scope="col" style={{ width: '20%' }}>Actions</th>
                    {effectiveCanManage && emailFilter === 'Active Emails' && (
                      <th scope="col" style={{ width: '10%', textAlign: 'center' }}>Reorder</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmailTemplates.map((template, idx) => {
                    const brokenTag = checkMessageForBrokenMergeTags(template.message);
                    return (
                      <tr
                        key={template._id}
                        data-testid={`email-template-row-${template._id}`}
                        style={{ cursor: effectiveCanManage ? 'pointer' : 'default' }}
                        onClick={() => effectiveCanManage && openEditEmailModal(template)}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: '#1b68b8' }}>{template.name}</span>
                            {brokenTag && (
                              <span
                                title={`This message contains broken merge tags: ${brokenTag}`}
                                style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center' }}
                                aria-label={`Broken merge tags: ${brokenTag}`}
                              >
                                <AlertTriangle size={15} />
                              </span>
                            )}
                            {template.archived && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  background: '#e2e8f0',
                                  color: '#475569',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                Archived
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span style={{ color: '#475569', fontSize: '13px' }}>
                            {template.description || '—'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {!template.archived ? (
                              <>
                                <button
                                  type="button"
                                  className="study-settings-link-btn"
                                  onClick={(e) => handleCopyEmail(template, e)}
                                  disabled={!effectiveCanManage || submitting}
                                  aria-label={`Copy email template ${template.name}`}
                                  data-testid={`copy-email-template-${template._id}`}
                                >
                                  Copy
                                </button>
                                <span>|</span>
                                <button
                                  type="button"
                                  className="study-settings-link-btn"
                                  onClick={(e) => promptConfirm(template, 'email', 'archive', e)}
                                  disabled={!effectiveCanManage || submitting}
                                  aria-label={`Archive email template ${template.name}`}
                                  data-testid={`archive-email-template-${template._id}`}
                                >
                                  Archive
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="study-settings-link-btn"
                                  onClick={(e) => promptConfirm(template, 'email', 'restore', e)}
                                  disabled={!effectiveCanManage || submitting}
                                  aria-label={`Restore email template ${template.name}`}
                                  data-testid={`restore-email-template-${template._id}`}
                                >
                                  Restore
                                </button>
                                <span>|</span>
                                <button
                                  type="button"
                                  className="study-settings-link-btn study-settings-link-btn--danger"
                                  onClick={(e) => promptConfirm(template, 'email', 'delete', e)}
                                  disabled={!effectiveCanManage || submitting}
                                  aria-label={`Delete email template ${template.name}`}
                                  data-testid={`delete-email-template-${template._id}`}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                        {effectiveCanManage && emailFilter === 'Active Emails' && (
                          <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'inline-flex', gap: '4px' }}>
                              <button
                                type="button"
                                className="study-settings-icon-btn"
                                onClick={() => handleMoveEmail(idx, idx - 1)}
                                disabled={idx === 0 || submitting}
                                aria-label={`Move ${template.name} up`}
                                title="Move up"
                                data-testid={`move-email-up-${template._id}`}
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                type="button"
                                className="study-settings-icon-btn"
                                onClick={() => handleMoveEmail(idx, idx + 1)}
                                disabled={idx === filteredEmailTemplates.length - 1 || submitting}
                                aria-label={`Move ${template.name} down`}
                                title="Move down"
                                data-testid={`move-email-down-${template._id}`}
                              >
                                <ArrowDown size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {effectiveCanManage && (
            <div style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="study-settings-btn study-settings-btn--primary"
                onClick={openAddEmailModal}
                disabled={submitting}
                data-testid="add-email-template-btn"
              >
                <Plus size={14} />
                <span>Add Template</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ================= 2. TEXT TEMPLATES SECTION ================= */}
      {textMessagingEnabled && (
        <section
          className="study-settings-card"
          aria-labelledby="text-templates-heading"
          style={{ marginTop: '24px' }}
        >
          <div
            className="study-settings-card__header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} />
              <h3 id="text-templates-heading" className="study-settings-card__title">
                Text Templates
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label htmlFor="text-filter-select" className="sr-only">
                Filter by Text Template Status
              </label>
              <select
                id="text-filter-select"
                className="study-settings-select"
                value={textFilter}
                onChange={(e) => setTextFilter(e.target.value as TextFilterOption)}
                data-testid="text-filter-select"
                style={{ padding: '4px 8px', fontSize: '13px' }}
              >
                <option value="Active Texts">Active Texts</option>
                <option value="Archived Texts">Archived Texts</option>
                <option value="All Texts">All Texts</option>
              </select>
            </div>
          </div>

          <div className="study-settings-card__body">
            {filteredTextTemplates.length === 0 ? (
              <div className="study-bulk-tasks-empty" data-testid="text-templates-empty">
                <p>No {textFilter.toLowerCase()} found.</p>
              </div>
            ) : (
              <div className="study-settings-table-wrapper">
                <table className="study-settings-table" aria-label="Text templates table">
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: '30%' }}>Name</th>
                      <th scope="col" style={{ width: '40%' }}>Description</th>
                      <th scope="col" style={{ width: '20%' }}>Actions</th>
                      {effectiveCanManage && textFilter === 'Active Texts' && (
                        <th scope="col" style={{ width: '10%', textAlign: 'center' }}>Reorder</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTextTemplates.map((template, idx) => {
                      const brokenTag = checkMessageForBrokenMergeTags(template.message);
                      return (
                        <tr
                          key={template._id}
                          data-testid={`text-template-row-${template._id}`}
                          style={{ cursor: effectiveCanManage ? 'pointer' : 'default' }}
                          onClick={() => effectiveCanManage && openEditTextModal(template)}
                        >
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 600, color: '#1b68b8' }}>{template.name}</span>
                              {brokenTag && (
                                <span
                                  title={`This message contains broken merge tags: ${brokenTag}`}
                                  style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center' }}
                                  aria-label={`Broken merge tags: ${brokenTag}`}
                                >
                                  <AlertTriangle size={15} />
                                </span>
                              )}
                              {template.archived && (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    background: '#e2e8f0',
                                    color: '#475569',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  Archived
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span style={{ color: '#475569', fontSize: '13px' }}>
                              {template.description || '—'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {!template.archived ? (
                                <>
                                  <button
                                    type="button"
                                    className="study-settings-link-btn"
                                    onClick={(e) => handleCopyText(template, e)}
                                    disabled={!effectiveCanManage || submitting}
                                    aria-label={`Copy text template ${template.name}`}
                                    data-testid={`copy-text-template-${template._id}`}
                                  >
                                    Copy
                                  </button>
                                  <span>|</span>
                                  <button
                                    type="button"
                                    className="study-settings-link-btn"
                                    onClick={(e) => promptConfirm(template, 'text', 'archive', e)}
                                    disabled={!effectiveCanManage || submitting}
                                    aria-label={`Archive text template ${template.name}`}
                                    data-testid={`archive-text-template-${template._id}`}
                                  >
                                    Archive
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="study-settings-link-btn"
                                    onClick={(e) => promptConfirm(template, 'text', 'restore', e)}
                                    disabled={!effectiveCanManage || submitting}
                                    aria-label={`Restore text template ${template.name}`}
                                    data-testid={`restore-text-template-${template._id}`}
                                  >
                                    Restore
                                  </button>
                                  <span>|</span>
                                  <button
                                    type="button"
                                    className="study-settings-link-btn study-settings-link-btn--danger"
                                    onClick={(e) => promptConfirm(template, 'text', 'delete', e)}
                                    disabled={!effectiveCanManage || submitting}
                                    aria-label={`Delete text template ${template.name}`}
                                    data-testid={`delete-text-template-${template._id}`}
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                          {effectiveCanManage && textFilter === 'Active Texts' && (
                            <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'inline-flex', gap: '4px' }}>
                                <button
                                  type="button"
                                  className="study-settings-icon-btn"
                                  onClick={() => handleMoveText(idx, idx - 1)}
                                  disabled={idx === 0 || submitting}
                                  aria-label={`Move ${template.name} up`}
                                  title="Move up"
                                  data-testid={`move-text-up-${template._id}`}
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="study-settings-icon-btn"
                                  onClick={() => handleMoveText(idx, idx + 1)}
                                  disabled={idx === filteredTextTemplates.length - 1 || submitting}
                                  aria-label={`Move ${template.name} down`}
                                  title="Move down"
                                  data-testid={`move-text-down-${template._id}`}
                                >
                                  <ArrowDown size={14} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {effectiveCanManage && (
              <div style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="study-settings-btn study-settings-btn--primary"
                  onClick={openAddTextModal}
                  disabled={submitting}
                  data-testid="add-text-template-btn"
                >
                  <Plus size={14} />
                  <span>Add Template</span>
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ================= MODAL: EMAIL TEMPLATE ================= */}
      {emailModalOpen && (
        <div
          className="study-settings-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-template-modal-title"
          data-testid="email-template-modal"
        >
          <div className="study-settings-modal" style={{ maxWidth: '780px' }}>
            <header className="study-settings-modal__header">
              <h3 id="email-template-modal-title" className="study-settings-modal__title">
                {editingEmail ? 'Edit Email Template' : 'Add Email Template'}
              </h3>
              <button
                type="button"
                className="study-settings-icon-btn"
                onClick={() => setEmailModalOpen(false)}
                aria-label="Close modal"
                data-testid="close-email-modal-btn"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleSaveEmail} noValidate>
              <div className="study-settings-modal__body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {emailModalError && (
                  <div className="study-settings-banner study-settings-banner--error" role="alert">
                    <AlertCircle size={16} />
                    <span>{emailModalError}</span>
                  </div>
                )}

                <div className="study-settings-field">
                  <label htmlFor="email-name-input" className="study-settings-label">
                    Template Name <span className="study-settings-required">*</span>
                  </label>
                  <input
                    id="email-name-input"
                    type="text"
                    className="study-settings-input"
                    value={emailName}
                    onChange={(e) => setEmailName(e.target.value)}
                    placeholder="e.g. Visit 1 Reminder"
                    required
                    data-testid="email-name-input"
                  />
                </div>

                <div className="study-settings-field">
                  <label htmlFor="email-subject-input" className="study-settings-label">
                    Subject Line <span className="study-settings-required">*</span>
                  </label>
                  <input
                    id="email-subject-input"
                    type="text"
                    className="study-settings-input"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="e.g. Upcoming Study Visit Reminder"
                    required
                    data-testid="email-subject-input"
                  />
                </div>

                <div className="study-settings-field">
                  <label htmlFor="email-description-input" className="study-settings-label">
                    Description
                  </label>
                  <input
                    id="email-description-input"
                    type="text"
                    className="study-settings-input"
                    value={emailDescription}
                    onChange={(e) => setEmailDescription(e.target.value)}
                    placeholder="Internal reference notes"
                    data-testid="email-description-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="study-settings-field">
                    <label htmlFor="email-sender-name-input" className="study-settings-label">
                      Sender Name
                    </label>
                    <input
                      id="email-sender-name-input"
                      type="text"
                      className="study-settings-input"
                      value={emailSenderName}
                      onChange={(e) => setEmailSenderName(e.target.value)}
                      placeholder="e.g. Clinical Research Team"
                      data-testid="email-sender-name-input"
                    />
                  </div>
                  <div className="study-settings-field">
                    <label htmlFor="email-reply-to-input" className="study-settings-label">
                      Reply-To Email
                    </label>
                    <input
                      id="email-reply-to-input"
                      type="email"
                      className="study-settings-input"
                      value={emailReplyTo}
                      onChange={(e) => setEmailReplyTo(e.target.value)}
                      placeholder="e.g. study-coordinator@clinic.org"
                      data-testid="email-reply-to-input"
                    />
                  </div>
                </div>

                {/* Scheduled Action Section */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '14px',
                    margin: '16px 0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input
                      id="email-schedule-toggle"
                      type="checkbox"
                      className="study-settings-checkbox"
                      checked={emailScheduleEnabled}
                      onChange={(e) => setEmailScheduleEnabled(e.target.checked)}
                      data-testid="email-schedule-toggle"
                    />
                    <label htmlFor="email-schedule-toggle" style={{ fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                      <Clock size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                      Automate with Scheduled Action
                    </label>
                  </div>

                  {emailScheduleEnabled && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '10px' }}>
                      <div className="study-settings-field">
                        <label className="study-settings-label" style={{ fontSize: '12px' }}>Trigger Type</label>
                        <select
                          className="study-settings-select"
                          value={emailScheduleTriggerType}
                          onChange={(e) => setEmailScheduleTriggerType(e.target.value as any)}
                        >
                          <option value="event">Study Event</option>
                          <option value="variable">Variable</option>
                        </select>
                      </div>

                      {emailScheduleTriggerType === 'event' && (
                        <div className="study-settings-field">
                          <label className="study-settings-label" style={{ fontSize: '12px' }}>Event</label>
                          <select
                            className="study-settings-select"
                            value={emailScheduleTriggerId}
                            onChange={(e) => setEmailScheduleTriggerId(e.target.value)}
                            data-testid="email-schedule-event-select"
                          >
                            {studyEvents.map((ev) => (
                              <option key={ev._id} value={ev._id}>
                                {ev.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="study-settings-field">
                        <label className="study-settings-label" style={{ fontSize: '12px' }}>Interval</label>
                        <input
                          type="number"
                          min="1"
                          className="study-settings-input"
                          value={emailScheduleInterval}
                          onChange={(e) => setEmailScheduleInterval(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        />
                      </div>

                      <div className="study-settings-field">
                        <label className="study-settings-label" style={{ fontSize: '12px' }}>Unit</label>
                        <select
                          className="study-settings-select"
                          value={emailScheduleUnit}
                          onChange={(e) => setEmailScheduleUnit(e.target.value)}
                        >
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                          <option value="weeks">Weeks</option>
                          <option value="months">Months</option>
                        </select>
                      </div>

                      <div className="study-settings-field">
                        <label className="study-settings-label" style={{ fontSize: '12px' }}>Timing</label>
                        <select
                          className="study-settings-select"
                          value={emailScheduleBeforeAfter}
                          onChange={(e) => setEmailScheduleBeforeAfter(e.target.value)}
                        >
                          <option value="before">Before</option>
                          <option value="after">After</option>
                        </select>
                      </div>

                      <div className="study-settings-field">
                        <label className="study-settings-label" style={{ fontSize: '12px' }}>Date Type</label>
                        <select
                          className="study-settings-select"
                          value={emailScheduleDateType}
                          onChange={(e) => setEmailScheduleDateType(e.target.value)}
                        >
                          <option value="scheduled">Scheduled Date</option>
                          <option value="actual">Actual Date</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Merge Tag Helpers */}
                <div style={{ marginBottom: '8px' }}>
                  <label className="study-settings-label" style={{ marginBottom: '4px' }}>
                    Quick Insert Merge Tags
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {STANDARD_MERGE_TAGS.map((tag) => (
                      <button
                        key={tag.tag}
                        type="button"
                        className="study-settings-btn study-settings-btn--secondary"
                        style={{ padding: '2px 8px', fontSize: '11px' }}
                        onClick={() => insertEmailMergeTag(tag.tag)}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="study-settings-field">
                  <label htmlFor="email-message-input" className="study-settings-label">
                    Email Message Content <span className="study-settings-required">*</span>
                  </label>
                  <textarea
                    ref={emailTextareaRef}
                    id="email-message-input"
                    className="study-settings-textarea"
                    rows={8}
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Type email body here. Use {{variableName}} for merge tags."
                    required
                    data-testid="email-message-input"
                  />
                </div>
              </div>

              <footer className="study-settings-modal__footer">
                <button
                  type="button"
                  className="study-settings-btn study-settings-btn--secondary"
                  onClick={() => setEmailModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="study-settings-btn study-settings-btn--primary"
                  disabled={submitting}
                  data-testid="save-email-template-btn"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="study-settings-spinner" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Template</span>
                  )}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TEXT TEMPLATE ================= */}
      {textModalOpen && (
        <div
          className="study-settings-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="text-template-modal-title"
          data-testid="text-template-modal"
        >
          <div className="study-settings-modal" style={{ maxWidth: '680px' }}>
            <header className="study-settings-modal__header">
              <h3 id="text-template-modal-title" className="study-settings-modal__title">
                {editingText ? 'Edit Text Template' : 'Add Text Template'}
              </h3>
              <button
                type="button"
                className="study-settings-icon-btn"
                onClick={() => setTextModalOpen(false)}
                aria-label="Close modal"
                data-testid="close-text-modal-btn"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleSaveText} noValidate>
              <div className="study-settings-modal__body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {textModalError && (
                  <div className="study-settings-banner study-settings-banner--error" role="alert">
                    <AlertCircle size={16} />
                    <span>{textModalError}</span>
                  </div>
                )}

                <div className="study-settings-field">
                  <label htmlFor="text-name-input" className="study-settings-label">
                    Template Name <span className="study-settings-required">*</span>
                  </label>
                  <input
                    id="text-name-input"
                    type="text"
                    className="study-settings-input"
                    value={textName}
                    onChange={(e) => setTextName(e.target.value)}
                    placeholder="e.g. Appointment Reminder SMS"
                    required
                    data-testid="text-name-input"
                  />
                </div>

                <div className="study-settings-field">
                  <label htmlFor="text-description-input" className="study-settings-label">
                    Description
                  </label>
                  <input
                    id="text-description-input"
                    type="text"
                    className="study-settings-input"
                    value={textDescription}
                    onChange={(e) => setTextDescription(e.target.value)}
                    placeholder="Internal reference notes"
                    data-testid="text-description-input"
                  />
                </div>

                {/* Scheduled Action Section */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '14px',
                    margin: '16px 0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input
                      id="text-schedule-toggle"
                      type="checkbox"
                      className="study-settings-checkbox"
                      checked={textScheduleEnabled}
                      onChange={(e) => setTextScheduleEnabled(e.target.checked)}
                      data-testid="text-schedule-toggle"
                    />
                    <label htmlFor="text-schedule-toggle" style={{ fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                      <Clock size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                      Automate with Scheduled Action
                    </label>
                  </div>

                  {textScheduleEnabled && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '10px' }}>
                      <div className="study-settings-field">
                        <label className="study-settings-label" style={{ fontSize: '12px' }}>Trigger Type</label>
                        <select
                          className="study-settings-select"
                          value={textScheduleTriggerType}
                          onChange={(e) => setTextScheduleTriggerType(e.target.value as any)}
                        >
                          <option value="event">Study Event</option>
                          <option value="variable">Variable</option>
                        </select>
                      </div>

                      {textScheduleTriggerType === 'event' && (
                        <div className="study-settings-field">
                          <label className="study-settings-label" style={{ fontSize: '12px' }}>Event</label>
                          <select
                            className="study-settings-select"
                            value={textScheduleTriggerId}
                            onChange={(e) => setTextScheduleTriggerId(e.target.value)}
                            data-testid="text-schedule-event-select"
                          >
                            {studyEvents.map((ev) => (
                              <option key={ev._id} value={ev._id}>
                                {ev.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="study-settings-field">
                        <label className="study-settings-label" style={{ fontSize: '12px' }}>Interval</label>
                        <input
                          type="number"
                          min="1"
                          className="study-settings-input"
                          value={textScheduleInterval}
                          onChange={(e) => setTextScheduleInterval(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        />
                      </div>

                      <div className="study-settings-field">
                        <label className="study-settings-label" style={{ fontSize: '12px' }}>Unit</label>
                        <select
                          className="study-settings-select"
                          value={textScheduleUnit}
                          onChange={(e) => setTextScheduleUnit(e.target.value)}
                        >
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                          <option value="weeks">Weeks</option>
                          <option value="months">Months</option>
                        </select>
                      </div>

                      <div className="study-settings-field">
                        <label className="study-settings-label" style={{ fontSize: '12px' }}>Timing</label>
                        <select
                          className="study-settings-select"
                          value={textScheduleBeforeAfter}
                          onChange={(e) => setTextScheduleBeforeAfter(e.target.value)}
                        >
                          <option value="before">Before</option>
                          <option value="after">After</option>
                        </select>
                      </div>

                      <div className="study-settings-field">
                        <label className="study-settings-label" style={{ fontSize: '12px' }}>Date Type</label>
                        <select
                          className="study-settings-select"
                          value={textScheduleDateType}
                          onChange={(e) => setTextScheduleDateType(e.target.value)}
                        >
                          <option value="scheduled">Scheduled Date</option>
                          <option value="actual">Actual Date</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Merge Tag Helpers */}
                <div style={{ marginBottom: '8px' }}>
                  <label className="study-settings-label" style={{ marginBottom: '4px' }}>
                    Quick Insert Merge Tags
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {STANDARD_MERGE_TAGS.map((tag) => (
                      <button
                        key={tag.tag}
                        type="button"
                        className="study-settings-btn study-settings-btn--secondary"
                        style={{ padding: '2px 8px', fontSize: '11px' }}
                        onClick={() => insertTextMergeTag(tag.tag)}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="study-settings-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="text-message-input" className="study-settings-label">
                      Message Content <span className="study-settings-required">*</span>
                    </label>
                    <span
                      style={{
                        fontSize: '12px',
                        color: textMessage.length > MAX_SMS_LENGTH ? '#dc2626' : '#64748b',
                        fontWeight: textMessage.length > MAX_SMS_LENGTH ? 700 : 400,
                      }}
                      data-testid="text-char-count"
                    >
                      {textMessage.length} / {MAX_SMS_LENGTH} characters
                    </span>
                  </div>
                  <textarea
                    ref={textTextareaRef}
                    id="text-message-input"
                    className="study-settings-textarea"
                    rows={5}
                    value={textMessage}
                    onChange={(e) => setTextMessage(e.target.value)}
                    placeholder="Type SMS text message here..."
                    required
                    maxLength={MAX_SMS_LENGTH}
                    data-testid="text-message-input"
                  />
                </div>
              </div>

              <footer className="study-settings-modal__footer">
                <button
                  type="button"
                  className="study-settings-btn study-settings-btn--secondary"
                  onClick={() => setTextModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="study-settings-btn study-settings-btn--primary"
                  disabled={submitting}
                  data-testid="save-text-template-btn"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="study-settings-spinner" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Template</span>
                  )}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRM ACTION (Archive / Restore / Delete) ================= */}
      {confirmModalOpen && targetTemplate && confirmAction && confirmKind && (
        <div
          className="study-settings-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-action-modal-title"
          data-testid="confirm-template-action-modal"
        >
          <div className="study-settings-modal" style={{ maxWidth: '440px' }}>
            <header className="study-settings-modal__header">
              <h3 id="confirm-action-modal-title" className="study-settings-modal__title">
                {confirmAction === 'archive' && `Archive ${confirmKind === 'email' ? 'Email' : 'Text'} Template`}
                {confirmAction === 'restore' && `Restore ${confirmKind === 'email' ? 'Email' : 'Text'} Template`}
                {confirmAction === 'delete' && `Delete ${confirmKind === 'email' ? 'Email' : 'Text'} Template`}
              </h3>
              <button
                type="button"
                className="study-settings-icon-btn"
                onClick={() => setConfirmModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </header>

            <div className="study-settings-modal__body">
              {confirmAction === 'archive' && (
                <p>
                  Are you sure you want to archive <strong>"{targetTemplate.name}"</strong>? It will no longer be active for scheduled automation until restored.
                </p>
              )}
              {confirmAction === 'restore' && (
                <p>
                  Are you sure you want to restore <strong>"{targetTemplate.name}"</strong> to active templates?
                </p>
              )}
              {confirmAction === 'delete' && (
                <p style={{ color: '#dc2626' }}>
                  Are you sure you want to permanently delete <strong>"{targetTemplate.name}"</strong>? This will also remove any associated scheduled actions. This action cannot be undone.
                </p>
              )}
            </div>

            <footer className="study-settings-modal__footer">
              <button
                type="button"
                className="study-settings-btn study-settings-btn--secondary"
                onClick={() => setConfirmModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`study-settings-btn ${confirmAction === 'delete' ? 'study-settings-btn--danger' : 'study-settings-btn--primary'}`}
                onClick={handleExecuteConfirm}
                disabled={submitting}
                data-testid="confirm-action-submit-btn"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="study-settings-spinner" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>
                    {confirmAction === 'archive' && 'Archive Template'}
                    {confirmAction === 'restore' && 'Restore Template'}
                    {confirmAction === 'delete' && 'Delete Template'}
                  </span>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudySettingsEmailAndText;
