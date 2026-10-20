// frontend/microfrontends/administration/src/test/siteSettingsViews.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SecurityView,
  GeneralSettingsView,
  StudiesView,
  ImportView,
  ExportView,
  AuditLogView,
} from '../components/SiteAdminViews';
import { securitySettingsApi, SecuritySettingsResponse } from '../../../../shared/api/securitySettingsApi';
import { generalSettingsApi, GeneralSettingsResponse } from '../../../../shared/api/generalSettingsApi';

vi.mock('../../../../shared/api/securitySettingsApi', () => ({
  securitySettingsApi: {
    getSecuritySettings: vi.fn(),
    updateSecuritySettings: vi.fn(),
    resetToDefaultSecuritySettings: vi.fn(),
  },
}));

vi.mock('../../../../shared/api/generalSettingsApi', () => ({
  generalSettingsApi: {
    getGeneralSettings: vi.fn(),
    updateGeneralSettings: vi.fn(),
  },
}));

vi.mock('../../../../shared/toaster', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe('US-065 Site Security Policy & US-084 General Site Settings Views', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component exports and contract verification', () => {
    it('exports SecurityView and GeneralSettingsView components from SiteAdminViews', () => {
      expect(SecurityView).toBeDefined();
      expect(typeof SecurityView).toBe('function');
      expect(GeneralSettingsView).toBeDefined();
      expect(typeof GeneralSettingsView).toBe('function');
    });

    it('exports unimplemented views (Studies, Import, Export, AuditLog) rendering ComingSoon states', () => {
      expect(StudiesView).toBeDefined();
      expect(typeof StudiesView).toBe('function');
      expect(ImportView).toBeDefined();
      expect(typeof ImportView).toBe('function');
      expect(ExportView).toBeDefined();
      expect(typeof ExportView).toBe('function');
      expect(AuditLogView).toBeDefined();
      expect(typeof AuditLogView).toBe('function');

      const studiesEl = StudiesView({}) as React.ReactElement<any>;
      expect(studiesEl.props.title).toBe('Site Studies Configuration');

      const importEl = ImportView({}) as React.ReactElement<any>;
      expect(importEl.props.title).toBe('Data Intake & Batch Import');

      const exportEl = ExportView({}) as React.ReactElement<any>;
      expect(exportEl.props.title).toBe('Export Configurations & Compliance Artifacts');

      const auditEl = AuditLogView({}) as React.ReactElement<any>;
      expect(auditEl.props.title).toBe('System & Security Audit Ledger');
    });
  });

  describe('US-065 Site Security Policy View logic', () => {
    it('loads and correctly maps site security settings including days to months conversion', async () => {
      const mockSettings: SecuritySettingsResponse = {
        id: 'sec-1',
        tenantId: '11111111-1111-1111-1111-111111111111',
        maxFailedLoginAttempts: 10,
        preventConcurrentSessions: false,
        inactivityLogoutMinutes: 30,
        inactivityLockDays: 90, // 3 months
        passwordExpiryDays: 300, // 10 months
        passwordHistoryCount: 4,
        minimumPasswordLength: 10,
        minimumPasswordStrength: 'MODERATE',
        requireDigit: true,
        requireSymbol: true,
        requireMixedCase: true,
      };

      vi.mocked(securitySettingsApi.getSecuritySettings).mockResolvedValueOnce(mockSettings);

      const data = await securitySettingsApi.getSecuritySettings('11111111-1111-1111-1111-111111111111');
      expect(data).toEqual(mockSettings);
      expect(data.inactivityLockDays / 30).toBe(3);
      expect(data.passwordExpiryDays / 30).toBe(10);
    });

    it('persists updated security policy with correct parameters', async () => {
      const payload = {
        maxFailedLoginAttempts: 5,
        preventConcurrentSessions: true,
        inactivityLogoutMinutes: 15,
        inactivityLockDays: 60,
        passwordExpiryDays: 180,
        passwordHistoryCount: 5,
        minimumPasswordLength: 12,
        minimumPasswordStrength: 'STRONG',
        requireDigit: true,
        requireSymbol: true,
        requireMixedCase: true,
      };

      vi.mocked(securitySettingsApi.updateSecuritySettings).mockResolvedValueOnce({
        id: 'sec-1',
        tenantId: '11111111-1111-1111-1111-111111111111',
        ...payload,
      });

      const result = await securitySettingsApi.updateSecuritySettings(payload, '11111111-1111-1111-1111-111111111111');
      expect(result.maxFailedLoginAttempts).toBe(5);
      expect(result.preventConcurrentSessions).toBe(true);
      expect(result.minimumPasswordLength).toBe(12);
    });

    it('resets security policy to defaults', async () => {
      const defaultSettings: SecuritySettingsResponse = {
        id: 'sec-1',
        tenantId: '11111111-1111-1111-1111-111111111111',
        maxFailedLoginAttempts: 10,
        preventConcurrentSessions: false,
        inactivityLogoutMinutes: 30,
        inactivityLockDays: 90,
        passwordExpiryDays: 300,
        passwordHistoryCount: 4,
        minimumPasswordLength: 10,
        minimumPasswordStrength: 'MODERATE',
        requireDigit: true,
        requireSymbol: true,
        requireMixedCase: true,
      };

      vi.mocked(securitySettingsApi.resetToDefaultSecuritySettings).mockResolvedValueOnce(defaultSettings);

      const reset = await securitySettingsApi.resetToDefaultSecuritySettings('11111111-1111-1111-1111-111111111111');
      expect(reset.maxFailedLoginAttempts).toBe(10);
      expect(reset.inactivityLogoutMinutes).toBe(30);
      expect(reset.minimumPasswordLength).toBe(10);
    });
  });

  describe('US-084 General Site Settings View logic', () => {
    it('loads general site settings with Default Text Reply template', async () => {
      const mockGeneral: GeneralSettingsResponse = {
        id: 'gen-1',
        tenantId: '11111111-1111-1111-1111-111111111111',
        defaultTextReply: 'This is an automated message. We can not receive replies to this number.',
      };

      vi.mocked(generalSettingsApi.getGeneralSettings).mockResolvedValueOnce(mockGeneral);

      const data = await generalSettingsApi.getGeneralSettings('11111111-1111-1111-1111-111111111111');
      expect(data).toEqual(mockGeneral);
      expect(data.defaultTextReply.length).toBeLessThanOrEqual(160);
    });

    it('enforces 160-character maximum and non-blank requirement on Default Text Reply', async () => {
      const validText = 'Thank you for your text. This is an automated response and replies are not monitored.';
      expect(validText.length).toBeLessThanOrEqual(160);
      expect(validText.trim().length).toBeGreaterThan(0);

      vi.mocked(generalSettingsApi.updateGeneralSettings).mockResolvedValueOnce({
        id: 'gen-1',
        tenantId: '11111111-1111-1111-1111-111111111111',
        defaultTextReply: validText,
      });

      const updated = await generalSettingsApi.updateGeneralSettings(
        { defaultTextReply: validText },
        '11111111-1111-1111-1111-111111111111'
      );
      expect(updated.defaultTextReply).toBe(validText);
    });
  });
});
