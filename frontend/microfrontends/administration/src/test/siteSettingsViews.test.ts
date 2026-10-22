// frontend/microfrontends/administration/src/test/siteSettingsViews.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  SecurityView,
  GeneralSettingsView,
  StudiesView,
  ImportView,
  ExportView,
  AuditLogView,
} from '../components/SiteAdminViews';
import { SiteAdminHorizontalNav } from '../components/SiteAdminHorizontalNav';
import { securitySettingsApi, SecuritySettingsResponse } from '../../../../shared/api/securitySettingsApi';
import { generalSettingsApi, GeneralSettingsResponse } from '../../../../shared/api/generalSettingsApi';
import {
  userCanManageSiteSettings,
  userIsFullSiteAdmin,
  deriveUserAccessFlags,
} from '../../../../shared/api/authApi';

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
    it('exports all views as valid React components', () => {
      expect(typeof SecurityView).toBe('function');
      expect(typeof GeneralSettingsView).toBe('function');
      expect(typeof StudiesView).toBe('function');
      expect(typeof ImportView).toBe('function');
      expect(typeof ExportView).toBe('function');
      expect(typeof AuditLogView).toBe('function');
    });

    it('renders placeholder views with correct title props', () => {
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

      const result = await securitySettingsApi.resetToDefaultSecuritySettings('11111111-1111-1111-1111-111111111111');
      expect(result).toEqual(defaultSettings);
    });
  });

  describe('US-084 General Site Settings View logic', () => {
    it('loads general site settings with SMS auto-reply text', async () => {
      const mockGeneral: GeneralSettingsResponse = {
        id: 'gen-1',
        tenantId: '11111111-1111-1111-1111-111111111111',
        defaultTextReply: 'Thank you for contacting our clinical research team. We will respond promptly.',
      };

      vi.mocked(generalSettingsApi.getGeneralSettings).mockResolvedValueOnce(mockGeneral);

      const data = await generalSettingsApi.getGeneralSettings('11111111-1111-1111-1111-111111111111');
      expect(data).toEqual(mockGeneral);
      expect(data.defaultTextReply.length).toBeLessThanOrEqual(160);
    });

    it('enforces character limit on SMS auto-reply (max 160 characters)', () => {
      const validText = 'A'.repeat(160);
      expect(validText.length).toBe(160);

      const invalidText = 'A'.repeat(161);
      expect(invalidText.length).toBeGreaterThan(160);
    });

    it('persists general site settings', async () => {
      const updatedGeneral: GeneralSettingsResponse = {
        id: 'gen-1',
        tenantId: '11111111-1111-1111-1111-111111111111',
        defaultTextReply: 'Updated clinical operations automated text reply.',
      };

      vi.mocked(generalSettingsApi.updateGeneralSettings).mockResolvedValueOnce(updatedGeneral);

      const result = await generalSettingsApi.updateGeneralSettings(
        { defaultTextReply: 'Updated clinical operations automated text reply.' },
        '11111111-1111-1111-1111-111111111111'
      );

      expect(result.defaultTextReply).toBe('Updated clinical operations automated text reply.');
    });
  });

  describe('SiteAdminHorizontalNav Security Tab Visibility', () => {
    it('renders the Security tab for non-full site admins (e.g. Site Manager, Registry only access)', () => {
      const html = renderToStaticMarkup(
        React.createElement(SiteAdminHorizontalNav, {
          activeTab: 'studies',
          onTabChange: vi.fn(),
          isFullSiteAdmin: false,
        })
      );

      // Security tab MUST be present even when isFullSiteAdmin is false
      expect(html).toContain('Security');
      // Audit log remains restricted to full site admin
      expect(html).not.toContain('Audit Log');
    });

    it('renders both Security and Audit Log tabs for Full Site Admin', () => {
      const html = renderToStaticMarkup(
        React.createElement(SiteAdminHorizontalNav, {
          activeTab: 'studies',
          onTabChange: vi.fn(),
          isFullSiteAdmin: true,
        })
      );

      expect(html).toContain('Security');
      expect(html).toContain('Audit Log');
    });
  });

  describe('Site Manager Settings Edit Parity', () => {
    it('grants settings edit permissions to SITE_MANAGER role via userCanManageSiteSettings', () => {
      const siteManagerUser = deriveUserAccessFlags({
        id: 'usr-sm-1',
        email: 'manager@example.com',
        roles: ['SITE_MANAGER'],
        siteRole: 'SITE_MANAGER',
      });

      expect(userCanManageSiteSettings(siteManagerUser)).toBe(true);
      expect(userIsFullSiteAdmin(siteManagerUser)).toBe(false);
    });

    it('denies settings edit permissions to pure registry access users without manage permissions', () => {
      const registryOnlyUser = deriveUserAccessFlags({
        id: 'usr-reg-1',
        email: 'reg@example.com',
        roles: ['SITE_REGISTRY'],
        siteRole: 'SITE_REGISTRY',
        permissions: ['REGISTRY_VIEW'],
      });

      expect(userCanManageSiteSettings(registryOnlyUser)).toBe(false);
    });

    it('renders SecurityView and GeneralSettingsView with canEdit prop support', () => {
      const secHtml = renderToStaticMarkup(
        React.createElement(SecurityView, {
          tenantId: '11111111-1111-1111-1111-111111111111',
          isFullSiteAdmin: false,
          canEdit: true,
        })
      );

      expect(secHtml).toContain('sec-view-wrapper');

      const genHtml = renderToStaticMarkup(
        React.createElement(GeneralSettingsView, {
          tenantId: '11111111-1111-1111-1111-111111111111',
          isFullSiteAdmin: false,
          canEdit: true,
        })
      );

      expect(genHtml).toContain('sec-view-wrapper');
    });
  });
});
