// frontend/microfrontends/administration/src/components/SecurityView.tsx - US-065 Site Security Policy
import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Key,
  ShieldCheck,
  Info,
  RotateCcw,
  Save,
  Undo2,
  X,
  AlertCircle,
  Clock,
} from 'lucide-react';
import {
  securitySettingsApi,
  SecuritySettingsResponse,
} from '../../../../shared/api/securitySettingsApi';
import { toast } from '../../../../shared/toaster';
import { confirmation } from '../../../../shared/confirmation';

export interface SecurityViewProps {
  tenantId?: string;
  isFullSiteAdmin?: boolean;
  canEdit?: boolean;
}

type TimeUnit = 'days' | 'weeks' | 'months' | 'years';
type LogoutUnit = 'minutes' | 'hours';

const TIME_UNIT_OPTIONS: { value: TimeUnit; label: string; multiplier: number }[] = [
  { value: 'days', label: 'Days', multiplier: 1 },
  { value: 'weeks', label: 'Weeks', multiplier: 7 },
  { value: 'months', label: 'Months', multiplier: 30 },
  { value: 'years', label: 'Years', multiplier: 365 },
];

const LOGOUT_UNIT_OPTIONS: { value: LogoutUnit; label: string; multiplier: number }[] = [
  { value: 'minutes', label: 'Minutes', multiplier: 1 },
  { value: 'hours', label: 'Hours', multiplier: 60 },
];

const PASSWORD_STRENGTH_OPTIONS = [
  { value: 'WEAK', label: 'Weak' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'STRONG', label: 'Strong' },
];

function daysToUnitAndValue(totalDays: number): { value: number; unit: TimeUnit } {
  if (totalDays >= 365 && totalDays % 365 === 0) {
    return { value: Math.round(totalDays / 365), unit: 'years' };
  }
  if (totalDays >= 30 && totalDays % 30 === 0) {
    return { value: Math.round(totalDays / 30), unit: 'months' };
  }
  if (totalDays >= 7 && totalDays % 7 === 0) {
    return { value: Math.round(totalDays / 7), unit: 'weeks' };
  }
  return { value: totalDays, unit: 'days' };
}

function unitAndValueToDays(value: number, unit: TimeUnit): number {
  const opt = TIME_UNIT_OPTIONS.find((o) => o.value === unit);
  return Math.max(1, Math.round(value * (opt?.multiplier || 1)));
}

function minutesToUnitAndValue(totalMinutes: number): { value: number; unit: LogoutUnit } {
  if (totalMinutes >= 60 && totalMinutes % 60 === 0) {
    return { value: Math.round(totalMinutes / 60), unit: 'hours' };
  }
  return { value: totalMinutes, unit: 'minutes' };
}

function unitAndValueToMinutes(value: number, unit: LogoutUnit): number {
  const opt = LOGOUT_UNIT_OPTIONS.find((o) => o.value === unit);
  return Math.max(1, Math.round(value * (opt?.multiplier || 1)));
}

interface FormState {
  lockAfterNAttempts: number;
  preventConcurrentSessions: boolean;
  logoutAfterValue: number;
  logoutAfterUnit: LogoutUnit;
  inactivityLockValue: number;
  inactivityLockUnit: TimeUnit;
  passwordExpiryValue: number;
  passwordExpiryUnit: TimeUnit;
  preventLastNPasswords: number;
  minimumPasswordLength: number;
  minimumPasswordStrength: string;
  requireDigit: boolean;
  requireSymbol: boolean;
  requireMixedCase: boolean;
}

function mapResponseToForm(resp: SecuritySettingsResponse): FormState {
  const inact = daysToUnitAndValue(resp.inactivityLockDays ?? 90);
  const pwExp = daysToUnitAndValue(resp.passwordExpiryDays ?? 300);
  const logout = minutesToUnitAndValue(resp.inactivityLogoutMinutes ?? 30);

  return {
    lockAfterNAttempts: resp.maxFailedLoginAttempts ?? 10,
    preventConcurrentSessions: !!resp.preventConcurrentSessions,
    logoutAfterValue: logout.value,
    logoutAfterUnit: logout.unit,
    inactivityLockValue: inact.value,
    inactivityLockUnit: inact.unit,
    passwordExpiryValue: pwExp.value,
    passwordExpiryUnit: pwExp.unit,
    preventLastNPasswords: resp.passwordHistoryCount ?? 4,
    minimumPasswordLength: resp.minimumPasswordLength ?? 10,
    minimumPasswordStrength: (resp.minimumPasswordStrength || 'MODERATE').toUpperCase(),
    requireDigit: resp.requireDigit ?? true,
    requireSymbol: resp.requireSymbol ?? true,
    requireMixedCase: resp.requireMixedCase ?? true,
  };
}

export const SecurityView: React.FC<SecurityViewProps> = ({
  tenantId,
  isFullSiteAdmin = true,
  canEdit,
}) => {
  const isEditable = canEdit !== undefined ? canEdit : isFullSiteAdmin;
  const [formState, setFormState] = useState<FormState>({
    lockAfterNAttempts: 10,
    preventConcurrentSessions: false,
    logoutAfterValue: 30,
    logoutAfterUnit: 'minutes',
    inactivityLockValue: 3,
    inactivityLockUnit: 'months',
    passwordExpiryValue: 10,
    passwordExpiryUnit: 'months',
    preventLastNPasswords: 4,
    minimumPasswordLength: 10,
    minimumPasswordStrength: 'MODERATE',
    requireDigit: true,
    requireSymbol: true,
    requireMixedCase: true,
  });

  const [savedSettings, setSavedSettings] = useState<SecuritySettingsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await securitySettingsApi.getSecuritySettings(tenantId);
      setSavedSettings(data);
      setFormState(mapResponseToForm(data));
      setIsDirty(false);
      setErrors({});
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load security settings';
      toast.error(msg, { title: 'Security Settings Error' });
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formState.lockAfterNAttempts || formState.lockAfterNAttempts < 1) {
      newErrors.lockAfterNAttempts = 'Must be at least 1 attempt';
    }
    if (!formState.logoutAfterValue || formState.logoutAfterValue < 1) {
      newErrors.logoutAfterValue = 'Must be at least 1';
    }
    if (!formState.inactivityLockValue || formState.inactivityLockValue < 1) {
      newErrors.inactivityLockValue = 'Inactivity lockout value must be at least 1';
    }
    if (!formState.passwordExpiryValue || formState.passwordExpiryValue < 1) {
      newErrors.passwordExpiryValue = 'Password expiry must be at least 1';
    }
    if (formState.preventLastNPasswords < 0 || formState.preventLastNPasswords > 24) {
      newErrors.preventLastNPasswords = 'Must be between 0 and 24';
    }
    if (!formState.minimumPasswordLength || formState.minimumPasswordLength < 8) {
      newErrors.minimumPasswordLength = 'Minimum password length must be at least 8';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validate()) {
      toast.warning('Please correct the validation errors before saving.');
      return;
    }

    try {
      setSaving(true);

      // Detect if password complexity requirements specifically changed
      const passwordRequirementsChanged = Boolean(
        savedSettings && (
          formState.minimumPasswordLength !== savedSettings.minimumPasswordLength ||
          formState.minimumPasswordStrength !== (savedSettings.minimumPasswordStrength || 'MODERATE').toUpperCase() ||
          formState.requireDigit !== (savedSettings.requireDigit ?? true) ||
          formState.requireSymbol !== (savedSettings.requireSymbol ?? true) ||
          formState.requireMixedCase !== (savedSettings.requireMixedCase ?? true)
        )
      );

      const computedLogoutMinutes = unitAndValueToMinutes(
        formState.logoutAfterValue,
        formState.logoutAfterUnit
      );

      const payload = {
        maxFailedLoginAttempts: formState.lockAfterNAttempts,
        preventConcurrentSessions: formState.preventConcurrentSessions,
        inactivityLogoutMinutes: computedLogoutMinutes,
        inactivityLockDays: unitAndValueToDays(formState.inactivityLockValue, formState.inactivityLockUnit),
        passwordExpiryDays: unitAndValueToDays(formState.passwordExpiryValue, formState.passwordExpiryUnit),
        passwordHistoryCount: formState.preventLastNPasswords,
        minimumPasswordLength: formState.minimumPasswordLength,
        minimumPasswordStrength: formState.minimumPasswordStrength,
        requireDigit: formState.requireDigit,
        requireSymbol: formState.requireSymbol,
        requireMixedCase: formState.requireMixedCase,
      };

      const updated = await securitySettingsApi.updateSecuritySettings(payload, tenantId);
      setSavedSettings(updated);
      setFormState(mapResponseToForm(updated));
      setIsDirty(false);
      setErrors({});

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('enrollnow_security_policy_updated', { detail: updated }));
        if (updated?.inactivityLogoutMinutes) {
          localStorage.setItem('enrollnow_inactivity_minutes', String(updated.inactivityLogoutMinutes));
        }
      }

      toast.success('Security settings saved');

      if (passwordRequirementsChanged) {
        confirmation.confirm({
          title: 'Reset Password for All Users in Team',
          message:
            "You just changed the password requirements for the team. New passwords will have to comply with the new requirements, but current passwords can't be checked. You can choose to reset all passwords in the team, or do nothing and wait for users to create new passwords.",
          intent: 'danger',
          confirmText: 'Force reset all passwords',
          cancelText: 'Leave existing passwords intact',
          loadingText: 'Resetting All Passwords...',
          onConfirm: async () => {
            try {
              const res = await securitySettingsApi.forcePasswordReset(tenantId);
              toast.success(
                res.message || 'All passwords reset! Reset links have been emailed to affected users.'
              );
            } catch (err: any) {
              const msg =
                err?.response?.data?.message || err?.message || 'Failed to force reset passwords';
              toast.error(msg, { title: 'Force Reset Failed' });
              throw err;
            }
          },
          onCancel: () => {
            // No info toast when closed/cancelled per user requirement
          },
        });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save security settings';
      toast.error(msg, { title: 'Save Failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (savedSettings) {
      setFormState(mapResponseToForm(savedSettings));
      setIsDirty(false);
      setErrors({});
      toast.info('Changes discarded.');
    }
  };

  const handleResetToDefaults = () => {
    confirmation.confirm({
      title: 'Reset to Default Settings',
      message:
        'Are you sure you want to reset all security settings to the recommended default values? This action cannot be undone.',
      intent: 'warning',
      confirmText: 'Reset to Defaults',
      cancelText: 'Cancel',
      loadingText: 'Resetting...',
      onConfirm: async () => {
        try {
          setIsResetting(true);
          const reset = await securitySettingsApi.resetToDefaultSecuritySettings(tenantId);
          setSavedSettings(reset);
          setFormState(mapResponseToForm(reset));
          setIsDirty(false);
          setErrors({});
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('enrollnow_security_policy_updated', { detail: reset })
            );
            if (reset?.inactivityLogoutMinutes) {
              localStorage.setItem('enrollnow_inactivity_minutes', String(reset.inactivityLogoutMinutes));
            }
          }
          toast.success('Security settings reset to recommended defaults.');
        } catch (err: any) {
          const msg = err?.response?.data?.message || err?.message || 'Failed to reset settings';
          toast.error(msg, { title: 'Reset Failed' });
          throw err;
        } finally {
          setIsResetting(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="sec-view-wrapper" style={{ minHeight: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: '#64748b' }}>
          <Clock className="animate-spin" size={32} style={{ color: '#0284c7' }} />
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>Loading security settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sec-view-wrapper">
      {/* Clean Top Header Bar */}
      <div className="sec-header-bar">
        <div className="sec-header-title-row">
          <h2 className="sec-header-title">Security Settings</h2>
          {isDirty && (
            <span className="sec-dirty-pill">
              <AlertCircle size={12} aria-hidden="true" />
              Unsaved Changes
            </span>
          )}
        </div>

        {isEditable && (
          <button
            type="button"
            className="sec-btn-reset-top"
            onClick={handleResetToDefaults}
            disabled={saving || isResetting}
          >
            <RotateCcw size={14} aria-hidden="true" />
            <span>Reset to Default Settings</span>
          </button>
        )}
      </div>

      {/* Main Form Grid */}
      <form onSubmit={handleSave} noValidate>
        <div className="sec-layout-grid">
          {/* LEFT COLUMN: Sessions & Access Control */}
          <div className="sec-column">
            <div className="sec-card">
              <div className="sec-card-header">
                <div className="sec-card-icon-wrap is-blue">
                  <Lock size={18} aria-hidden="true" />
                </div>
                <div className="sec-card-title-text">
                  <h3 className="sec-card-title">Sessions &amp; Access Control</h3>
                  <span className="sec-card-subtitle">
                    Configure how users access and stay signed in to the application.
                  </span>
                </div>
              </div>

              {/* Field 1: Lock accounts after failed login attempts */}
              <div className="sec-field-group">
                <label htmlFor="lockAfterNAttempts" className="sec-field-title">
                  Lock accounts after failed login attempts
                </label>
                <p className="sec-field-desc">
                  Account will be locked after the specified number of consecutive failed login attempts.
                </p>
                <div className="sec-input-inline-group">
                  <input
                    id="lockAfterNAttempts"
                    type="number"
                    min={1}
                    max={100}
                    className={`sec-number-input ${errors.lockAfterNAttempts ? 'is-invalid' : ''}`}
                    value={formState.lockAfterNAttempts}
                    onChange={(e) => updateField('lockAfterNAttempts', parseInt(e.target.value, 10) || 0)}
                    disabled={!isEditable || saving}
                  />
                  <span className="sec-unit-suffix">attempts</span>
                </div>
                {errors.lockAfterNAttempts && (
                  <div className="sec-field-error-msg" role="alert">{errors.lockAfterNAttempts}</div>
                )}
              </div>

              {/* Field 2: Prevent concurrent sessions */}
              <div className="sec-switch-split-row">
                <div className="sec-switch-text-side">
                  <label htmlFor="preventConcurrentSessions" className="sec-field-title">
                    Prevent concurrent sessions on the same account
                  </label>
                  <p className="sec-field-desc">
                    When enabled, signing in from a new browser or device will revoke existing sessions.
                  </p>
                </div>
                <label className="sec-toggle-switch" title="Toggle concurrent session prevention">
                  <input
                    id="preventConcurrentSessions"
                    type="checkbox"
                    checked={formState.preventConcurrentSessions}
                    onChange={(e) => updateField('preventConcurrentSessions', e.target.checked)}
                    disabled={!isEditable || saving}
                  />
                  <span className="sec-toggle-slider" />
                </label>
              </div>

              {/* Field 3: Automatically logout after inactivity */}
              <div className="sec-field-group">
                <label htmlFor="logoutAfterValue" className="sec-field-title">
                  Automatically logout after inactivity
                </label>
                <p className="sec-field-desc">
                  User will be logged out after the specified period of inactivity.
                </p>
                <div className="sec-input-inline-group">
                  <input
                    id="logoutAfterValue"
                    type="number"
                    min={1}
                    max={1440}
                    className={`sec-number-input ${errors.logoutAfterValue ? 'is-invalid' : ''}`}
                    value={formState.logoutAfterValue}
                    onChange={(e) => updateField('logoutAfterValue', parseInt(e.target.value, 10) || 0)}
                    disabled={!isEditable || saving}
                  />
                  <select
                    className="sec-dropdown-select"
                    value={formState.logoutAfterUnit}
                    onChange={(e) => updateField('logoutAfterUnit', e.target.value as LogoutUnit)}
                    disabled={!isEditable || saving}
                    aria-label="Logout after inactivity unit"
                  >
                    {LOGOUT_UNIT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.logoutAfterValue && (
                  <div className="sec-field-error-msg" role="alert">{errors.logoutAfterValue}</div>
                )}
              </div>

              {/* Field 4: Lock accounts after inactivity */}
              <div className="sec-field-group">
                <label htmlFor="inactivityLockValue" className="sec-field-title">
                  Lock accounts after inactivity
                </label>
                <p className="sec-field-desc">
                  Account will be locked if there is no login activity for the specified period.
                </p>
                <div className="sec-input-inline-group">
                  <input
                    id="inactivityLockValue"
                    type="number"
                    min={1}
                    className={`sec-number-input ${errors.inactivityLockValue ? 'is-invalid' : ''}`}
                    value={formState.inactivityLockValue}
                    onChange={(e) => updateField('inactivityLockValue', parseInt(e.target.value, 10) || 0)}
                    disabled={!isEditable || saving}
                  />
                  <select
                    className="sec-dropdown-select"
                    value={formState.inactivityLockUnit}
                    onChange={(e) => updateField('inactivityLockUnit', e.target.value as TimeUnit)}
                    disabled={!isEditable || saving}
                    aria-label="Lock after inactivity unit"
                  >
                    {TIME_UNIT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.inactivityLockValue && (
                  <div className="sec-field-error-msg" role="alert">{errors.inactivityLockValue}</div>
                )}
              </div>

              {/* Note Callout Box */}
              <div className="sec-note-callout">
                <Info size={16} className="sec-note-icon" aria-hidden="true" />
                <div className="sec-note-content">
                  <strong>Note: </strong>
                  Inactivity logout applies to active sessions. Inactivity lockout prevents users from signing in after the specified period.
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Two Stacked Cards (Password Policy & Complexity) */}
          <div className="sec-column">
            {/* Card 1: Password Policy */}
            <div className="sec-card">
              <div className="sec-card-header">
                <div className="sec-card-icon-wrap is-green">
                  <Key size={18} aria-hidden="true" />
                </div>
                <div className="sec-card-title-text">
                  <h3 className="sec-card-title">Password Policy</h3>
                  <span className="sec-card-subtitle">
                    Set password expiration, history and complexity rules.
                  </span>
                </div>
              </div>

              {/* Field 1: Passwords expire after */}
              <div className="sec-field-group">
                <label htmlFor="passwordExpiryValue" className="sec-field-title">
                  Passwords expire after
                </label>
                <p className="sec-field-desc">
                  Users will be required to change their password after this period.
                </p>
                <div className="sec-input-inline-group">
                  <input
                    id="passwordExpiryValue"
                    type="number"
                    min={1}
                    className={`sec-number-input ${errors.passwordExpiryValue ? 'is-invalid' : ''}`}
                    value={formState.passwordExpiryValue}
                    onChange={(e) => updateField('passwordExpiryValue', parseInt(e.target.value, 10) || 0)}
                    disabled={!isEditable || saving}
                  />
                  <select
                    className="sec-dropdown-select"
                    value={formState.passwordExpiryUnit}
                    onChange={(e) => updateField('passwordExpiryUnit', e.target.value as TimeUnit)}
                    disabled={!isEditable || saving}
                    aria-label="Password expiration unit"
                  >
                    {TIME_UNIT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.passwordExpiryValue && (
                  <div className="sec-field-error-msg" role="alert">{errors.passwordExpiryValue}</div>
                )}
              </div>

              {/* Field 2: Prevent reuse of last N passwords */}
              <div className="sec-field-group">
                <label htmlFor="preventLastNPasswords" className="sec-field-title">
                  Prevent reuse of last N passwords
                </label>
                <p className="sec-field-desc">
                  Users cannot reuse their last N passwords.
                </p>
                <div className="sec-input-inline-group">
                  <input
                    id="preventLastNPasswords"
                    type="number"
                    min={0}
                    max={24}
                    className={`sec-number-input ${errors.preventLastNPasswords ? 'is-invalid' : ''}`}
                    value={formState.preventLastNPasswords}
                    onChange={(e) => updateField('preventLastNPasswords', parseInt(e.target.value, 10) || 0)}
                    disabled={!isEditable || saving}
                  />
                  <span className="sec-unit-suffix">previous passwords</span>
                </div>
                {errors.preventLastNPasswords && (
                  <div className="sec-field-error-msg" role="alert">{errors.preventLastNPasswords}</div>
                )}
              </div>
            </div>

            {/* Card 2: Password Complexity Requirements */}
            <div className="sec-card">
              <div className="sec-card-header">
                <div className="sec-card-icon-wrap is-blue">
                  <ShieldCheck size={18} aria-hidden="true" />
                </div>
                <div className="sec-card-title-text">
                  <h3 className="sec-card-title">Password Complexity Requirements</h3>
                  <span className="sec-card-subtitle">
                    Define the minimum requirements for new passwords.
                  </span>
                </div>
              </div>

              {/* Field 1: Minimum password length */}
              <div className="sec-field-group">
                <label htmlFor="minimumPasswordLength" className="sec-field-title">
                  Minimum password length (characters)
                </label>
                <p className="sec-field-desc">
                  Password must be at least the specified length.
                </p>
                <div className="sec-input-inline-group">
                  <input
                    id="minimumPasswordLength"
                    type="number"
                    min={8}
                    max={128}
                    className={`sec-number-input ${errors.minimumPasswordLength ? 'is-invalid' : ''}`}
                    value={formState.minimumPasswordLength}
                    onChange={(e) => updateField('minimumPasswordLength', parseInt(e.target.value, 10) || 0)}
                    disabled={!isEditable || saving}
                  />
                </div>
                {errors.minimumPasswordLength && (
                  <div className="sec-field-error-msg" role="alert">{errors.minimumPasswordLength}</div>
                )}
              </div>

              {/* Field 2: Minimum password strength level */}
              <div className="sec-field-group">
                <label htmlFor="minimumPasswordStrength" className="sec-field-title">
                  Minimum password strength level
                </label>
                <p className="sec-field-desc">
                  Enforces a minimum complexity level.
                </p>
                <select
                  id="minimumPasswordStrength"
                  className="sec-dropdown-select"
                  style={{ width: '220px' }}
                  value={formState.minimumPasswordStrength}
                  onChange={(e) => updateField('minimumPasswordStrength', e.target.value)}
                  disabled={!isEditable || saving}
                >
                  {PASSWORD_STRENGTH_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 3: 3-column Toggles (Digit, Symbol, Mixed case) */}
              <div className="sec-tri-toggle-row">
                <div className="sec-tri-toggle-item">
                  <span className="sec-tri-toggle-label">Require at least one digit</span>
                  <label className="sec-toggle-switch" title="Require at least one digit">
                    <input
                      type="checkbox"
                      checked={formState.requireDigit}
                      onChange={(e) => updateField('requireDigit', e.target.checked)}
                      disabled={!isEditable || saving}
                      aria-label="Require at least one digit"
                    />
                    <span className="sec-toggle-slider" />
                  </label>
                </div>

                <div className="sec-tri-toggle-item">
                  <span className="sec-tri-toggle-label">Require at least one symbol</span>
                  <label className="sec-toggle-switch" title="Require at least one symbol">
                    <input
                      type="checkbox"
                      checked={formState.requireSymbol}
                      onChange={(e) => updateField('requireSymbol', e.target.checked)}
                      disabled={!isEditable || saving}
                      aria-label="Require at least one symbol"
                    />
                    <span className="sec-toggle-slider" />
                  </label>
                </div>

                <div className="sec-tri-toggle-item">
                  <span className="sec-tri-toggle-label">Require mixed case</span>
                  <label className="sec-toggle-switch" title="Require mixed case">
                    <input
                      type="checkbox"
                      checked={formState.requireMixedCase}
                      onChange={(e) => updateField('requireMixedCase', e.target.checked)}
                      disabled={!isEditable || saving}
                      aria-label="Require mixed case"
                    />
                    <span className="sec-toggle-slider" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar (Save Settings / Discard Changes) */}
        <div className="sec-bottom-action-bar">
          <button
            type="submit"
            className="sec-btn-save-main"
            disabled={!isDirty || saving || !isEditable}
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
      </form>
    </div>
  );
};
