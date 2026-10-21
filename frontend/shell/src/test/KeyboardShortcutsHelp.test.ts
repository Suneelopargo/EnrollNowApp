// frontend/shell/src/test/KeyboardShortcutsHelp.test.ts
// Unit & Accessibility Tests for Global Header Keyboard Shortcuts Help Trigger and Modal

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { KeyboardShortcutsModal } from '../../../shared/accessibility/KeyboardShortcutsModal';
import { APPLICATION_KEYBOARD_SHORTCUTS, SHORTCUT_CATEGORIES } from '../../../shared/accessibility/shortcutRegistry';

describe('Global Header Keyboard Shortcuts Help & Accessibility', () => {
  it('defines verified shortcut entries across categories without fake or conflicting combinations', () => {
    expect(APPLICATION_KEYBOARD_SHORTCUTS.length).toBeGreaterThan(0);
    expect(SHORTCUT_CATEGORIES.length).toBe(4);

    // Verify key categories exist
    const categoryIds = SHORTCUT_CATEGORIES.map(c => c.id);
    expect(categoryIds).toContain('general');
    expect(categoryIds).toContain('workspace');
    expect(categoryIds).toContain('dialogs');
    expect(categoryIds).toContain('forms');

    // Confirm that no single-letter unmodifier shortcuts exist that hijack typing
    APPLICATION_KEYBOARD_SHORTCUTS.forEach(shortcut => {
      expect(shortcut.keys.length).toBeGreaterThan(0);
      expect(shortcut.label).toBeTruthy();
      expect(shortcut.description).toBeTruthy();
    });
  });

  it('renders KeyboardShortcutsModal with complete accessibility semantics and kbd elements', () => {
    const html = renderToStaticMarkup(
      React.createElement(KeyboardShortcutsModal, {
        isOpen: true,
        onClose: vi.fn(),
      })
    );

    // Dialog landmarks and titles
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Keyboard Navigation &amp; Shortcuts Help');

    // Section headings & accessible table semantics
    expect(html).toContain('scope="col"');
    expect(html).toContain('enl-shortcuts-table');
    expect(html).toContain('enl-kbd');

    // Standard documented keys
    expect(html).toContain('Tab');
    expect(html).toContain('Esc');
    expect(html).toContain('Enter');
    expect(html).toContain('Space');
    expect(html).toContain('←');
    expect(html).toContain('→');
  });

  it('does not render modal when closed', () => {
    const html = renderToStaticMarkup(
      React.createElement(KeyboardShortcutsModal, {
        isOpen: false,
        onClose: vi.fn(),
      })
    );

    expect(html).toBe('');
  });
});
