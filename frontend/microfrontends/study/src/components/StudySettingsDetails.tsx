// frontend/microfrontends/study/src/components/StudySettingsDetails.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Download,
  Upload,
  Plus,
  Trash2,
  Loader2,
  Lock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  studyApi,
  StudyDetails,
  StudyGrant,
  UpdateStudyDetailsPayload,
} from '../../../../shared/api/studyApi';
import { toast } from '../../../../shared/toaster';

export interface StudySettingsDetailsProps {
  studyId: string;
  studyName: string;
  isArchived?: boolean;
  canManageSettings?: boolean;
  onStudyUpdated?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

interface FormState {
  name: string;
  longName: string;
  description: string;
  recruitmentStartDate: string;
  recruitmentEndDate: string;
  completionDate: string;
  studyUrl: string;
  studyUrlLabel: string;
  allowParticipationInOtherStudies: boolean;
  customIdGenerationEnabled: boolean;
  prefix: string;
  irbId: string;
  grants: StudyGrant[];
}

const initialFormState: FormState = {
  name: '',
  longName: '',
  description: '',
  recruitmentStartDate: '',
  recruitmentEndDate: '',
  completionDate: '',
  studyUrl: '',
  studyUrlLabel: '',
  allowParticipationInOtherStudies: true,
  customIdGenerationEnabled: false,
  prefix: '',
  irbId: '',
  grants: [],
};

interface ImportCategory {
  key: string;
  label: string;
  items: any[];
  getName: (item: any) => string;
}

export const StudySettingsDetails: React.FC<StudySettingsDetailsProps> = ({
  studyId,
  studyName,
  isArchived = false,
  canManageSettings = true,
  onStudyUpdated,
  onDirtyChange,
}) => {
  const [details, setDetails] = useState<StudyDetails | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [initialLoadedForm, setInitialLoadedForm] = useState<FormState>(initialFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [importCategories, setImportCategories] = useState<ImportCategory[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isReadOnly = useMemo(() => {
    return isArchived || !canManageSettings || (details !== null && !details.canManage);
  }, [isArchived, canManageSettings, details]);

  const loadDetails = useCallback(async () => {
    if (!studyId) return;
    setLoading(true);
    try {
      const data = await studyApi.getStudyDetails(studyId);
      setDetails(data);

      const mapped: FormState = {
        name: data.name || '',
        longName: data.longName || '',
        description: data.description || '',
        recruitmentStartDate: data.recruitmentStartDate || '',
        recruitmentEndDate: data.recruitmentEndDate || '',
        completionDate: data.completionDate || '',
        studyUrl: data.studyUrl || '',
        studyUrlLabel: data.studyUrlLabel || '',
        allowParticipationInOtherStudies: data.allowParticipationInOtherStudies ?? true,
        customIdGenerationEnabled: data.customIdGenerationEnabled ?? false,
        prefix: data.prefix || '',
        irbId: data.irbId || '',
        grants: (data.grants || []).map((g) => ({
          id: g.id,
          grantNumber: g.grantNumber || '',
          agency: g.agency || '',
        })),
      };

      setForm(mapped);
      setInitialLoadedForm(mapped);
      setFieldErrors({});
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to load study details.');
    } finally {
      setLoading(false);
    }
  }, [studyId]);

  // Dirty state calculation
  const isDirty = useMemo(() => {
    if (loading) return false;
    const baseChanged =
      form.name !== initialLoadedForm.name ||
      form.longName !== initialLoadedForm.longName ||
      form.description !== initialLoadedForm.description ||
      form.recruitmentStartDate !== initialLoadedForm.recruitmentStartDate ||
      form.recruitmentEndDate !== initialLoadedForm.recruitmentEndDate ||
      form.completionDate !== initialLoadedForm.completionDate ||
      form.studyUrl !== initialLoadedForm.studyUrl ||
      form.studyUrlLabel !== initialLoadedForm.studyUrlLabel ||
      form.allowParticipationInOtherStudies !== initialLoadedForm.allowParticipationInOtherStudies ||
      form.customIdGenerationEnabled !== initialLoadedForm.customIdGenerationEnabled ||
      form.prefix !== initialLoadedForm.prefix ||
      form.irbId !== initialLoadedForm.irbId;

    if (baseChanged) return true;

    if (form.grants.length !== initialLoadedForm.grants.length) return true;
    for (let i = 0; i < form.grants.length; i++) {
      if (
        form.grants[i].grantNumber !== initialLoadedForm.grants[i].grantNumber ||
        form.grants[i].agency !== initialLoadedForm.grants[i].agency
      ) {
        return true;
      }
    }
    return false;
  }, [form, initialLoadedForm, loading]);

  const isDirtyRef = useRef(false);
  isDirtyRef.current = isDirty;
  const prevStudyIdRef = useRef<string>(studyId);

  useEffect(() => {
    if (prevStudyIdRef.current !== studyId) {
      if (isDirtyRef.current) {
        const proceed = window.confirm(
          'You have unsaved changes in Study Details. Are you sure you want to discard your changes and switch studies?'
        );
        if (!proceed) {
          return;
        }
      }
      prevStudyIdRef.current = studyId;
    }
    loadDetails();
  }, [studyId, loadDetails]);

  // Notify parent on dirty change
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // BeforeUnload navigation guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Field change handler
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name === 'customIdGenerationEnabled') {
      setForm((prev) => ({
        ...prev,
        customIdGenerationEnabled: checked,
        prefix: checked ? prev.prefix : '',
      }));
    } else if (name === 'prefix') {
      const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
      setForm((prev) => ({
        ...prev,
        prefix: upper,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Grants management
  const handleAddGrant = () => {
    setForm((prev) => ({
      ...prev,
      grants: [...prev.grants, { grantNumber: '', agency: '' }],
    }));
  };

  const handleGrantChange = (
    index: number,
    field: 'grantNumber' | 'agency',
    value: string
  ) => {
    setForm((prev) => {
      const nextGrants = [...prev.grants];
      nextGrants[index] = { ...nextGrants[index], [field]: value };
      return { ...prev, grants: nextGrants };
    });
  };

  const handleRemoveGrant = (index: number) => {
    setForm((prev) => {
      const nextGrants = [...prev.grants];
      nextGrants.splice(index, 1);
      return { ...prev, grants: nextGrants };
    });
  };

  // Validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    const shortName = form.name.trim();
    if (!shortName) {
      errors.name = 'Short Study Name is required.';
    } else if (shortName.length > 15) {
      errors.name = 'Short Study Name must be 15 characters or less.';
    } else if (!/^[a-zA-Z0-9 ]+$/.test(shortName)) {
      errors.name = 'Short Study Name may only contain alphanumeric characters and spaces.';
    }

    if (form.recruitmentStartDate && form.recruitmentEndDate) {
      if (new Date(form.recruitmentEndDate) < new Date(form.recruitmentStartDate)) {
        errors.recruitmentEndDate = 'End Date cannot be earlier than Start Date.';
      }
    }

    if (form.customIdGenerationEnabled) {
      const pref = form.prefix.trim();
      if (!pref) {
        errors.prefix = 'Study Prefix is required when Custom ID Autogeneration is enabled.';
      } else if (pref.length > 5) {
        errors.prefix = 'Study Prefix must be 5 characters or less.';
      } else if (!/^[A-Z0-9]+$/.test(pref)) {
        errors.prefix = 'Study Prefix may only contain uppercase alphanumeric characters.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Discard changes
  const handleDiscard = () => {
    setForm(initialLoadedForm);
    setFieldErrors({});
  };

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || saving) return;

    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      const payload: UpdateStudyDetailsPayload = {
        name: form.name.trim(),
        longName: form.longName.trim() || undefined,
        description: form.description.trim() || undefined,
        recruitmentStartDate: form.recruitmentStartDate || undefined,
        recruitmentEndDate: form.recruitmentEndDate || undefined,
        completionDate: form.completionDate || undefined,
        studyUrl: form.studyUrl.trim() || undefined,
        studyUrlLabel: form.studyUrlLabel.trim() || undefined,
        allowParticipationInOtherStudies: form.allowParticipationInOtherStudies,
        customIdGenerationEnabled: form.customIdGenerationEnabled,
        prefix: form.customIdGenerationEnabled ? form.prefix.trim() : undefined,
        irbId: form.irbId.trim() || undefined,
        grants: form.grants
          .filter((g) => g.grantNumber.trim() !== '' || g.agency.trim() !== '')
          .map((g) => ({
            id: g.id,
            grantNumber: g.grantNumber.trim(),
            agency: g.agency.trim(),
          })),
      };

      const updated = await studyApi.updateStudyDetails(studyId, payload);
      setDetails(updated);

      const mapped: FormState = {
        name: updated.name || '',
        longName: updated.longName || '',
        description: updated.description || '',
        recruitmentStartDate: updated.recruitmentStartDate || '',
        recruitmentEndDate: updated.recruitmentEndDate || '',
        completionDate: updated.completionDate || '',
        studyUrl: updated.studyUrl || '',
        studyUrlLabel: updated.studyUrlLabel || '',
        allowParticipationInOtherStudies: updated.allowParticipationInOtherStudies ?? true,
        customIdGenerationEnabled: updated.customIdGenerationEnabled ?? false,
        prefix: updated.prefix || '',
        irbId: updated.irbId || '',
        grants: (updated.grants || []).map((g) => ({
          id: g.id,
          grantNumber: g.grantNumber || '',
          agency: g.agency || '',
        })),
      };

      setForm(mapped);
      setInitialLoadedForm(mapped);
      toast.success('Study details updated successfully.');
      onStudyUpdated?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update study details.');
    } finally {
      setSaving(false);
    }
  };

  // Export Study
  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const exportData = await studyApi.exportStudy(studyId);
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `${(form.name || studyName || 'study').replace(/[^a-zA-Z0-9_-]/g, '_')}_export.json`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to export study.');
    } finally {
      setExporting(false);
    }
  };

  // Import Study Components (Incremental Import)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith('.json')) {
        toast.error('Please select a valid .json file.');
        return;
      }
      setImportFile(selected);

      try {
        const text = await selected.text();
        const parsed = JSON.parse(text);
        setParsedData(parsed);

        const cats: ImportCategory[] = [
          { key: 'surveys', label: 'Surveys', items: parsed.surveys ?? [], getName: (i: any) => i.name || 'Unnamed Survey' },
          { key: 'statuses', label: 'Statuses', items: parsed.statuses ?? [], getName: (i: any) => i.name || 'Unnamed Status' },
          { key: 'customVariables', label: 'Custom Variables', items: parsed.customVariables ?? [], getName: (i: any) => i.name || 'Unnamed Variable' },
          { key: 'contactRelationships', label: 'Contact Relationships', items: parsed.contactRelationships ?? [], getName: (i: any) => i.relationship || i.name || 'Unnamed Relationship' },
          { key: 'contactOutcomes', label: 'Contact Outcomes', items: parsed.contactOutcomes ?? [], getName: (i: any) => i.outcome || i.name || 'Unnamed Outcome' },
          { key: 'emailTemplates', label: 'Email Templates', items: parsed.emailTemplates ?? [], getName: (i: any) => i.name || 'Unnamed Template' },
          { key: 'textTemplates', label: 'Text Templates', items: parsed.textTemplates ?? [], getName: (i: any) => i.name || 'Unnamed Template' },
        ].filter((cat) => cat.items.length > 0);

        setImportCategories(cats);

        // Select all items by default for user convenience
        const initialSelections: Record<string, boolean> = {};
        cats.forEach((cat) => {
          cat.items.forEach((_, idx) => {
            initialSelections[`${cat.key}_${idx}`] = true;
          });
        });
        setSelectedItems(initialSelections);
        if (cats.length > 0) {
          setOpenCategory(cats[0].key);
        }
      } catch (parseErr: any) {
        toast.error('File contents lack proper JSON format, please try again.');
        setParsedData(null);
        setImportCategories([]);
        setSelectedItems({});
      }
    }
  };

  const handleToggleItem = (key: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleToggleCategory = (catKey: string, items: any[]) => {
    const allSelected = items.every((_, idx) => selectedItems[`${catKey}_${idx}`]);
    setSelectedItems((prev) => {
      const next = { ...prev };
      items.forEach((_, idx) => {
        next[`${catKey}_${idx}`] = !allSelected;
      });
      return next;
    });
  };

  const totalSelectedCount = useMemo(() => {
    return Object.values(selectedItems).filter(Boolean).length;
  }, [selectedItems]);

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile || !parsedData) return;

    if (totalSelectedCount === 0) {
      toast.error('Please select at least one component to import.');
      return;
    }

    setImporting(true);
    try {
      const componentsToImport: Record<string, any[]> = {};
      importCategories.forEach((cat) => {
        const selected = cat.items.filter((_, idx) => selectedItems[`${cat.key}_${idx}`]);
        if (selected.length > 0) {
          componentsToImport[cat.key] = selected;
        }
      });

      await studyApi.importStudyComponents(studyId, componentsToImport);
      setShowImportModal(false);
      setImportFile(null);
      setParsedData(null);
      setImportCategories([]);
      setSelectedItems({});
      toast.success('Successfully imported unique study components.');
      await loadDetails();
      onStudyUpdated?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to import study components.');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="study-settings-details__loading" role="status">
        <Loader2 className="study-spinner" size={22} />
        <span>Loading study details…</span>
      </div>
    );
  }

  return (
    <div className="study-settings-details" data-testid="study-settings-details">
      {/* Header Bar matching Reference Image 3 */}
      <div className="study-settings-details__header">
        <h2 className="study-settings-details__title">Study Details</h2>

        <div className="study-settings-details__header-actions">
          {!isReadOnly && (
            <button
              type="button"
              className="study-settings-btn study-settings-btn--primary"
              onClick={() => setShowImportModal(true)}
              data-testid="import-components-btn"
            >
              <Upload size={14} />
              <span>Import Study Components</span>
            </button>
          )}

          <button
            type="button"
            className="study-settings-btn study-settings-btn--primary"
            onClick={handleExport}
            disabled={exporting}
            data-testid="export-study-btn"
          >
            {exporting ? <Loader2 className="study-spinner" size={14} /> : <Download size={14} />}
            <span>Export Study</span>
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {isReadOnly && (
        <div className="study-alert study-alert--info" role="status">
          <Lock size={15} />
          <span>
            {isArchived
              ? 'This study is archived. Study details are in read-only preservation mode.'
              : 'You have read-only access to this study. Only Study Admins or Site Administrators can modify details.'}
          </span>
        </div>
      )}

      {/* Main Form: 2-Column Layout matching Reference Image 3 (No Scroll) */}
      <form onSubmit={handleSave} className="study-settings-form" noValidate>
        {/* Section 1: Study Details (Compact 2-Column Split) */}
        <div className="study-settings-card">
          <div className="study-settings-card__split">
            {/* Left Column: Short Name, Long Name, Description, Dates */}
            <div className="study-settings-col study-settings-col--left">
              {/* Short Study Name */}
              <div className="study-form-group">
                <label htmlFor="study-details-short-name" className="study-form-label">
                  Short Study Name <span className="study-required-marker">*</span>
                </label>
                <input
                  id="study-details-short-name"
                  name="name"
                  type="text"
                  placeholder="e.g. MySampleTest"
                  className={`study-form-input ${fieldErrors.name ? 'study-form-input--error' : ''}`}
                  value={form.name}
                  onChange={handleInputChange}
                  maxLength={15}
                  disabled={isReadOnly}
                  aria-required="true"
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? 'study-name-error' : undefined}
                />
                {fieldErrors.name && (
                  <span id="study-name-error" className="study-field-error" role="alert">
                    {fieldErrors.name}
                  </span>
                )}
              </div>

              {/* Study Name */}
              <div className="study-form-group">
                <label htmlFor="study-details-long-name" className="study-form-label">
                  Study Name
                </label>
                <input
                  id="study-details-long-name"
                  name="longName"
                  type="text"
                  placeholder="Full title of the study protocol"
                  className="study-form-input"
                  value={form.longName}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                />
              </div>

              {/* Study Description */}
              <div className="study-form-group">
                <label htmlFor="study-details-description" className="study-form-label">
                  Study Description
                </label>
                <textarea
                  id="study-details-description"
                  name="description"
                  rows={2}
                  placeholder="Brief protocol overview"
                  className="study-form-textarea study-form-textarea--compact"
                  value={form.description}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                />
              </div>

              {/* Recruitment Dates in a compact 3-column row */}
              <div className="study-dates-row">
                <div className="study-form-group">
                  <label htmlFor="study-details-start-date" className="study-form-label study-form-label--sm">
                    Active Recruitment Start Date
                  </label>
                  <input
                    id="study-details-start-date"
                    name="recruitmentStartDate"
                    type="date"
                    className="study-form-input study-form-input--date"
                    value={form.recruitmentStartDate}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="study-form-group">
                  <label htmlFor="study-details-end-date" className="study-form-label study-form-label--sm">
                    Active Recruitment End Date
                  </label>
                  <input
                    id="study-details-end-date"
                    name="recruitmentEndDate"
                    type="date"
                    className={`study-form-input study-form-input--date ${fieldErrors.recruitmentEndDate ? 'study-form-input--error' : ''}`}
                    value={form.recruitmentEndDate}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                    aria-invalid={Boolean(fieldErrors.recruitmentEndDate)}
                    aria-describedby={fieldErrors.recruitmentEndDate ? 'recruitment-end-date-error' : undefined}
                  />
                  {fieldErrors.recruitmentEndDate && (
                    <span id="recruitment-end-date-error" className="study-field-error" role="alert">
                      {fieldErrors.recruitmentEndDate}
                    </span>
                  )}
                </div>

                <div className="study-form-group">
                  <label htmlFor="study-details-completion-date" className="study-form-label study-form-label--sm">
                    Study Completion Date
                  </label>
                  <input
                    id="study-details-completion-date"
                    name="completionDate"
                    type="date"
                    className="study-form-input study-form-input--date"
                    value={form.completionDate}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>

            {/* Vertical Divider Line */}
            <div className="study-settings-divider" aria-hidden="true" />

            {/* Right Column: Header URL, URL Label, Checkbox */}
            <div className="study-settings-col study-settings-col--right">
              {/* Header URL */}
              <div className="study-form-group">
                <label htmlFor="study-details-url" className="study-form-label">
                  Header URL
                </label>
                <input
                  id="study-details-url"
                  name="studyUrl"
                  type="url"
                  placeholder="https://"
                  className="study-form-input"
                  value={form.studyUrl}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                />
              </div>

              {/* URL Label */}
              <div className="study-form-group">
                <label htmlFor="study-details-url-label" className="study-form-label">
                  URL Label
                </label>
                <input
                  id="study-details-url-label"
                  name="studyUrlLabel"
                  type="text"
                  placeholder="e.g. Study Web Portal"
                  className="study-form-input"
                  value={form.studyUrlLabel}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                />
              </div>

              {/* Checkbox: Allow participation in other studies */}
              <div className="study-form-checkbox-group">
                <label className="study-checkbox-label">
                  <input
                    id="study-details-allow-other-studies"
                    name="allowParticipationInOtherStudies"
                    type="checkbox"
                    className="study-checkbox-input"
                    checked={form.allowParticipationInOtherStudies}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                  />
                  <span>Allow study participants to be active in other studies</span>
                </label>
              </div>

              {/* Checkbox: Enable Custom ID Autogeneration */}
              <div className="study-form-checkbox-group">
                <label className="study-checkbox-label">
                  <input
                    id="study-details-custom-id"
                    name="customIdGenerationEnabled"
                    type="checkbox"
                    className="study-checkbox-input"
                    checked={form.customIdGenerationEnabled}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                  />
                  <span>Enable Custom ID Autogeneration</span>
                </label>
              </div>

              {/* Study Prefix (shown when Custom ID Autogeneration is enabled) */}
              {form.customIdGenerationEnabled && (
                <div className="study-form-group">
                  <label htmlFor="study-details-prefix" className="study-form-label">
                    Study Prefix <span className="study-required-marker">*</span>
                  </label>
                  <input
                    id="study-details-prefix"
                    name="prefix"
                    type="text"
                    placeholder="e.g. STU01"
                    value={form.prefix}
                    onChange={handleInputChange}
                    maxLength={5}
                    disabled={isReadOnly}
                    className={`study-form-input study-input--uppercase ${fieldErrors.prefix ? 'study-form-input--error' : ''}`}
                    aria-required="true"
                    aria-invalid={Boolean(fieldErrors.prefix)}
                    aria-describedby={fieldErrors.prefix ? 'study-prefix-error' : undefined}
                  />
                  {fieldErrors.prefix && (
                    <span id="study-prefix-error" className="study-field-error" role="alert">
                      {fieldErrors.prefix}
                    </span>
                  )}
                  <span className="study-field-hint">
                    Maximum 5 uppercase alphanumeric characters. Unique per study.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Regulatory & Funding (matching Reference Image 3) */}
        <div className="study-settings-card study-settings-card--funding">
          <div className="study-settings-card__header">
            <h3 className="study-settings-card__title">Regulatory &amp; Funding</h3>
          </div>
          <div className="study-settings-card__body">
            <div className="study-form-group study-form-group--max-360">
              <label htmlFor="study-details-irb-id" className="study-form-label">
                IRB Approved # / ID
              </label>
              <input
                id="study-details-irb-id"
                name="irbId"
                type="text"
                placeholder="IRB Number"
                className="study-form-input"
                value={form.irbId}
                onChange={handleInputChange}
                disabled={isReadOnly}
              />
            </div>

            {/* Grants Section */}
            <div className="study-grants-section">
              {!isReadOnly && (
                <button
                  type="button"
                  className="study-settings-btn study-settings-btn--primary study-grants-add-btn"
                  onClick={handleAddGrant}
                  data-testid="add-grant-btn"
                >
                  <Plus size={14} />
                  <span>Add new grant</span>
                </button>
              )}

              {form.grants.length > 0 && (
                <div className="study-grants-table-wrapper">
                  <table className="study-grants-table" aria-label="Study Grants Table">
                    <thead>
                      <tr>
                        <th scope="col" className="study-table__col-45">Grant #</th>
                        <th scope="col" className="study-table__col-45">Granting Agency</th>
                        <th scope="col" className="study-table__col-10 study-table__col--center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.grants.map((grant, index) => (
                        <tr key={grant.id || `grant-${index}`}>
                          <td>
                            <input
                              type="text"
                              aria-label={`Grant number ${index + 1}`}
                              placeholder="e.g. R01-HL123456"
                              className="study-form-input study-form-input--sm"
                              value={grant.grantNumber}
                              onChange={(e) => handleGrantChange(index, 'grantNumber', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              aria-label={`Granting agency ${index + 1}`}
                              placeholder="e.g. NIH / NHLBI"
                              className="study-form-input study-form-input--sm"
                              value={grant.agency}
                              onChange={(e) => handleGrantChange(index, 'agency', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="study-table__col--center">
                            {!isReadOnly && (
                              <button
                                type="button"
                                className="study-grant-delete-btn"
                                onClick={() => handleRemoveGrant(index)}
                                aria-label={`Delete grant ${index + 1}`}
                                title="Delete grant"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {!isReadOnly && (
          <div className="study-settings-footer-actions">
            <button
              type="button"
              className="study-settings-btn study-settings-btn--secondary"
              onClick={handleDiscard}
              disabled={!isDirty || saving}
              data-testid="discard-changes-btn"
            >
              Discard Changes
            </button>

            <button
              type="submit"
              className="study-settings-btn study-settings-btn--primary"
              disabled={!isDirty || saving}
              data-testid="save-changes-btn"
            >
              {saving ? (
                <>
                  <Loader2 className="study-spinner" size={14} />
                  <span>Saving…</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        )}
      </form>

      {/* Import Modal */}
      {showImportModal && (
        <div className="study-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="import-modal-title">
          <div className="study-modal study-modal--wide">
            <div className="study-modal__header">
              <h3 id="import-modal-title">Import Study Components</h3>
              <button
                type="button"
                className="study-modal__close-btn"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setParsedData(null);
                  setImportCategories([]);
                  setSelectedItems({});
                }}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleImportSubmit}>
              <div className="study-modal__body">
                <p className="study-modal__description">
                  Select an exported study component JSON file to selectively import into{' '}
                  <strong>{form.name || studyName}</strong>.
                </p>

                <div className="study-file-dropzone">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="study-file-input"
                    onChange={handleFileChange}
                    id="study-import-file-input"
                  />
                  <label htmlFor="study-import-file-input" className="study-file-label">
                    <Upload size={20} />
                    <span>{importFile ? importFile.name : 'Choose .json file'}</span>
                  </label>
                </div>

                {importFile && importCategories.length === 0 && (
                  <p className="study-field-hint study-field-hint--mt-8">
                    No importable components found in this file.
                  </p>
                )}

                {importCategories.length > 0 && (
                  <div className="study-import-categories">
                    <div className="study-import-categories__header">
                      <span>Select Components to Import:</span>
                      <span className="study-import-count">
                        {totalSelectedCount} component{totalSelectedCount === 1 ? '' : 's'} selected
                      </span>
                    </div>

                    <div className="study-import-categories__list">
                      {importCategories.map((cat) => {
                        const isOpen = openCategory === cat.key;
                        const catSelectedCount = cat.items.filter(
                          (_, idx) => selectedItems[`${cat.key}_${idx}`]
                        ).length;
                        const allSelected =
                          cat.items.length > 0 && catSelectedCount === cat.items.length;

                        return (
                          <div key={cat.key} className="study-import-category-card">
                            <div className="study-import-category-card__header">
                              <label
                                className="study-import-checkbox-label"
                                title={`Select all ${cat.label}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={allSelected}
                                  onChange={() => handleToggleCategory(cat.key, cat.items)}
                                />
                                <strong>{cat.label}</strong>
                              </label>

                              <div className="study-import-category-card__meta">
                                <span className="study-badge">
                                  {catSelectedCount} / {cat.items.length}
                                </span>
                                <button
                                  type="button"
                                  className="study-category-toggle-btn"
                                  onClick={() => setOpenCategory(isOpen ? null : cat.key)}
                                  aria-expanded={isOpen}
                                  aria-label={`Toggle ${cat.label} list`}
                                >
                                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                              </div>
                            </div>

                            {isOpen && (
                              <ul className="study-import-items-list">
                                {cat.items.map((item, idx) => {
                                  const itemKey = `${cat.key}_${idx}`;
                                  const checked = Boolean(selectedItems[itemKey]);

                                  return (
                                    <li key={itemKey} className="study-import-item">
                                      <label className="study-import-item-label">
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() => handleToggleItem(itemKey)}
                                        />
                                        <span>{cat.getName(item)}</span>
                                      </label>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <p className="study-import-note">
                      <strong>Note:</strong> If importing surveys, be sure to import any linked custom
                      variables within the survey as well.
                    </p>
                  </div>
                )}
              </div>
              <div className="study-modal__footer">
                <button
                  type="button"
                  className="study-settings-btn study-settings-btn--secondary"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setParsedData(null);
                    setImportCategories([]);
                    setSelectedItems({});
                  }}
                  disabled={importing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="study-settings-btn study-settings-btn--primary"
                  disabled={!importFile || totalSelectedCount === 0 || importing}
                  data-testid="submit-incremental-import-btn"
                >
                  {importing ? (
                    <>
                      <Loader2 className="study-spinner" size={14} />
                      <span>Importing…</span>
                    </>
                  ) : (
                    <span>
                      Import {totalSelectedCount > 0 ? `(${totalSelectedCount} Selected)` : 'Components'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudySettingsDetails;
