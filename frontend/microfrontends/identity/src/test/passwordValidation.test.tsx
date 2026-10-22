// frontend/microfrontends/identity/src/test/passwordValidation.test.tsx
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PasswordValidationPanel, PasswordValidationPanelProps } from '../components/PasswordValidationPanel';
import { PasswordPolicy } from '../../../../shared/api/authApi';
import zxcvbn from 'zxcvbn';

describe('Password Validation & Legacy Parity Tests', () => {
  const samplePolicy: PasswordPolicy = {
    minimumPasswordLength: 10,
    minimumPasswordStrength: 'MODERATE',
    requireDigit: true,
    requireSymbol: true,
    requireMixedCase: true,
  };

  it('evaluates zxcvbn scores reliably on the frontend', () => {
    // Weak predictable password
    const weakResult = zxcvbn('password123');
    expect(weakResult.score).toBeLessThan(3);

    // High entropy strong password
    const strongResult = zxcvbn('K9#vL2$mQ8!zW5*p');
    expect(strongResult.score).toBe(4);
    expect(strongResult.crack_times_display.offline_slow_hashing_1e4_per_second).toBeDefined();
  });

  it('renders overall status and unmet requirements correctly', () => {
    const props: PasswordValidationPanelProps = {
      password: 'pass',
      policy: samplePolicy,
      strengthResult: {
        score: 1,
        crackTime: 'less than a second',
        suggestions: ['Add another word or two.', 'Avoid repeated words and characters.'],
      },
      minLength: 10,
      meetsMinChars: false,
      meetsRequireDigit: false,
      meetsRequireSymbol: false,
      meetsRequireMixedCase: false,
      test1Passed: false,
      test2Passed: false,
      overallPassed: false,
      requiredStrengthLabel: 'Moderate',
      scoreLabel: 'Weak',
    };

    const html = renderToStaticMarkup(<PasswordValidationPanel {...props} />);

    expect(html).toContain('The password does not match all requirements.');
    expect(html).toContain('Password Validation Test #1: Strength');
    expect(html).toContain('score-1');
    expect(html).toContain('It would take less than a second to crack this password.');
    expect(html).toContain('Suggestions for a better password:');
    expect(html).toContain('Add another word or two.');
    expect(html).toContain('Your password must be Moderate or better.');
    expect(html).toContain('Your strength is: Weak');
    expect(html).toContain('Password Validation Test #2: Password Requirements');
    expect(html).toContain('A minimum length of 10 characters.');
    expect(html).toContain('At least one digit (number).');
    expect(html).toContain('At least one symbol (special character).');
    expect(html).toContain('Mixed upper and lower case characters.');
    expect(html).toContain('is-unmet');
    expect(html).not.toContain('The password requirements have been met for this test.');
  });

  it('renders satisfied status and met indicators when all requirements are met', () => {
    const props: PasswordValidationPanelProps = {
      password: 'K9#vL2$mQ8!zW5*p',
      policy: samplePolicy,
      strengthResult: {
        score: 4,
        crackTime: 'centuries',
        suggestions: [],
      },
      minLength: 10,
      meetsMinChars: true,
      meetsRequireDigit: true,
      meetsRequireSymbol: true,
      meetsRequireMixedCase: true,
      test1Passed: true,
      test2Passed: true,
      overallPassed: true,
      requiredStrengthLabel: 'Moderate',
      scoreLabel: 'Strong',
    };

    const html = renderToStaticMarkup(<PasswordValidationPanel {...props} />);

    expect(html).toContain('The password meets all requirements from both tests.');
    expect(html).toContain('Password Validation Test #1: Strength');
    expect(html).toContain('score-4');
    expect(html).toContain('It would take centuries to crack this password.');
    expect(html).not.toContain('Suggestions for a better password:');
    expect(html).toContain('Your strength is: Strong');
    expect(html).toContain('is-met');
    expect(html).toContain('The password requirements have been met for this test.');
  });

  it('renders null when policy is not yet loaded', () => {
    const props: PasswordValidationPanelProps = {
      password: '',
      policy: null,
      strengthResult: { score: 0, crackTime: '', suggestions: [] },
      minLength: 10,
      meetsMinChars: false,
      meetsRequireDigit: false,
      meetsRequireSymbol: false,
      meetsRequireMixedCase: false,
      test1Passed: false,
      test2Passed: false,
      overallPassed: false,
      requiredStrengthLabel: 'Moderate',
      scoreLabel: 'Weak',
    };

    const html = renderToStaticMarkup(<PasswordValidationPanel {...props} />);
    expect(html).toBe('');
  });
});
