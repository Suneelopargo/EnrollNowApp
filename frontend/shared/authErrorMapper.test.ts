// frontend/shared/authErrorMapper.test.ts
import { describe, it, expect } from 'vitest';
import { mapAuthError } from './auth/authErrorMapper';

describe('authErrorMapper', () => {
  describe('A. Too many failed login attempts', () => {
    it('maps ACCOUNT_LOCKED_MAX_ATTEMPTS code correctly to full message', () => {
      const result = mapAuthError({ code: 'ACCOUNT_LOCKED_MAX_ATTEMPTS' });
      expect(result.code).toBe('ACCOUNT_LOCKED_MAX_ATTEMPTS');
      expect(result.title).toBe('Account locked');
      expect(result.description).toBe(
        'You have exceeded the allowed number of failed login attempts. Your account has been locked. Please contact the EnrollNow administrator at your institution to unlock your account. If you are a Site Administrator, please contact EnrollNow customer support to get your account unlocked.'
      );
      expect(result.severity).toBe('error');
      expect(result.requiresInlineAlert).toBe(false);
      expect(result.action).toBeUndefined();
    });

    it('maps legacy too many failed login attempts message without code', () => {
      const result = mapAuthError({
        message:
          'You have exceeded the allowed number of failed login attempts. Your account has been locked. Please contact the EnrollNow administrator at your institution to get your account unlocked.',
      });
      expect(result.title).toBe('Account locked');
      expect(result.description).toBe(
        'You have exceeded the allowed number of failed login attempts. Your account has been locked. Please contact the EnrollNow administrator at your institution to get your account unlocked.'
      );
      expect(result.severity).toBe('error');
      expect(result.requiresInlineAlert).toBe(false);
    });
  });

  describe('B. Mandatory password reset or password-specific lock', () => {
    it('maps PASSWORD_RESET_REQUIRED code with Reset password action and inline alert requirement', () => {
      const result = mapAuthError({ code: 'PASSWORD_RESET_REQUIRED' });
      expect(result.code).toBe('PASSWORD_RESET_REQUIRED');
      expect(result.title).toBe('Password reset required');
      expect(result.description).toBe(
        'Your password has been locked. Please contact an EnrollNow Site Admin at your institution or use the Forgot Password link on the login page.'
      );
      expect(result.severity).toBe('warning');
      expect(result.requiresInlineAlert).toBe(true);
      expect(result.action).toBeDefined();
      expect(result.action?.label).toBe('Reset password');
      expect(result.action?.route).toBe('/forgot-password');
      expect(result.secondaryHelp).toBe("If you need assistance, contact your institution's Site Admin.");
    });

    it('maps PASSWORD_LOCK and legacy password locked message', () => {
      const result = mapAuthError({
        message:
          'Your password has been locked. You must reset your password using Forgot Password before you can log in. If you need assistance, contact the Site Admin at your institution.',
      });
      expect(result.title).toBe('Password reset required');
      expect(result.requiresInlineAlert).toBe(true);
      expect(result.action?.label).toBe('Reset password');
    });

    it('maps PASSWORD_EXPIRED code', () => {
      const result = mapAuthError({ code: 'PASSWORD_EXPIRED' });
      expect(result.title).toBe('Password reset required');
      expect(result.requiresInlineAlert).toBe(true);
    });
  });

  describe('C. Temporary account disablement', () => {
    it('maps ACCOUNT_DISABLED_TEMPORARY code with full message', () => {
      const result = mapAuthError({ code: 'ACCOUNT_DISABLED_TEMPORARY' });
      expect(result.code).toBe('ACCOUNT_DISABLED_TEMPORARY');
      expect(result.title).toBe('Account temporarily disabled');
      expect(result.description).toBe(
        'Your account has been temporarily disabled. Please contact the EnrollNow administrator at your institution to enable it. If you are a Site Administrator, please contact EnrollNow customer support to get your account unlocked.'
      );
      expect(result.severity).toBe('error');
      expect(result.requiresInlineAlert).toBe(false);
      expect(result.action).toBeUndefined();
    });

    it('maps legacy temporarily disabled message', () => {
      const result = mapAuthError({
        message:
          'Your account has been temporarily disabled. Please contact the EnrollNow administrator at your institution to enable it. If you are a Site Administrator, please contact EnrollNow customer support to get your account unlocked.',
      });
      expect(result.title).toBe('Account temporarily disabled');
      expect(result.description).toBe(
        'Your account has been temporarily disabled. Please contact the EnrollNow administrator at your institution to enable it. If you are a Site Administrator, please contact EnrollNow customer support to get your account unlocked.'
      );
      expect(result.requiresInlineAlert).toBe(false);
      expect(result.action).toBeUndefined();
    });

    it('maps to concise two-line message on login screen', () => {
      const result = mapAuthError(
        { code: 'ACCOUNT_DISABLED_TEMPORARY' },
        { isLoginScreen: true }
      );
      expect(result.description).toBe(
        'Your account has been temporarily disabled.\nContact your institution administrator for assistance.'
      );
      expect(result.description.split('\n')).toHaveLength(2);
    });
  });

  describe('D. Permanent account disablement', () => {
    it('maps ACCOUNT_DISABLED_PERMANENT code with full message', () => {
      const result = mapAuthError({ code: 'ACCOUNT_DISABLED_PERMANENT' });
      expect(result.code).toBe('ACCOUNT_DISABLED_PERMANENT');
      expect(result.title).toBe('Account disabled');
      expect(result.description).toBe(
        'Your account has been permanently disabled. Please contact the EnrollNow administrator at your institution.'
      );
      expect(result.severity).toBe('error');
      expect(result.requiresInlineAlert).toBe(false);
      expect(result.action).toBeUndefined();
    });

    it('maps legacy permanently disabled message', () => {
      const result = mapAuthError({
        message:
          'Your account has been permanently disabled. Please contact the EnrollNow administrator at your institution for assistance.',
      });
      expect(result.title).toBe('Account disabled');
      expect(result.description).toBe(
        'Your account has been permanently disabled. Please contact the EnrollNow administrator at your institution for assistance.'
      );
      expect(result.requiresInlineAlert).toBe(false);
    });
  });

  describe('E. Default account lock or Inactivity lock', () => {
    it('maps ACCOUNT_LOCKED_DEFAULT code with full message', () => {
      const result = mapAuthError({ code: 'ACCOUNT_LOCKED_DEFAULT' });
      expect(result.title).toBe('Account locked');
      expect(result.description).toBe(
        'Your account is locked. Please contact the EnrollNow administrator at your institution.'
      );
      expect(result.severity).toBe('error');
      expect(result.requiresInlineAlert).toBe(false);
    });

    it('maps ACCOUNT_LOCKED_INACTIVITY code', () => {
      const result = mapAuthError({ code: 'ACCOUNT_LOCKED_INACTIVITY' });
      expect(result.title).toBe('Account locked');
      expect(result.description).toBe(
        'Your account is locked. Please contact the EnrollNow administrator at your institution.'
      );
    });

    it('maps HTTP 423 locked status', () => {
      const result = mapAuthError({ status: 423, message: 'Your account is locked.' });
      expect(result.title).toBe('Account locked');
      expect(result.description).toBe('Your account is locked.');
    });
  });

  describe('F. Incorrect credentials', () => {
    it('maps INVALID_CREDENTIALS code', () => {
      const result = mapAuthError({ code: 'INVALID_CREDENTIALS' });
      expect(result.code).toBe('INVALID_CREDENTIALS');
      expect(result.title).toBe('Sign-in unsuccessful');
      expect(result.description).toBe('Invalid username or password. Please verify your credentials.');
      expect(result.severity).toBe('error');
      expect(result.requiresInlineAlert).toBe(false);
      expect(result.action).toBeUndefined();
    });

    it('maps HTTP 401 with credentials message', () => {
      const result = mapAuthError({
        status: 401,
        message: 'Invalid username or password. Please verify your credentials.',
      });
      expect(result.title).toBe('Sign-in unsuccessful');
      expect(result.description).toBe('Invalid username or password. Please verify your credentials.');
    });
  });

  describe('G. Session expiration', () => {
    it('maps SESSION_EXPIRED code', () => {
      const result = mapAuthError({ code: 'SESSION_EXPIRED' });
      expect(result.code).toBe('SESSION_EXPIRED');
      expect(result.title).toBe('Session expired');
      expect(result.description).toBe('Your session has expired. Please sign in again.');
      expect(result.severity).toBe('info');
      expect(result.requiresInlineAlert).toBe(false);
    });
  });

  describe('H. Network or unexpected server error', () => {
    it('maps NETWORK_ERROR code', () => {
      const result = mapAuthError({ code: 'NETWORK_ERROR' });
      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.title).toBe('Unable to sign in');
      expect(result.description).toBe("We couldn't complete your sign-in request. Please try again.");
      expect(result.severity).toBe('error');
    });

    it('maps 500 status', () => {
      const result = mapAuthError({ status: 500, message: 'Internal server error' });
      expect(result.title).toBe('Unable to sign in');
      expect(result.description).toBe("We couldn't complete your sign-in request. Please try again.");
    });
  });
});
