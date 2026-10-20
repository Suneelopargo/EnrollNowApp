// frontend/microfrontends/administration/src/components/SecurityView.tsx - US-065 Site Security Policy
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield,
  Clock,
  Lock,
  RotateCcw,
  Save,
  Undo2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  securitySettingsApi,
  SecuritySettingsResponse,
} from '../../../../shared/api/securitySettingsApi';
import { toast } from '../../../../shared/toaster';

export interface SecurityViewProps {
  tenantId?: string;
  isFullSiteAdmin?: boolean;
}

type TimeUnit = 'days' | 'weeks' | 'months' | 'years';

const TIME_UNIT_OPTIONS: { value: TimeUnit; label: string; multiplier: number }[] = [
  { value: 'days', label: 'Days', multiplier: 1 },
  { value: 'weeks', label: 'Weeks', multiplier: 7 },
  { value: 'months', label: 'Months', multiplier: 30 },
  { value: 'years', label: 'Years', multiplier: 365 },
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

interface FormState {
  lockAfterNAttempts: number;
  preventConcurrentSessions: boolean;
  logoutAfterNMinutes: number;
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

  return {
    lockAfterNAttempts: resp.maxFailedLoginAttempts ?? 10,
    preventConcurrentSessions: !!resp.preventConcurrentSessions,
    logoutAfterNMinutes: resp.inactivityLogoutMinutes ?? 30,
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
}) => {
  const [formState, setFormState] = useState<FormState>({
    lockAfterNAttempts: 10,
    preventConcurrentSessions: false,
    logoutAfterNMinutes: 30,
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
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
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
    if (!formState.logoutAfterNMinutes || formState.logoutAfterNMinutes < 1) {
      newErrors.logoutAfterNMinutes = 'Must be at least 1 minute';
    }
    if (!formState.inactivityLockValue || formState.inactivityLockValue < 1) {
      newErrors.inactivityLockValue = 'Inactivity lockout value must be at least 1';
    }
    if (!formState.passwordExpiryValue || formState.passwordExpiryValue < 1) {
      newErrors.passwordExpiryValue = 'Password expiration value must be at least 1';
    }
    if (formState.preventLastNPasswords < 0) {
      newErrors.preventLastNPasswords = 'Password reuse count cannot be negative';
    }
    if (!formState.minimumPasswordLength || formState.minimumPasswordLength < 8) {
      newErrors.minimumPasswordLength = 'Minimum password length must be at least 8 characters';
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
      const payload = {
        maxFailedLoginAttempts: formState.lockAfterNAttempts,
        preventConcurrentSessions: formState.preventConcurrentSessions,
        inactivityLogoutMinutes: formState.logoutAfterNMinutes,
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
      toast.success('Site security policy saved successfully.');
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

  const handleResetToDefaults = async () => {
    try {
      setIsResetting(true);
      const reset = await securitySettingsApi.resetToDefaultSecuritySettings(tenantId);
      setSavedSettings(reset);
      setFormState(mapResponseToForm(reset));
      setIsDirty(false);
      setErrors({});
      setShowResetModal(false);
      toast.success('Security settings reset to recommended defaults.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to reset settings';
      toast.error(msg, { title: 'Reset Failed' });
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="site-admin-card-view" style={{ minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <Clock className="animate-spin text-blue-600" size={32} />
          <p>Loading security policy...</p>
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
            <h2 className="site-admin-card-view-title">Site Security Policy</h2>
            {isDirty && (
              <span className="badge badge-warning text-xs font-semibold px-2 py-0.5 rounded">
                Unsaved Changes
              </span>
            )}
          </div>
          <p className="site-admin-card-view-subtitle">
            Configure lockout thresholds, session inactivity timeouts, password complexity, and 21 CFR Part 11 compliance policies.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-4">
          {/* Left Column: Sessions & Inactivity */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
              <Clock className="text-blue-600" size={20} />
              <h3 className="text-base font-semibold text-gray-800 m-0">Sessions &amp; Inactivity</h3>
            </div>

            {/* Failed login attempts */}
            <div className="mb-4">
              <label htmlFor="lockAfterNAttempts" className="block text-sm font-medium text-gray-700 mb-1">
                Lock accounts after failed login attempts
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="lockAfterNAttempts"
                  type="number"
                  min={1}
                  max={100}
                  className={`form-control w-28 ${errors.lockAfterNAttempts ? 'is-invalid border-red-500' : ''}`}
                  value={formState.lockAfterNAttempts}
                  onChange={(e) => updateField('lockAfterNAttempts', parseInt(e.target.value, 10) || 0)}
                  disabled={!isFullSiteAdmin || saving}
                />
                <span className="text-sm text-gray-500">attempts</span>
              </div>
              {errors.lockAfterNAttempts && (
                <div className="text-red-600 text-xs mt-1">{errors.lockAfterNAttempts}</div>
              )}
            </div>

            {/* Prevent concurrent sessions */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="preventConcurrentSessions" className="block text-sm font-medium text-gray-700">
                    Prevent concurrent sessions
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Revoke existing sessions when staff logs in from a new browser or device.
                  </p>
                </div>
                <div className="form-check form-switch ml-4">
                  <input
                    id="preventConcurrentSessions"
                    type="checkbox"
                    role="switch"
                    className="form-check-input cursor-pointer"
                    checked={formState.preventConcurrentSessions}
                    onChange={(e) => updateField('preventConcurrentSessions', e.target.checked)}
                    disabled={!isFullSiteAdmin || saving}
                  />
                </div>
              </div>
            </div>

            {/* Inactivity logout */}
            <div className="mb-4">
              <label htmlFor="logoutAfterNMinutes" className="block text-sm font-medium text-gray-700 mb-1">
                Automatic logout after inactivity
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="logoutAfterNMinutes"
                  type="number"
                  min={1}
                  max={1440}
                  className={`form-control w-28 ${errors.logoutAfterNMinutes ? 'is-invalid border-red-500' : ''}`}
                  value={formState.logoutAfterNMinutes}
                  onChange={(e) => updateField('logoutAfterNMinutes', parseInt(e.target.value, 10) || 0)}
                  disabled={!isFullSiteAdmin || saving}
                />
                <span className="text-sm text-gray-500">minutes</span>
              </div>
              {errors.logoutAfterNMinutes && (
                <div className="text-red-600 text-xs mt-1">{errors.logoutAfterNMinutes}</div>
              )}
            </div>

            {/* Lock accounts after inactivity */}
            <div className="mb-4">
              <label htmlFor="inactivityLockValue" className="block text-sm font-medium text-gray-700 mb-1">
                Lock accounts after inactivity
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="inactivityLockValue"
                  type="number"
                  min={1}
                  className={`form-control w-28 ${errors.inactivityLockValue ? 'is-invalid border-red-500' : ''}`}
                  value={formState.inactivityLockValue}
                  onChange={(e) => updateField('inactivityLockValue', parseInt(e.target.value, 10) || 0)}
                  disabled={!isFullSiteAdmin || saving}
                />
                <select
                  className="form-select w-36"
                  value={formState.inactivityLockUnit}
                  onChange={(e) => updateField('inactivityLockUnit', e.target.value as TimeUnit)}
                  disabled={!isFullSiteAdmin || saving}
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
                <div className="text-red-600 text-xs mt-1">{errors.inactivityLockValue}</div>
              )}
            </div>
          </div>

          {/* Right Column: Passwords */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
              <Lock className="text-emerald-600" size={20} />
              <h3 className="text-base font-semibold text-gray-800 m-0">Passwords &amp; Complexity</h3>
            </div>

            {/* Password expiration */}
            <div className="mb-4">
              <label htmlFor="passwordExpiryValue" className="block text-sm font-medium text-gray-700 mb-1">
                Password expiration
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="passwordExpiryValue"
                  type="number"
                  min={1}
                  className={`form-control w-28 ${errors.passwordExpiryValue ? 'is-invalid border-red-500' : ''}`}
                  value={formState.passwordExpiryValue}
                  onChange={(e) => updateField('passwordExpiryValue', parseInt(e.target.value, 10) || 0)}
                  disabled={!isFullSiteAdmin || saving}
                />
                <select
                  className="form-select w-36"
                  value={formState.passwordExpiryUnit}
                  onChange={(e) => updateField('passwordExpiryUnit', e.target.value as TimeUnit)}
                  disabled={!isFullSiteAdmin || saving}
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
                <div className="text-red-600 text-xs mt-1">{errors.passwordExpiryValue}</div>
              )}
            </div>

            {/* Prevent reuse of last N passwords */}
            <div className="mb-4">
              <label htmlFor="preventLastNPasswords" className="block text-sm font-medium text-gray-700 mb-1">
                Prevent reuse of previous passwords
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="preventLastNPasswords"
                  type="number"
                  min={0}
                  max={24}
                  className={`form-control w-28 ${errors.preventLastNPasswords ? 'is-invalid border-red-500' : ''}`}
                  value={formState.preventLastNPasswords}
                  onChange={(e) => updateField('preventLastNPasswords', parseInt(e.target.value, 10) || 0)}
                  disabled={!isFullSiteAdmin || saving}
                />
                <span className="text-sm text-gray-500">previous passwords</span>
              </div>
              {errors.preventLastNPasswords && (
                <div className="text-red-600 text-xs mt-1">{errors.preventLastNPasswords}</div>
              )}
            </div>

            <hr className="my-4 border-gray-100" />
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Complexity Requirements</h4>

            {/* Minimum password length */}
            <div className="mb-3">
              <label htmlFor="minimumPasswordLength" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum password length
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="minimumPasswordLength"
                  type="number"
                  min={8}
                  max={128}
                  className={`form-control w-28 ${errors.minimumPasswordLength ? 'is-invalid border-red-500' : ''}`}
                  value={formState.minimumPasswordLength}
                  onChange={(e) => updateField('minimumPasswordLength', parseInt(e.target.value, 10) || 0)}
                  disabled={!isFullSiteAdmin || saving}
                />
                <span className="text-sm text-gray-500">characters (min. 8)</span>
              </div>
              {errors.minimumPasswordLength && (
                <div className="text-red-600 text-xs mt-1">{errors.minimumPasswordLength}</div>
              )}
            </div>

            {/* Minimum strength */}
            <div className="mb-4">
              <label htmlFor="minimumPasswordStrength" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum password strength
              </label>
              <select
                id="minimumPasswordStrength"
                className="form-select w-44"
                value={formState.minimumPasswordStrength}
                onChange={(e) => updateField('minimumPasswordStrength', e.target.value)}
                disabled={!isFullSiteAdmin || saving}
              >
                {PASSWORD_STRENGTH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Three switches: Digit, Symbol, Mixed case */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center justify-between sm:flex-col sm:items-start p-2.5 rounded bg-gray-50 border border-gray-100">
                <span className="text-xs font-medium text-gray-700 mb-1">Require a digit</span>
                <div className="form-check form-switch m-0">
                  <input
                    type="checkbox"
                    role="switch"
                    className="form-check-input cursor-pointer"
                    checked={formState.requireDigit}
                    onChange={(e) => updateField('requireDigit', e.target.checked)}
                    disabled={!isFullSiteAdmin || saving}
                    aria-label="Require a digit"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between sm:flex-col sm:items-start p-2.5 rounded bg-gray-50 border border-gray-100">
                <span className="text-xs font-medium text-gray-700 mb-1">Require a symbol</span>
                <div className="form-check form-switch m-0">
                  <input
                    type="checkbox"
                    role="switch"
                    className="form-check-input cursor-pointer"
                    checked={formState.requireSymbol}
                    onChange={(e) => updateField('requireSymbol', e.target.checked)}
                    disabled={!isFullSiteAdmin || saving}
                    aria-label="Require a symbol"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between sm:flex-col sm:items-start p-2.5 rounded bg-gray-50 border border-gray-100">
                <span className="text-xs font-medium text-gray-700 mb-1">Require mixed case</span>
                <div className="form-check form-switch m-0">
                  <input
                    type="checkbox"
                    role="switch"
                    className="form-check-input cursor-pointer"
                    checked={formState.requireMixedCase}
                    onChange={(e) => updateField('requireMixedCase', e.target.checked)}
                    disabled={!isFullSiteAdmin || saving}
                    aria-label="Require mixed case"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-6">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="btn btn-primary flex items-center gap-2"
              disabled={!isDirty || saving || !isFullSiteAdmin}
            >
              <Save size={16} aria-hidden="true" />
              <span>{saving ? 'Saving Settings...' : 'Save Settings'}</span>
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

          {isFullSiteAdmin && (
            <button
              type="button"
              className="btn btn-danger flex items-center gap-2"
              onClick={() => setShowResetModal(true)}
              disabled={saving || isResetting}
            >
              <RotateCcw size={16} aria-hidden="true" />
              <span>Reset to Default Settings</span>
            </button>
          )}
        </div>
      </form>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <AlertCircle size={28} />
              <h3 id="reset-modal-title" className="text-lg font-bold text-gray-900 m-0">
                Reset to Default Settings?
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              This action will reset all security and session policies to the system recommended minimum values (10 failed attempts, 30 min inactivity logout, 90 day lockout, 10 month expiry, 4 password history, length 10 with digit, symbol, and mixed case).
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger flex items-center gap-2"
                onClick={handleResetToDefaults}
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <Clock className="animate-spin" size={16} />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={16} />
                    <span>Yes, Reset to Defaults</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
