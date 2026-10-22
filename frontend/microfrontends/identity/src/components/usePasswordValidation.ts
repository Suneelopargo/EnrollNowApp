// frontend/microfrontends/identity/src/components/usePasswordValidation.ts
import { useState, useMemo, useEffect, useCallback } from 'react';
import zxcvbn from 'zxcvbn';
import { authApi, PasswordPolicy } from '../../../../shared/api/authApi';
import { getApiErrorMessage } from '../../../../shared/api-client';

export interface UsePasswordValidationOptions {
  tenantId?: string;
  token?: string;
}

export const SCORE_DESCRIPTIONS: Record<number, string> = {
  0: 'Very Weak',
  1: 'Very Weak',
  2: 'Weak',
  3: 'Moderate',
  4: 'Strong',
};

export function formatCrackDuration(seconds: number): string {
  if (seconds <= 0 || isNaN(seconds) || seconds < 60) return 'a few seconds';
  if (seconds < 120) return 'a minute';
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 7200) return 'an hour';
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 172800) return 'a day';
  if (seconds < 86400 * 30) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 86400 * 60) return 'a month';
  if (seconds < 86400 * 365) return `${Math.round(seconds / (86400 * 30))} months`;
  if (seconds < 86400 * 365 * 2) return 'a year';
  if (seconds < 86400 * 365 * 100) return `${Math.round(seconds / (86400 * 365))} years`;
  return 'more than 1000 years';
}

export function usePasswordValidation({ tenantId, token }: UsePasswordValidationOptions) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [policy, setPolicy] = useState<PasswordPolicy | null>(null);
  const [policyLoading, setPolicyLoading] = useState<boolean>(true);
  const [policyError, setPolicyError] = useState<string | null>(null);

  const loadPolicy = useCallback(async () => {
    setPolicyLoading(true);
    setPolicyError(null);
    try {
      const res = await authApi.getPasswordPolicy(tenantId, token);
      setPolicy(res);
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Could not load password requirements policy.');
      setPolicyError(msg);
      setPolicy(null);
    } finally {
      setPolicyLoading(false);
    }
  }, [tenantId, token]);

  useEffect(() => {
    loadPolicy();
  }, [loadPolicy]);

  // Test #1: Password Strength via zxcvbn
  const strengthResult = useMemo(() => {
    if (!password) {
      return {
        score: 0,
        crackTime: 'a few seconds',
        suggestions: [] as string[],
      };
    }

    const res = zxcvbn(password, ['EnrollNow', 'Enroll', 'Ripple']);
    const times = res.crack_times_seconds;
    const minTime = times
      ? Math.min(
          Number(times.online_throttling_100_per_hour) || 0,
          Number(times.online_no_throttling_10_per_second) || 0,
          Number(times.offline_slow_hashing_1e4_per_second) || 0,
          Number(times.offline_fast_hashing_1e10_per_second) || 0
        )
      : 0;

    return {
      score: res.score,
      crackTime: formatCrackDuration(minTime),
      suggestions: res.feedback?.suggestions || [],
    };
  }, [password]);

  // Complexity Checks
  const minLength = policy?.minimumPasswordLength ?? 10;
  const meetsMinChars = password.length >= minLength;
  const meetsRequireDigit = /[0-9]/.test(password);
  const meetsRequireSymbol = /[^0-9A-Za-z]/.test(password);
  // Mixed-case requires both uppercase and lowercase characters
  const meetsRequireMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);

  const test2Passed =
    meetsMinChars &&
    (!policy?.requireDigit || meetsRequireDigit) &&
    (!policy?.requireSymbol || meetsRequireSymbol) &&
    (!policy?.requireMixedCase || meetsRequireMixedCase);

  const requiredScore =
    policy?.minimumPasswordStrength === 'STRONG'
      ? 4
      : policy?.minimumPasswordStrength === 'WEAK'
      ? 2
      : 3; // MODERATE default

  const test1Passed = strengthResult.score >= requiredScore;
  const requiredStrengthLabel =
    policy?.minimumPasswordStrength === 'STRONG'
      ? 'Strong'
      : policy?.minimumPasswordStrength === 'WEAK'
      ? 'Weak, Moderate or Strong'
      : 'Moderate or Strong';

  const overallPassed = Boolean(policy) && test1Passed && test2Passed;
  const passwordsMatch = Boolean(password && confirmPassword && password === confirmPassword);
  const isFormValid = Boolean(token) && Boolean(policy) && !policyLoading && !policyError && overallPassed && passwordsMatch;

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    policy,
    policyLoading,
    policyError,
    reloadPolicy: loadPolicy,
    strengthResult,
    minLength,
    meetsMinChars,
    meetsRequireDigit,
    meetsRequireSymbol,
    meetsRequireMixedCase,
    test1Passed,
    test2Passed,
    requiredScore,
    requiredStrengthLabel,
    scoreLabel: SCORE_DESCRIPTIONS[strengthResult.score] || 'Very Weak',
    overallPassed,
    passwordsMatch,
    isFormValid,
  };
}
