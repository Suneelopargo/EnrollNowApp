// frontend/microfrontends/administration/src/components/GeneralSettingsView.tsx - US-084 Maintain General Site Settings
import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  MessageSquare,
  Globe,
  Bell,
  Clock,
  Save,
  Undo2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  generalSettingsApi,
  GeneralSettingsResponse,
} from '../../../../shared/api/generalSettingsApi';
import { toast } from '../../../../shared/toaster';

export interface GeneralSettingsViewProps {
  tenantId?: string;
  isFullSiteAdmin?: boolean;
}

export const GeneralSettingsView: React.FC<GeneralSettingsViewProps> = ({
  tenantId,
  isFullSiteAdmin = true,
}) => {
  const [defaultTextReply, setDefaultTextReply] = useState<string>(
    'This is an automated message. We can not receive replies to this number.'
  );
  const [savedReply, setSavedReply] = useState<string>(
    'This is an automated message. We can not receive replies to this number.'
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await generalSettingsApi.getGeneralSettings(tenantId);
      const val = data?.defaultTextReply || 'This is an automated message. We can not receive replies to this number.';
      setDefaultTextReply(val);
      setSavedReply(val);
      setIsDirty(false);
      setError(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load general settings';
      toast.error(msg, { title: 'Settings Error' });
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
      setError('Default text reply cannot be blank');
    } else if (val.length > 160) {
      setError('Default text reply cannot exceed 160 characters');
    } else {
      setError(null);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = defaultTextReply.trim();
    if (!trimmed) {
      setError('Default text reply cannot be blank');
      toast.warning('Default message response cannot be blank.');
      return;
    }
    if (trimmed.length > 160) {
      setError('Default text reply cannot exceed 160 characters');
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
      setError(null);
      toast.success('General site settings saved successfully.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save settings';
      toast.error(msg, { title: 'Save Failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setDefaultTextReply(savedReply);
    setIsDirty(false);
    setError(null);
    toast.info('Changes discarded.');
  };

  const remainingChars = 160 - defaultTextReply.length;

  if (loading) {
    return (
      <div className="site-admin-card-view" style={{ minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <Clock className="animate-spin text-blue-600" size={32} />
          <p>Loading general settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="site-admin-card-view">
      {/* Header */}
      <div className="site-admin-card-view-header">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="site-admin-card-view-title">General Site Settings</h2>
            {isDirty && (
              <span className="badge badge-warning text-xs font-semibold px-2 py-0.5 rounded">
                Unsaved Changes
              </span>
            )}
          </div>
          <p className="site-admin-card-view-subtitle">
            Maintain automated message replies, default communication templates, and site operational parameters.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} noValidate>
        {/* Core Field: Default Text Reply */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm my-4">
          <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
            <MessageSquare className="text-blue-600" size={20} />
            <h3 className="text-base font-semibold text-gray-800 m-0">Default Text Reply</h3>
          </div>

          <p className="text-sm text-gray-600 mb-3">
            This message is automatically sent as an SMS reply when participants send a text message to an unmonitored site phone number.
          </p>

          <div className="mb-2">
            <label htmlFor="defaultTextReply" className="block text-sm font-medium text-gray-700 mb-1">
              Automated Response Template
            </label>
            <textarea
              id="defaultTextReply"
              name="defaultTextReply"
              rows={3}
              maxLength={160}
              className={`form-control w-full p-2.5 border rounded text-sm ${
                error ? 'is-invalid border-red-500' : 'border-gray-300'
              }`}
              placeholder="Default response must not be blank"
              value={defaultTextReply}
              onChange={handleChange}
              disabled={!isFullSiteAdmin || saving}
              aria-describedby="default-text-reply-help default-text-reply-error"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span id="default-text-reply-help">Standard SMS limit: 160 characters.</span>
            <span
              className={`font-medium ${
                remainingChars < 0
                  ? 'text-red-600'
                  : remainingChars <= 20
                  ? 'text-amber-600'
                  : 'text-gray-500'
              }`}
            >
              {remainingChars} characters remaining
            </span>
          </div>

          {error && (
            <div id="default-text-reply-error" className="flex items-center gap-1 text-red-600 text-xs mt-2">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-4">
            <button
              type="submit"
              className="btn btn-primary flex items-center gap-2"
              disabled={!isDirty || saving || !defaultTextReply.trim() || !isFullSiteAdmin}
            >
              <Save size={16} aria-hidden="true" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary flex items-center gap-2"
              onClick={handleDiscard}
              disabled={!isDirty || saving}
            >
              <Undo2 size={16} aria-hidden="true" />
              <span>Discard Changes</span>
            </button>
          </div>
        </div>
      </form>

      {/* Operational Overview Grid */}
      <h3 className="text-base font-semibold text-gray-800 mt-6 mb-3">Facility &amp; System Configuration</h3>
      <div className="site-admin-info-grid">
        <div className="site-admin-info-tile">
          <Globe size={20} className="text-blue-600 mb-1" />
          <h4>Facility Details</h4>
          <p>EnrollNow Clinical Research Center • Facility Code: SITE-001</p>
          <span className="text-xs text-gray-500">Timezone: America/New_York (EST)</span>
        </div>

        <div className="site-admin-info-tile">
          <Bell size={20} className="text-cyan-600 mb-1" />
          <h4>System Notifications</h4>
          <p>Email alerts on study enrollment milestones and protocol intake approvals.</p>
          <span className="badge badge-success mt-1">Active</span>
        </div>

        <div className="site-admin-info-tile">
          <Settings size={20} className="text-purple-600 mb-1" />
          <h4>System Maintenance</h4>
          <p>Scheduled maintenance window: Sundays 02:00 AM - 04:00 AM EST.</p>
          <span className="badge badge-neutral mt-1">Standard</span>
        </div>
      </div>
    </div>
  );
};
