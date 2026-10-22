// frontend/microfrontends/administration/src/components/GeneralSettingsView.tsx - US-084 General Site Settings
import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Save,
  Undo2,
  Clock,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import {
  generalSettingsApi,
} from '../../../../shared/api/generalSettingsApi';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { toast } from '../../../../shared/toaster';

export interface GeneralSettingsViewProps {
  tenantId?: string;
  isFullSiteAdmin?: boolean;
  canEdit?: boolean;
}

export const GeneralSettingsView: React.FC<GeneralSettingsViewProps> = ({
  tenantId,
  isFullSiteAdmin = true,
  canEdit,
}) => {
  const isEditable = canEdit !== undefined ? canEdit : isFullSiteAdmin;
  const [defaultTextReply, setDefaultTextReply] = useState<string>('');
  const [savedReply, setSavedReply] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await generalSettingsApi.getGeneralSettings(tenantId);
      const text = data?.defaultTextReply || '';
      setDefaultTextReply(text);
      setSavedReply(text);
      setIsDirty(false);
      setValidationError(null);
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to load general settings');
      toast.error(msg, { title: 'General Settings Error' });
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setDefaultTextReply(val);
    setIsDirty(val !== savedReply);

    if (!val || !val.trim()) {
      setValidationError('Default text reply cannot be blank');
    } else if (val.length > 160) {
      setValidationError('Default text reply cannot exceed 160 characters');
    } else {
      setValidationError(null);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = defaultTextReply.trim();
    if (!trimmed) {
      setValidationError('Default text reply cannot be blank');
      toast.warning('Default message response cannot be blank.');
      return;
    }
    if (trimmed.length > 160) {
      setValidationError('Default text reply cannot exceed 160 characters');
      toast.warning('Default message response cannot exceed 160 characters.');
      return;
    }

    try {
      setSaving(true);
      const updated = await generalSettingsApi.updateGeneralSettings(
        { defaultTextReply: trimmed },
        tenantId
      );
      const newVal = updated?.defaultTextReply || trimmed;
      setDefaultTextReply(newVal);
      setSavedReply(newVal);
      setIsDirty(false);
      setValidationError(null);
      toast.success('General site settings saved successfully.');
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to save settings');
      toast.error(msg, { title: 'Save Failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setDefaultTextReply(savedReply);
    setIsDirty(false);
    setValidationError(null);
    toast.info('Changes discarded.');
  };

  const remainingChars = 160 - defaultTextReply.length;

  if (loading) {
    return (
      <div className="sec-view-wrapper" style={{ minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#64748b' }}>
          <Clock className="animate-spin" size={32} style={{ color: '#0284c7' }} />
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>Loading general settings...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="sec-view-wrapper">
      {/* Clean Top Header Bar (Matching Legacy General Settings) */}
      <div className="sec-header-bar" style={{ paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', marginBottom: '20px' }}>
        <div className="sec-header-title-row">
          <h2 className="sec-header-title">General Settings</h2>
          {isDirty && (
            <span className="sec-dirty-pill">
              <AlertCircle size={12} aria-hidden="true" />
              Unsaved Changes
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} noValidate>
        {/* Core Field: Default Text Reply */}
        <div className="general-settings-card">
          <div className="sec-card-header">
            <div className="sec-card-icon-wrap is-blue">
              <MessageSquare size={18} aria-hidden="true" />
            </div>
            <h3 className="sec-card-title">Default Text Reply</h3>
          </div>

          <p className="sec-field-desc">
            This message is automatically sent as an SMS reply when participants send a text message to an unmonitored site phone number.
          </p>

          <div className="sec-field-group">
            <label htmlFor="defaultTextReply" className="sr-only">
              Default Text Reply
            </label>
            <textarea
              id="defaultTextReply"
              name="defaultTextReply"
              rows={3}
              maxLength={160}
              className={`general-settings-textarea ${
                validationError ? 'is-invalid' : ''
              }`}
              placeholder="Default response must not be blank"
              value={defaultTextReply}
              onChange={handleChange}
              disabled={!isEditable || saving}
              aria-invalid={!!validationError}
              aria-describedby="default-text-reply-help default-text-reply-error"
            />
          </div>

          <div className="general-settings-char-counter">
            <span id="default-text-reply-help">Standard SMS limit: 160 characters.</span>
            <span
              style={{
                fontWeight: 600,
                color:
                  remainingChars < 0
                    ? '#dc2626'
                    : remainingChars <= 20
                    ? '#d97706'
                    : '#64748b',
              }}
            >
              {remainingChars} characters remaining
            </span>
          </div>

          {validationError && (
            <div id="default-text-reply-error" className="sec-field-error-msg" role="alert">
              {validationError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="sec-bottom-action-bar" style={{ borderTop: '1px solid #f1f5f9', marginTop: '8px', paddingTop: '16px', paddingBottom: 0 }}>
            <button
              type="submit"
              className="sec-btn-save-main"
              disabled={!isDirty || saving || !defaultTextReply.trim() || !isEditable}
            >
              <Save size={15} aria-hidden="true" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
            <button
              type="button"
              className="sec-btn-discard-main"
              onClick={handleDiscard}
              disabled={!isDirty || saving}
            >
              <Undo2 size={15} aria-hidden="true" />
              <span>Discard Changes</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
