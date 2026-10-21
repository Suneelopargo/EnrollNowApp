// frontend/shared/accessibility.test.ts
// Automated Accessibility Test Suite (WCAG 2.2 AA & ADA Verification)

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Modal } from './design-system/components/Modal';
import { Tabs } from './design-system/components/Tabs';
import { DataTable } from './design-system/components/DataTable';
import { SkipLink } from './accessibility/SkipLink';
import { AccessibleField } from './accessibility/AccessibleField';
import { ToasterContainer } from './toaster/ToasterContainer';
import {
  verifyModalSemantics,
  verifyTabsSemantics,
} from './accessibility/a11y-test-helpers';

describe('Global Accessibility Foundation & WCAG 2.2 AA Verification', () => {
  describe('SkipLink Component (WCAG 2.4.1 Bypass Blocks)', () => {
    it('renders accessible skip navigation link targeting main content', () => {
      const html = renderToStaticMarkup(
        React.createElement(SkipLink, {
          targetId: 'main-content',
          label: 'Skip to main content',
        })
      );

      expect(html).toContain('href="#main-content"');
      expect(html).toContain('enl-skip-link');
      expect(html).toContain('Skip to main content');
    });
  });

  describe('AccessibleField Component (WCAG 3.3.1 & 3.3.2 Forms & Errors with Inline Presentation)', () => {
    it('displays validation message inside placeholder when field is invalid and empty', () => {
      const html = renderToStaticMarkup(
        React.createElement(AccessibleField, {
          id: 'test-user-email',
          label: 'Email Address',
          required: true,
          placeholder: 'Enter Email',
          error: 'Email is required',
          children: (props: any) =>
            React.createElement('input', {
              ...props,
              type: 'email',
              className: 'form-input',
            }),
        })
      );

      // 1. Placeholder contains validation message when invalid and empty
      expect(html).toContain('placeholder="Email is required"');

      // 2. Input has aria-invalid="true"
      expect(html).toContain('aria-invalid="true"');

      // 3. Associated via aria-describedby
      expect(html).toContain('aria-describedby="test-user-email-error"');

      // 4. Available to assistive technologies with sr-only and role="alert"
      expect(html).toContain('id="test-user-email-error"');
      expect(html).toContain('class="sr-only"');
      expect(html).toContain('role="alert"');
      expect(html).toContain('Email is required');

      // 5. No separate visible error message rendered below input
      expect(html).not.toContain('class="form-error-message"');

      // Label and required marker
      expect(html).toContain('for="test-user-email"');
      expect(html).toContain('Email Address');
      expect(html).toContain('form-required-marker');
      expect(html).toContain('aria-required="true"');
    });

    it('never overwrites user-entered value when error occurs', () => {
      const html = renderToStaticMarkup(
        React.createElement(AccessibleField, {
          id: 'test-user-first-name',
          label: 'First Name',
          value: 'John',
          placeholder: 'Enter First Name',
          error: 'First Name must not contain special symbols',
          children: (props: any) =>
            React.createElement('input', {
              ...props,
              type: 'text',
              value: 'John',
              readOnly: true,
              className: 'form-input',
            }),
        })
      );

      // Value is preserved and NOT replaced by error message
      expect(html).toContain('value="John"');
      expect(html).not.toContain('value="First Name must not contain special symbols"');
      // Placeholder remains default placeholder because value is non-empty
      expect(html).toContain('placeholder="Enter First Name"');
      // But aria-invalid and screen-reader alert remain active
      expect(html).toContain('aria-invalid="true"');
      expect(html).toContain('aria-describedby="test-user-first-name-error"');
      expect(html).toContain('class="sr-only"');
    });

    it('restores normal placeholder and clears aria-invalid when field becomes valid', () => {
      const html = renderToStaticMarkup(
        React.createElement(AccessibleField, {
          id: 'test-user-name',
          label: 'Full Name',
          placeholder: 'Enter Full Name',
          error: null,
          children: (props: any) =>
            React.createElement('input', { ...props, type: 'text', className: 'form-input' }),
        })
      );

      expect(html).toContain('for="test-user-name"');
      expect(html).toContain('placeholder="Enter Full Name"');
      expect(html).toContain('aria-invalid="false"');
      expect(html).not.toContain('role="alert"');
      expect(html).not.toContain('class="sr-only"');
      expect(html).not.toContain('class="form-error-message"');
    });
  });

  describe('Modal Component (WCAG 2.4.3 & WAI-ARIA Dialog Pattern)', () => {
    it('renders role dialog with aria-modal and aria-labelledby', () => {
      const html = renderToStaticMarkup(
        React.createElement(Modal, {
          isOpen: true,
          onClose: vi.fn(),
          title: 'Add New Clinical Study',
          children: React.createElement('p', null, 'Study form body'),
        })
      );

      expect(html).toContain('role="presentation"');
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby=');
      expect(html).toContain('Add New Clinical Study');
      expect(html).toContain('aria-label="Close dialog"');
      expect(html).toContain('Study form body');
    });

    it('returns empty when closed', () => {
      const html = renderToStaticMarkup(
        React.createElement(Modal, {
          isOpen: false,
          onClose: vi.fn(),
          title: 'Closed Modal',
          children: null,
        })
      );

      expect(html).toBe('');
    });
  });

  describe('Tabs Component (WAI-ARIA Tablist & Roving TabIndex)', () => {
    it('renders role tablist with tabs, aria-selected, and roving tabIndex', () => {
      const tabsData = [
        { id: 'general', label: 'General Info' },
        { id: 'security', label: 'Security Policy' },
        { id: 'audit', label: 'Audit Trail' },
      ];

      const html = renderToStaticMarkup(
        React.createElement(Tabs, {
          tabs: tabsData,
          activeTab: 'security',
          onChange: vi.fn(),
          ariaLabel: 'Settings Tabs',
        })
      );

      expect(html).toContain('role="tablist"');
      expect(html).toContain('aria-label="Settings Tabs"');
      expect(html).toContain('role="tab"');

      // Active tab
      expect(html).toContain('id="tab-security"');
      expect(html).toContain('aria-selected="true"');
      expect(html).toContain('tabindex="0"');

      // Inactive tabs
      expect(html).toContain('id="tab-general"');
      expect(html).toContain('aria-selected="false"');
      expect(html).toContain('tabindex="-1"');
    });
  });

  describe('DataTable Component (WCAG 1.3.1 Table Accessibility)', () => {
    it('renders headers with scope="col"', () => {
      const columns = [
        { key: 'name', header: 'Participant Name' },
        { key: 'status', header: 'Status' },
      ];
      const data = [{ name: 'Jane Doe', status: 'Active' }];

      const html = renderToStaticMarkup(
        React.createElement(DataTable, {
          columns,
          data,
          keyExtractor: (item: any) => item.name,
        })
      );

      expect(html).toContain('role="region"');
      expect(html).toContain('<th scope="col">Participant Name</th>');
      expect(html).toContain('<th scope="col">Status</th>');
      expect(html).toContain('Jane Doe');
    });

    it('renders status role when loading or empty', () => {
      const loadingHtml = renderToStaticMarkup(
        React.createElement(DataTable, {
          columns: [],
          data: [],
          keyExtractor: () => '',
          loading: true,
        })
      );

      expect(loadingHtml).toContain('role="status"');
      expect(loadingHtml).toContain('aria-live="polite"');

      const emptyHtml = renderToStaticMarkup(
        React.createElement(DataTable, {
          columns: [],
          data: [],
          keyExtractor: () => '',
          loading: false,
        })
      );

      expect(emptyHtml).toContain('role="status"');
      expect(emptyHtml).toContain('aria-live="polite"');
    });
  });

  describe('Semantics Verifiers', () => {
    it('verifies modal semantics correctly', () => {
      const mockDiv = {
        getAttribute: (attr: string) => {
          if (attr === 'role') return 'dialog';
          if (attr === 'aria-modal') return 'true';
          if (attr === 'aria-labelledby') return 'dialog-title';
          return null;
        },
      } as any;

      const res = verifyModalSemantics(mockDiv);
      expect(res.hasDialogRole).toBe(true);
      expect(res.isModal).toBe(true);
      expect(res.hasAccessibleName).toBe(true);
    });

    it('verifies tabs semantics correctly', () => {
      const tab0 = { getAttribute: (a: string) => (a === 'aria-selected' ? 'false' : a === 'tabindex' ? '-1' : null) };
      const tab1 = { getAttribute: (a: string) => (a === 'aria-selected' ? 'true' : a === 'tabindex' ? '0' : null) };
      const mockContainer = {
        getAttribute: (attr: string) => (attr === 'role' ? 'tablist' : null),
        querySelectorAll: () => [tab0, tab1],
      } as any;

      const res = verifyTabsSemantics(mockContainer);
      expect(res.hasTablistRole).toBe(true);
      expect(res.tabsCount).toBe(2);
      expect(res.selectedTabsCount).toBe(1);
      expect(res.hasRovingTabIndex).toBe(true);
    });
  });
});
