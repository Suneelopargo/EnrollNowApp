// frontend/shared/accessibility/shortcutRegistry.ts
// Central Registry of Actual Supported Keyboard Interactions & Shortcuts
// WCAG 2.2 AA (2.1.1 Keyboard, 2.1.4 Character Key Shortcuts, 2.4.7 Focus Visible)

export interface ShortcutDefinition {
  id: string;
  keys: string[];
  label: string;
  description: string;
  category: 'general' | 'workspace' | 'dialogs' | 'forms';
  scope?: string;
  enabled?: boolean;
}

export interface ShortcutCategory {
  id: 'general' | 'workspace' | 'dialogs' | 'forms';
  title: string;
  description: string;
}

export const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    id: 'general',
    title: 'General & Global Navigation',
    description: 'Standard keyboard navigation available across the application shell and pages.',
  },
  {
    id: 'workspace',
    title: 'Workspace Screen Tabs',
    description: 'Keyboard navigation for the multi-screen activity tab bar in the application header.',
  },
  {
    id: 'dialogs',
    title: 'Modals & Confirmation Dialogs',
    description: 'Focus containment and dismissal behavior for all dialogs and alert boxes.',
  },
  {
    id: 'forms',
    title: 'Forms & Data Entry',
    description: 'Accessible form navigation and inside-input validation feedback.',
  },
];

export const APPLICATION_KEYBOARD_SHORTCUTS: ShortcutDefinition[] = [
  // General Navigation
  {
    id: 'nav-tab',
    keys: ['Tab'],
    label: 'Next Interactive Control',
    description: 'Moves keyboard focus forward to the next button, link, or input field.',
    category: 'general',
  },
  {
    id: 'nav-shift-tab',
    keys: ['Shift', 'Tab'],
    label: 'Previous Interactive Control',
    description: 'Moves keyboard focus backward to the previous button, link, or input field.',
    category: 'general',
  },
  {
    id: 'nav-activate-enter',
    keys: ['Enter'],
    label: 'Activate / Confirm Action',
    description: 'Activates the focused button, confirms an action, or follows a focused link.',
    category: 'general',
  },
  {
    id: 'nav-toggle-space',
    keys: ['Space'],
    label: 'Toggle / Press Control',
    description: 'Toggles checkboxes, switches state, or activates buttons without submitting forms.',
    category: 'general',
  },
  {
    id: 'dismiss-escape',
    keys: ['Esc'],
    label: 'Dismiss Menus & Overlays',
    description: 'Dismisses active user menu, site selector dropdown, or screen action popups.',
    category: 'general',
  },
  {
    id: 'skip-to-content',
    keys: ['Tab (at page top)'],
    label: 'Skip to Main Content',
    description: 'Reveals the accessible bypass link to skip header navigation and jump straight to main content.',
    category: 'general',
  },

  // Workspace Screens Bar
  {
    id: 'tabs-arrows',
    keys: ['←', '→'],
    label: 'Switch Open Screens',
    description: 'When focus is on the open screens strip, arrow keys move focus between screen tabs using roving tabindex.',
    category: 'workspace',
    scope: 'Open Screens Strip',
  },
  {
    id: 'tabs-home-end',
    keys: ['Home', 'End'],
    label: 'First / Last Screen',
    description: 'Instantly moves focus to the first or last active workspace tab in the open screens bar.',
    category: 'workspace',
    scope: 'Open Screens Strip',
  },
  {
    id: 'tabs-select',
    keys: ['Enter', 'Space'],
    label: 'Activate Focused Screen Tab',
    description: 'Switches the primary workspace view to the currently focused screen tab.',
    category: 'workspace',
    scope: 'Open Screens Strip',
  },

  // Modals & Dialogs
  {
    id: 'dialog-trap',
    keys: ['Tab', 'Shift + Tab'],
    label: 'Focus Contained in Modal',
    description: 'Focus cycles strictly inside the active modal. Background content is inert and cannot be clicked or focused.',
    category: 'dialogs',
    scope: 'Active Modal Dialog',
  },
  {
    id: 'dialog-escape',
    keys: ['Esc'],
    label: 'Close Modal & Restore Focus',
    description: 'Safely dismisses the dialog and automatically restores keyboard focus to the triggering element.',
    category: 'dialogs',
    scope: 'Active Modal Dialog',
  },

  // Forms & Validation
  {
    id: 'form-inline-error',
    keys: ['Tab', 'Shift + Tab'],
    label: 'Inline Validation Navigation',
    description: 'Invalid required fields display validation errors directly inside the input placeholder in red. User-entered text is always preserved.',
    category: 'forms',
    scope: 'Form Inputs',
  },
];

export function getShortcutsByCategory(category: ShortcutDefinition['category']): ShortcutDefinition[] {
  return APPLICATION_KEYBOARD_SHORTCUTS.filter((s) => s.category === category);
}
