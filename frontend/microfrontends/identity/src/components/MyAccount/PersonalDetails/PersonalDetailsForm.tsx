// frontend/microfrontends/identity/src/components/MyAccount/PersonalDetails/PersonalDetailsForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, accountApi, UpdateUserProfilePayload } from '../../../../../../shared/api/accountApi';
import { toast } from '../../../../../../shared/toaster';
import { UpdateEmailModal } from './UpdateEmailModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { Send, Check } from 'lucide-react';

export interface PersonalDetailsFormProps {
  profile: UserProfile;
  prevLogin?: string | null;
  onProfileUpdated: (updated: UserProfile) => void;
  onRefreshRequested: () => void;
}

export const PersonalDetailsForm: React.FC<PersonalDetailsFormProps> = ({
  profile,
  prevLogin,
  onProfileUpdated,
  onRefreshRequested,
}) => {
  const [formData, setFormData] = useState<UpdateUserProfilePayload>({
    title: profile.title || '',
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    phoneNumber: profile.phoneNumber || '',
    timezone: profile.timezone || 'UTC',
    ignoreTimezoneMismatch: profile.ignoreTimezoneMismatch,
  });

  const [isUpdateEmailOpen, setIsUpdateEmailOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSendingDigest, setIsSendingDigest] = useState(false);
  const [digestSent, setDigestSent] = useState(false);

  // Timezones list from browser IANA supported values
  const timezones = React.useMemo(() => {
    try {
      if (typeof Intl !== 'undefined' && typeof (Intl as any).supportedValuesOf === 'function') {
        return (Intl as any).supportedValuesOf('timeZone') as string[];
      }
    } catch {
      // fallback
    }
    return [
      'UTC',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Phoenix',
      'America/Anchorage',
      'Pacific/Honolulu',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Kolkata',
      'Asia/Calcutta',
      'Asia/Singapore',
      'Australia/Sydney',
    ];
  }, []);

  // Update local state when prop changes
  useEffect(() => {
    setFormData({
      title: profile.title || '',
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phoneNumber: profile.phoneNumber || '',
      timezone: profile.timezone || 'UTC',
      ignoreTimezoneMismatch: profile.ignoreTimezoneMismatch,
    });
  }, [profile]);

  // Format previous login text
  const prevLoginFormatted = React.useMemo(() => {
    if (!prevLogin) return null;
    try {
      const d = new Date(prevLogin);
      const optionsDate: Intl.DateTimeFormatOptions = {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: profile.timezone || undefined,
      };
      const optionsTime: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: profile.timezone || undefined,
      };
      const dateStr = new Intl.DateTimeFormat('en-US', optionsDate).format(d);
      const timeStr = new Intl.DateTimeFormat('en-US', optionsTime).format(d);
      return `Previously logged in on ${dateStr} at ${timeStr}`;
    } catch {
      return null;
    }
  }, [prevLogin, profile.timezone]);

  // Debounce saving changes to backend
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const saveUpdates = async (newPayload: UpdateUserProfilePayload) => {
    if (!newPayload.firstName?.trim() || !newPayload.lastName?.trim()) {
      return;
    }

    try {
      const updated = await accountApi.updateProfile(newPayload);
      onProfileUpdated(updated);
      toast.success('Saved');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile settings');
    }
  };

  const handleFieldChange = (field: keyof UpdateUserProfilePayload, value: any) => {
    const next = { ...formData, [field]: value };
    setFormData(next);

    if (field === 'timezone' || field === 'ignoreTimezoneMismatch') {
      // Instant save for timezone and checkbox
      saveUpdates(next);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Auto-save debounced by 500ms for text fields
    debounceTimerRef.current = setTimeout(() => {
      saveUpdates(next);
    }, 500);
  };

  const handleSendDigestNow = async () => {
    setIsSendingDigest(true);
    try {
      await accountApi.sendDailyDigestNow();
      setDigestSent(true);
      toast.success('Daily digest triggered successfully');
      setTimeout(() => setDigestSent(false), 4000);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to send daily digest');
    } finally {
      setIsSendingDigest(false);
    }
  };

  return (
    <div className="account-personal-details-section">
      <div className="account-section-heading-wrapper">
        <h2 className="account-section-heading">Personal Details</h2>
        {prevLoginFormatted && (
          <span className="account-prev-login-text">{prevLoginFormatted}</span>
        )}
      </div>

      <div className="account-form-grid">
        {/* Email Row */}
        <div className="account-form-row">
          <div className="account-form-label-col">
            <label className="account-form-label" htmlFor="account-email-display">
              Email (username)
            </label>
            <div>
              {profile.emailVerified ? (
                <span className="account-badge-verified">Verified</span>
              ) : (
                <span className="account-badge-unverified">Not Verified</span>
              )}
            </div>
          </div>
          <div className="account-form-field-col">
            <div id="account-email-display" className="account-email-readonly-field">
              {profile.email}
            </div>
            <button
              type="button"
              className="account-btn-blue account-btn-update-email"
              onClick={() => setIsUpdateEmailOpen(true)}
            >
              Update Email
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="account-form-row">
          <div className="account-form-label-col">
            <label className="account-form-label" htmlFor="account-title-input">
              Title
            </label>
          </div>
          <div className="account-form-field-col">
            <input
              id="account-title-input"
              type="text"
              className="account-input"
              value={formData.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              maxLength={50}
            />
          </div>
        </div>

        {/* First Name */}
        <div className="account-form-row">
          <div className="account-form-label-col">
            <label className="account-form-label" htmlFor="account-firstname-input">
              First Name
            </label>
          </div>
          <div className="account-form-field-col">
            <input
              id="account-firstname-input"
              type="text"
              className="account-input"
              value={formData.firstName || ''}
              onChange={(e) => handleFieldChange('firstName', e.target.value)}
              required
              maxLength={100}
            />
          </div>
        </div>

        {/* Last Name */}
        <div className="account-form-row">
          <div className="account-form-label-col">
            <label className="account-form-label" htmlFor="account-lastname-input">
              Last Name
            </label>
          </div>
          <div className="account-form-field-col">
            <input
              id="account-lastname-input"
              type="text"
              className="account-input"
              value={formData.lastName || ''}
              onChange={(e) => handleFieldChange('lastName', e.target.value)}
              required
              maxLength={100}
            />
          </div>
        </div>

        {/* Phone Number */}
        <div className="account-form-row">
          <div className="account-form-label-col">
            <label className="account-form-label" htmlFor="account-phone-input">
              Phone Number
            </label>
          </div>
          <div className="account-form-field-col">
            <input
              id="account-phone-input"
              type="tel"
              className="account-input"
              placeholder="e.g. +1 (555) 123-4567"
              value={formData.phoneNumber || ''}
              onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
              maxLength={50}
            />
          </div>
        </div>

        {/* Password */}
        <div className="account-form-row">
          <div className="account-form-label-col">
            <label className="account-form-label">Password</label>
          </div>
          <div className="account-form-field-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="account-btn-blue account-btn-change-password"
                onClick={() => setIsChangePasswordOpen(true)}
              >
                Change Password
              </button>
              {profile.passwordExpiringDays !== null &&
                profile.passwordExpiringDays !== undefined &&
                profile.passwordExpiringDays < 7 && (
                  <span className="account-password-expiring-alert">
                    Your Password Expires in: {profile.passwordExpiringDays} Days
                  </span>
                )}
            </div>
          </div>
        </div>

        {/* Time Zone */}
        <div className="account-form-row">
          <div className="account-form-label-col">
            <label className="account-form-label" htmlFor="account-timezone-select">
              Time Zone
            </label>
          </div>
          <div className="account-form-field-col">
            <select
              id="account-timezone-select"
              className="account-input account-select"
              value={formData.timezone || 'UTC'}
              onChange={(e) => handleFieldChange('timezone', e.target.value)}
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ignore Timezone Discrepancy */}
        <div className="account-form-row">
          <div className="account-form-label-col">
            <label htmlFor="ignore-timezone-checkbox" className="account-form-label account-label-multiline">
              Ignore Timezone<br />Discrepancy On Login
            </label>
          </div>
          <div className="account-form-field-col">
            <div className="account-checkbox-row">
              <input
                id="ignore-timezone-checkbox"
                type="checkbox"
                className="account-checkbox"
                checked={formData.ignoreTimezoneMismatch || false}
                onChange={(e) => handleFieldChange('ignoreTimezoneMismatch', e.target.checked)}
              />
            </div>
          </div>
        </div>

        {/* Development Tool: Send Daily Digest Now */}
        <div className="account-form-row account-digest-tool-row">
          <div className="account-form-label-col" />
          <div className="account-form-field-col">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleSendDigestNow}
              disabled={isSendingDigest || digestSent}
              title="Trigger immediate daily digest generation (Dev / Staging environments)"
            >
              {digestSent ? (
                <>
                  <Check size={14} aria-hidden="true" style={{ marginRight: '6px', color: '#16a34a' }} />
                  Digest Sent!
                </>
              ) : (
                <>
                  <Send size={14} aria-hidden="true" style={{ marginRight: '6px' }} />
                  {isSendingDigest ? 'Sending Daily Digest...' : 'Send Daily Digest Now'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <UpdateEmailModal
        isOpen={isUpdateEmailOpen}
        currentEmail={profile.email}
        onClose={() => setIsUpdateEmailOpen(false)}
        onSuccess={onRefreshRequested}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onSuccess={onRefreshRequested}
      />
    </div>
  );
};
