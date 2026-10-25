// frontend/microfrontends/study/src/components/StudySettingsDisplay.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  studyApi,
  StudyDisplaySettings,
  ParticipantColumn,
  LocaleOption,
  UpdateStudyDisplaySettingsPayload,
} from '../../../../shared/api/studyApi';
import {
  Globe,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  Columns,
  MessageSquare,
} from 'lucide-react';

export interface StudySettingsDisplayProps {
  studyId: string;
  studyName?: string;
  isArchived?: boolean;
  canManageSettings?: boolean;
  onStudyUpdated?: () => void;
}

const SAMPLE_PREVIEW_DATE = new Date(Date.UTC(2026, 10, 25, 12, 0, 0)); // Nov 25, 2026

export function formatLocaleSampleDate(localeCode: string): { formatted: string; placeholder: string } {
  const safeLocale = localeCode || 'en-US';
  try {
    const formatter = new Intl.DateTimeFormat(safeLocale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    });
    const formatted = formatter.format(SAMPLE_PREVIEW_DATE);
    const parts = formatter.formatToParts(SAMPLE_PREVIEW_DATE);
    const placeholder = parts
      .map((p) => {
        if (p.type === 'day') return 'DD';
        if (p.type === 'month') return 'MM';
        if (p.type === 'year') return 'YYYY';
        return p.value;
      })
      .join('');
    return { formatted, placeholder: placeholder || 'MM/DD/YYYY' };
  } catch {
    return { formatted: '11/25/2026', placeholder: 'MM/DD/YYYY' };
  }
}

export const StudySettingsDisplay: React.FC<StudySettingsDisplayProps> = ({
  studyId,
  isArchived = false,
  canManageSettings = true,
  onStudyUpdated,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [locale, setLocale] = useState<string>('en-US');
  const [showGlobalComments, setShowGlobalComments] = useState<boolean>(false);
  const [defaultGlobalLogs, setDefaultGlobalLogs] = useState<boolean>(false);
  const [statusPageCombinedView, setStatusPageCombinedView] = useState<boolean>(false);
  const [enrolledParticipantColumnsShowEvents, setEnrolledParticipantColumnsShowEvents] =
    useState<boolean>(true);
  const [potentialParticipantColumns, setPotentialParticipantColumns] = useState<ParticipantColumn[]>([]);
  const [enrolledParticipantColumns, setEnrolledParticipantColumns] = useState<ParticipantColumn[]>([]);
  const [availableColumns, setAvailableColumns] = useState<ParticipantColumn[]>([]);
  const [supportedLocales, setSupportedLocales] = useState<LocaleOption[]>([]);
  const [serverCanManage, setServerCanManage] = useState<boolean>(true);

  const canEdit = canManageSettings && serverCanManage && !isArchived;

  const lastServerStateRef = useRef<StudyDisplaySettings | null>(null);

  const applyResponseState = useCallback((data: StudyDisplaySettings) => {
    lastServerStateRef.current = data;
    setLocale(data.locale || 'en-US');
    setShowGlobalComments(Boolean(data.showGlobalComments));
    setDefaultGlobalLogs(Boolean(data.defaultGlobalLogs));
    setStatusPageCombinedView(Boolean(data.statusPageCombinedView));
    setEnrolledParticipantColumnsShowEvents(
      data.enrolledParticipantColumnsShowEvents !== undefined
        ? Boolean(data.enrolledParticipantColumnsShowEvents)
        : true
    );
    setPotentialParticipantColumns(
      Array.isArray(data.potentialParticipantColumns) ? data.potentialParticipantColumns : []
    );
    setEnrolledParticipantColumns(
      Array.isArray(data.enrolledParticipantColumns) ? data.enrolledParticipantColumns : []
    );
    setAvailableColumns(Array.isArray(data.availableColumnOptions) ? data.availableColumnOptions : []);
    setSupportedLocales(Array.isArray(data.supportedLocales) ? data.supportedLocales : []);
    setServerCanManage(data.canManage !== undefined ? data.canManage : true);
  }, []);

  const fetchDisplaySettings = useCallback(async () => {
    if (!studyId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await studyApi.getStudyDisplaySettings(studyId);
      applyResponseState(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load study display settings.';
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [studyId, applyResponseState]);

  useEffect(() => {
    fetchDisplaySettings();
  }, [fetchDisplaySettings]);

  const persistUpdate = async (
    partialPayload: UpdateStudyDisplaySettingsPayload,
    successMessage = 'Display settings saved.'
  ) => {
    if (!canEdit) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const updated = await studyApi.updateStudyDisplaySettings(studyId, partialPayload);
      applyResponseState(updated);
      setSaveSuccess(successMessage);
      onStudyUpdated?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update display settings.';
      setSaveError(msg);
      // Roll back optimistic UI changes to the last persisted server state.
      if (lastServerStateRef.current) {
        applyResponseState(lastServerStateRef.current);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLocaleChange = async (newLocale: string) => {
    setLocale(newLocale);
    await persistUpdate({ locale: newLocale }, 'Study locale updated.');
  };

  const handleShowGlobalCommentsChange = async (checked: boolean) => {
    setShowGlobalComments(checked);
    await persistUpdate({ showGlobalComments: checked }, 'Global logs visibility updated.');
  };

  const handleDefaultGlobalLogsChange = async (checked: boolean) => {
    setDefaultGlobalLogs(checked);
    await persistUpdate({ defaultGlobalLogs: checked }, 'Default global logs setting updated.');
  };

  const handleCombinedStatusViewChange = async (checked: boolean) => {
    setStatusPageCombinedView(checked);
    await persistUpdate(
      {
        statusPageCombinedView: checked,
        enrolledParticipantColumnsShowEvents,
        potentialParticipantColumns,
        enrolledParticipantColumns,
      },
      'Potential participants combined view updated.'
    );
  };

  const handleEnrolledShowEventsChange = async (checked: boolean) => {
    setEnrolledParticipantColumnsShowEvents(checked);
    await persistUpdate(
      {
        statusPageCombinedView,
        enrolledParticipantColumnsShowEvents: checked,
        potentialParticipantColumns,
        enrolledParticipantColumns,
      },
      'Enrolled participants event headings updated.'
    );
  };

  const findColumnOption = (value: string): ParticipantColumn => {
    const matched = availableColumns.find((col) => col.value === value);
    if (matched) {
      return { label: matched.label, value: matched.value, cId: matched.cId, title: matched.title };
    }
    return { label: value, value };
  };

  const getDefaultFirstColumn = (): ParticipantColumn => {
    if (availableColumns.length > 0) {
      const first = availableColumns[0];
      return { label: first.label, value: first.value, cId: first.cId, title: first.title };
    }
    return { label: 'ID', value: 'psi.customId' };
  };

  // Potential Participant Columns handlers
  const handlePotentialColumnChange = async (index: number, newValue: string) => {
    const selectedCol = findColumnOption(newValue);
    const nextCols = potentialParticipantColumns.map((col, idx) =>
      idx === index ? selectedCol : col
    );
    setPotentialParticipantColumns(nextCols);
    await persistUpdate(
      {
        statusPageCombinedView,
        enrolledParticipantColumnsShowEvents,
        potentialParticipantColumns: nextCols,
        enrolledParticipantColumns,
      },
      'Potential participant columns updated.'
    );
  };

  const handleAddPotentialColumn = async () => {
    const nextCols = [...potentialParticipantColumns, getDefaultFirstColumn()];
    setPotentialParticipantColumns(nextCols);
    await persistUpdate(
      {
        statusPageCombinedView,
        enrolledParticipantColumnsShowEvents,
        potentialParticipantColumns: nextCols,
        enrolledParticipantColumns,
      },
      'Column added to potential participants.'
    );
  };

  const handleRemovePotentialColumn = async (index: number) => {
    if (potentialParticipantColumns.length <= 1) {
      setSaveSuccess(null);
      setSaveError('Must have at least one column for display.');
      return;
    }
    const nextCols = potentialParticipantColumns.filter((_, idx) => idx !== index);
    setPotentialParticipantColumns(nextCols);
    await persistUpdate(
      {
        statusPageCombinedView,
        enrolledParticipantColumnsShowEvents,
        potentialParticipantColumns: nextCols,
        enrolledParticipantColumns,
      },
      'Column removed from potential participants.'
    );
  };

  // Enrolled Participant Columns handlers
  const handleEnrolledColumnChange = async (index: number, newValue: string) => {
    const selectedCol = findColumnOption(newValue);
    const nextCols = enrolledParticipantColumns.map((col, idx) =>
      idx === index ? selectedCol : col
    );
    setEnrolledParticipantColumns(nextCols);
    await persistUpdate(
      {
        statusPageCombinedView,
        enrolledParticipantColumnsShowEvents,
        potentialParticipantColumns,
        enrolledParticipantColumns: nextCols,
      },
      'Enrolled participant columns updated.'
    );
  };

  const handleAddEnrolledColumn = async () => {
    const nextCols = [...enrolledParticipantColumns, getDefaultFirstColumn()];
    setEnrolledParticipantColumns(nextCols);
    await persistUpdate(
      {
        statusPageCombinedView,
        enrolledParticipantColumnsShowEvents,
        potentialParticipantColumns,
        enrolledParticipantColumns: nextCols,
      },
      'Column added to enrolled participants.'
    );
  };

  const handleRemoveEnrolledColumn = async (index: number) => {
    if (enrolledParticipantColumns.length <= 1) {
      setSaveSuccess(null);
      setSaveError('Must have at least one column for display.');
      return;
    }
    const nextCols = enrolledParticipantColumns.filter((_, idx) => idx !== index);
    setEnrolledParticipantColumns(nextCols);
    await persistUpdate(
      {
        statusPageCombinedView,
        enrolledParticipantColumnsShowEvents,
        potentialParticipantColumns,
        enrolledParticipantColumns: nextCols,
      },
      'Column removed from enrolled participants.'
    );
  };

  const datePreview = useMemo(() => formatLocaleSampleDate(locale), [locale]);

  const browserLocale = useMemo(() => {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const exact = supportedLocales.find((l) => l.value === navigator.language);
      if (exact) return exact;
    }
    return null;
  }, [supportedLocales]);

  if (loading) {
    return (
      <div className="study-settings-loading" role="status" aria-live="polite" data-testid="study-display-loading">
        <Loader2 className="study-settings-spinner" size={24} />
        <span>Loading display settings...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="study-settings-error-state" role="alert" data-testid="study-display-error">
        <AlertCircle size={20} />
        <div>
          <h4>Unable to load study display settings</h4>
          <p>{loadError}</p>
          <button
            type="button"
            className="study-settings-btn study-settings-btn--outline"
            onClick={fetchDisplaySettings}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="study-settings-details" data-testid="study-settings-display">
      {!canEdit && (
        <div className="study-settings-banner study-settings-banner--info" role="status">
          <Info size={16} />
          <span>
            {isArchived
              ? 'This study is archived. Display settings are in read-only mode.'
              : 'You have read-only access to this study. Only Study Admins or Site Admins can modify study display settings.'}
          </span>
        </div>
      )}

      {saveError && (
        <div
          className="study-settings-banner study-settings-banner--error"
          role="alert"
          data-testid="study-display-save-error"
        >
          <AlertCircle size={16} />
          <span>{saveError}</span>
        </div>
      )}

      {saveSuccess && (
        <div
          className="study-settings-banner study-settings-banner--success"
          role="status"
          data-testid="study-display-save-success"
        >
          <CheckCircle2 size={16} />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Top Grid: Localization & Global Logs */}
      <div className="study-settings-grid">
        {/* Card 1: Localization */}
        <section className="study-settings-card" aria-labelledby="display-locale-heading">
          <header className="study-settings-card__header">
            <div className="study-settings-card__title-group">
              <Globe size={16} className="study-settings-card__icon" />
              <h2 id="display-locale-heading" className="study-settings-card__title">
                Date &amp; Localization Settings
              </h2>
            </div>
          </header>

          <div className="study-settings-card__body">
            <div className="study-settings-field">
              <label htmlFor="study-locale-select" className="study-settings-label">
                Language / Locale
              </label>
              <select
                id="study-locale-select"
                className="study-settings-input"
                value={locale}
                onChange={(e) => handleLocaleChange(e.target.value)}
                disabled={!canEdit || saving}
                data-testid="study-locale-select"
              >
                {supportedLocales.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="study-display-locale-preview" data-testid="study-locale-preview">
              <div className="study-display-locale-preview__row">
                <span className="study-display-locale-preview__label">Example Date:</span>
                <strong className="study-display-locale-preview__value">{datePreview.formatted}</strong>
              </div>
              <div className="study-display-locale-preview__row">
                <span className="study-display-locale-preview__label">Date Input Format:</span>
                <code className="study-display-locale-preview__code">{datePreview.placeholder}</code>
              </div>
            </div>

            {browserLocale && browserLocale.value !== locale && canEdit && (
              <div className="study-display-locale-shortcut">
                <button
                  type="button"
                  className="study-settings-btn study-settings-btn--outline study-settings-btn--sm"
                  onClick={() => handleLocaleChange(browserLocale.value)}
                  disabled={saving}
                  data-testid="use-browser-locale-btn"
                >
                  Use Browser Default ({browserLocale.label})
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Card 2: Global Logs Settings */}
        <section className="study-settings-card" aria-labelledby="display-global-logs-heading">
          <header className="study-settings-card__header">
            <div className="study-settings-card__title-group">
              <MessageSquare size={16} className="study-settings-card__icon" />
              <h2 id="display-global-logs-heading" className="study-settings-card__title">
                Global Comments &amp; Contact Logs
              </h2>
            </div>
          </header>

          <div className="study-settings-card__body">
            <div className="study-settings-checkbox-row">
              <input
                id="show-global-comments-checkbox"
                type="checkbox"
                className="study-settings-checkbox"
                checked={showGlobalComments}
                onChange={(e) => handleShowGlobalCommentsChange(e.target.checked)}
                disabled={!canEdit || saving}
                data-testid="show-global-comments-checkbox"
              />
              <label htmlFor="show-global-comments-checkbox" className="study-settings-checkbox-label">
                <strong>Show Global Logs</strong>
                <span>
                  Display global comments, emails, texts, and contact logs from other studies for shared participants.
                </span>
              </label>
            </div>

            <div className="study-settings-checkbox-row">
              <input
                id="default-global-logs-checkbox"
                type="checkbox"
                className="study-settings-checkbox"
                checked={defaultGlobalLogs}
                onChange={(e) => handleDefaultGlobalLogsChange(e.target.checked)}
                disabled={!canEdit || saving}
                data-testid="default-global-logs-checkbox"
              />
              <label htmlFor="default-global-logs-checkbox" className="study-settings-checkbox-label">
                <strong>Default &ldquo;Check&rdquo; Global for All Logs</strong>
                <span>
                  Automatically check the &ldquo;Global&rdquo; option by default when logging new comments or contacts.
                </span>
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Grid: Potential & Enrolled Participant Column Lists */}
      <div className="study-settings-grid">
        {/* Card 3: Potential Participants Column Settings */}
        <section
          className="study-settings-card"
          aria-labelledby="potential-columns-heading"
          data-testid="potential-columns-section"
        >
          <header className="study-settings-card__header">
            <div className="study-settings-card__title-group">
              <Columns size={16} className="study-settings-card__icon" />
              <h2 id="potential-columns-heading" className="study-settings-card__title">
                Potential Participants Column Settings
              </h2>
            </div>
            {canEdit && (
              <button
                type="button"
                className="study-settings-btn study-settings-btn--outline study-settings-btn--sm"
                onClick={handleAddPotentialColumn}
                disabled={saving}
                data-testid="add-potential-column-btn"
              >
                <Plus size={14} />
                <span>Add A Column</span>
              </button>
            )}
          </header>

          <div className="study-settings-card__body">
            <div className="study-settings-checkbox-row">
              <input
                id="combined-status-view-checkbox"
                type="checkbox"
                className="study-settings-checkbox"
                checked={statusPageCombinedView}
                onChange={(e) => handleCombinedStatusViewChange(e.target.checked)}
                disabled={!canEdit || saving}
                data-testid="combined-status-view-checkbox"
              />
              <label htmlFor="combined-status-view-checkbox" className="study-settings-checkbox-label">
                <strong>Combined Status View</strong>
                <span>
                  Combine all potential participant statuses into a single unified table view.
                </span>
              </label>
            </div>

            <div className="study-display-columns-list" role="list" aria-label="Potential Participant Columns">
              {potentialParticipantColumns.map((col, idx) => {
                const matchedMeta = availableColumns.find((c) => c.value === col.value);
                const tooltipText = col.title || matchedMeta?.title || undefined;
                return (
                  <div
                    key={`potential-col-${idx}`}
                    className="study-display-column-row"
                    role="listitem"
                    data-testid={`potential-column-row-${idx}`}
                  >
                    <label
                      htmlFor={`potential-column-select-${idx}`}
                      className="study-display-column-row__label"
                    >
                      Column {idx + 1}
                    </label>
                    <div className="study-display-column-row__control">
                      <select
                        id={`potential-column-select-${idx}`}
                        aria-label={`Potential Participants Column ${idx + 1}`}
                        className="study-settings-input"
                        value={col.value}
                        onChange={(e) => handlePotentialColumnChange(idx, e.target.value)}
                        disabled={!canEdit || saving}
                        data-testid={`potential-column-select-${idx}`}
                      >
                        {availableColumns.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.cId ? `${opt.label} (Custom Variable)` : opt.label}
                          </option>
                        ))}
                      </select>
                      {tooltipText && (
                        <span
                          className="study-display-column-row__tooltip"
                          title={tooltipText}
                          data-testid={`potential-column-tooltip-${idx}`}
                        >
                          <Info size={14} />
                          <span>{tooltipText}</span>
                        </span>
                      )}
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        className="study-settings-icon-btn study-settings-icon-btn--danger"
                        onClick={() => handleRemovePotentialColumn(idx)}
                        disabled={saving}
                        aria-label={`Remove Potential Column ${idx + 1}`}
                        title="Remove column"
                        data-testid={`remove-potential-column-btn-${idx}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Card 4: Enrolled Participants Column Settings */}
        <section
          className="study-settings-card"
          aria-labelledby="enrolled-columns-heading"
          data-testid="enrolled-columns-section"
        >
          <header className="study-settings-card__header">
            <div className="study-settings-card__title-group">
              <Columns size={16} className="study-settings-card__icon" />
              <h2 id="enrolled-columns-heading" className="study-settings-card__title">
                Enrolled Participants Column Settings
              </h2>
            </div>
            {canEdit && (
              <button
                type="button"
                className="study-settings-btn study-settings-btn--outline study-settings-btn--sm"
                onClick={handleAddEnrolledColumn}
                disabled={saving}
                data-testid="add-enrolled-column-btn"
              >
                <Plus size={14} />
                <span>Add A Column</span>
              </button>
            )}
          </header>

          <div className="study-settings-card__body">
            <div className="study-settings-checkbox-row">
              <input
                id="enrolled-show-events-checkbox"
                type="checkbox"
                className="study-settings-checkbox"
                checked={enrolledParticipantColumnsShowEvents}
                onChange={(e) => handleEnrolledShowEventsChange(e.target.checked)}
                disabled={!canEdit || saving}
                data-testid="enrolled-show-events-checkbox"
              />
              <label htmlFor="enrolled-show-events-checkbox" className="study-settings-checkbox-label">
                <strong>Show Events as Remaining Column Headings</strong>
                <span>
                  For the remaining columns in &ldquo;Enrolled Participants&rdquo;, choose to show &ldquo;Events&rdquo; as the headings.
                </span>
              </label>
            </div>

            <div className="study-display-columns-list" role="list" aria-label="Enrolled Participant Columns">
              {enrolledParticipantColumns.map((col, idx) => {
                const matchedMeta = availableColumns.find((c) => c.value === col.value);
                const tooltipText = col.title || matchedMeta?.title || undefined;
                return (
                  <div
                    key={`enrolled-col-${idx}`}
                    className="study-display-column-row"
                    role="listitem"
                    data-testid={`enrolled-column-row-${idx}`}
                  >
                    <label
                      htmlFor={`enrolled-column-select-${idx}`}
                      className="study-display-column-row__label"
                    >
                      Column {idx + 1}
                    </label>
                    <div className="study-display-column-row__control">
                      <select
                        id={`enrolled-column-select-${idx}`}
                        aria-label={`Enrolled Participants Column ${idx + 1}`}
                        className="study-settings-input"
                        value={col.value}
                        onChange={(e) => handleEnrolledColumnChange(idx, e.target.value)}
                        disabled={!canEdit || saving}
                        data-testid={`enrolled-column-select-${idx}`}
                      >
                        {availableColumns.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.cId ? `${opt.label} (Custom Variable)` : opt.label}
                          </option>
                        ))}
                      </select>
                      {tooltipText && (
                        <span
                          className="study-display-column-row__tooltip"
                          title={tooltipText}
                          data-testid={`enrolled-column-tooltip-${idx}`}
                        >
                          <Info size={14} />
                          <span>{tooltipText}</span>
                        </span>
                      )}
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        className="study-settings-icon-btn study-settings-icon-btn--danger"
                        onClick={() => handleRemoveEnrolledColumn(idx)}
                        disabled={saving}
                        aria-label={`Remove Enrolled Column ${idx + 1}`}
                        title="Remove column"
                        data-testid={`remove-enrolled-column-btn-${idx}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StudySettingsDisplay;
