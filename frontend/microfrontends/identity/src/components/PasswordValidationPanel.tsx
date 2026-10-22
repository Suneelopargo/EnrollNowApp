// frontend/microfrontends/identity/src/components/PasswordValidationPanel.tsx
import React from 'react';
import { PasswordPolicy } from '../../../../shared/api/authApi';

export interface PasswordValidationPanelProps {
  password: string;
  policy: PasswordPolicy | null;
  strengthResult: {
    score: number;
    crackTime: string;
    suggestions: string[];
  };
  minLength: number;
  meetsMinChars: boolean;
  meetsRequireDigit: boolean;
  meetsRequireSymbol: boolean;
  meetsRequireMixedCase: boolean;
  test1Passed: boolean;
  test2Passed: boolean;
  overallPassed: boolean;
  requiredStrengthLabel: string;
  scoreLabel: string;
}

export const PasswordValidationPanel: React.FC<PasswordValidationPanelProps> = ({
  password,
  policy,
  strengthResult,
  minLength,
  meetsMinChars,
  meetsRequireDigit,
  meetsRequireSymbol,
  meetsRequireMixedCase,
  test2Passed,
  overallPassed,
  requiredStrengthLabel,
  scoreLabel,
}) => {
  if (!policy) {
    return null;
  }

  const hasTyped = Boolean(password);

  return (
    <div className="enl-activation-meter-group">
      {/* Overall Summary Line */}
      <div className="enl-activation-overall-status">
        <strong>
          The password{' '}
          {overallPassed
            ? 'meets all requirements from both tests.'
            : 'does not match all requirements.'}
        </strong>
      </div>

      {/* Test #1: Strength */}
      <div className="enl-activation-test-block">
        <h4 className="enl-activation-test-title">Password Validation Test #1: Strength</h4>

        {/* Meter Container */}
        <div className="enl-activation-meter-container">
          <div className="enl-activation-meter-bg">
            <div
              className={`enl-activation-meter-fill score-${strengthResult.score}`}
              style={{
                width: hasTyped ? `${Math.max((strengthResult.score / 4) * 100, 10)}%` : '0%',
              }}
            />
          </div>
        </div>

        {/* Crack-time Estimate */}
        <div className="enl-activation-crack-time">
          It would take {hasTyped ? strengthResult.crackTime : 'a few seconds'} to crack this password.
        </div>

        {/* Suggestions */}
        {hasTyped && strengthResult.suggestions.length > 0 && (
          <div className="enl-activation-suggestions">
            <div className="enl-activation-suggestions-label">Suggestions for a better password:</div>
            <ul>
              {strengthResult.suggestions.map((sug, i) => (
                <li key={i}>{sug}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Strength Explanation */}
        <div className="enl-activation-strength-status">
          <strong>
            Your password must be {requiredStrengthLabel} or better.{' '}
            Your strength is: {hasTyped ? scoreLabel : '—'}.
          </strong>
        </div>
      </div>

      {/* Test #2: Password Requirements */}
      <div className="enl-activation-test-block">
        <h4 className="enl-activation-test-title">
          Password Validation Test #2: Password Requirements
        </h4>
        <div className="enl-activation-reqs-intro">Your password must contain the following:</div>
        <ul className="enl-activation-reqs-list">
          <li className={hasTyped && meetsMinChars ? 'is-met' : 'is-unmet'}>
            <span className="enl-req-indicator" aria-hidden="true">
              {hasTyped && meetsMinChars ? '✓ ' : '• '}
            </span>
            A minimum length of {minLength} characters.
          </li>
          {policy.requireDigit && (
            <li className={hasTyped && meetsRequireDigit ? 'is-met' : 'is-unmet'}>
              <span className="enl-req-indicator" aria-hidden="true">
                {hasTyped && meetsRequireDigit ? '✓ ' : '• '}
              </span>
              At least one digit (number).
            </li>
          )}
          {policy.requireSymbol && (
            <li className={hasTyped && meetsRequireSymbol ? 'is-met' : 'is-unmet'}>
              <span className="enl-req-indicator" aria-hidden="true">
                {hasTyped && meetsRequireSymbol ? '✓ ' : '• '}
              </span>
              At least one symbol (special character).
            </li>
          )}
          {policy.requireMixedCase && (
            <li className={hasTyped && meetsRequireMixedCase ? 'is-met' : 'is-unmet'}>
              <span className="enl-req-indicator" aria-hidden="true">
                {hasTyped && meetsRequireMixedCase ? '✓ ' : '• '}
              </span>
              Mixed upper and lower case characters.
            </li>
          )}
          {test2Passed && (
            <li className="is-met enl-req-all-met">
              <strong>The password requirements have been met for this test.</strong>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};
