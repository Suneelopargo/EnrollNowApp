// frontend/shared/accessibility/a11y-test-helpers.ts
// Reusable Automated Accessibility Testing Helpers & WCAG 2.2 AA Verifiers

import axe from 'axe-core';

export interface A11yCheckResult {
  passes: boolean;
  violations: Array<{
    id: string;
    impact?: string;
    description: string;
    help: string;
    helpUrl: string;
    nodes: Array<{ html: string; target: string[] }>;
  }>;
}

/**
 * Runs axe-core against a DOM element or container and formats any WCAG 2.2 violations.
 */
export async function runAxe(
  element: Element | Document | string,
  options?: axe.RunOptions
): Promise<A11yCheckResult> {
  let targetElement: Element | Document;

  if (typeof element === 'string') {
    const div = document.createElement('div');
    div.innerHTML = element;
    document.body.appendChild(div);
    targetElement = div;
  } else {
    targetElement = element;
  }

  try {
    const results = await axe.run(targetElement as any, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      },
      ...options,
    });

    const violations = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact ?? undefined,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.map((n) => ({
        html: n.html,
        target: n.target.map(String),
      })),
    }));

    return {
      passes: violations.length === 0,
      violations,
    };
  } finally {
    if (typeof element === 'string' && targetElement.parentNode) {
      targetElement.parentNode.removeChild(targetElement);
    }
  }
}

/**
 * Asserts that a rendered element has zero WCAG 2.2 Level AA violations.
 */
export async function expectNoA11yViolations(
  element: Element | Document | string,
  options?: axe.RunOptions
) {
  const result = await runAxe(element, options);
  if (!result.passes) {
    const formatted = result.violations
      .map(
        (v) =>
          `[${v.impact?.toUpperCase() || 'VIOLATION'}] ${v.id}: ${v.help} (${v.helpUrl})\n` +
          v.nodes.map((n) => `  Node: ${n.html}`).join('\n')
      )
      .join('\n\n');
    throw new Error(`Accessibility violations detected:\n${formatted}`);
  }
}

/**
 * Checks that an interactive modal or alertdialog satisfies WAI-ARIA modal requirements.
 */
export function verifyModalSemantics(container: HTMLElement | null): {
  hasDialogRole: boolean;
  isModal: boolean;
  hasAccessibleName: boolean;
} {
  if (!container) return { hasDialogRole: false, isModal: false, hasAccessibleName: false };

  const role = container.getAttribute('role');
  const hasDialogRole = role === 'dialog' || role === 'alertdialog';
  const isModal = container.getAttribute('aria-modal') === 'true';
  const hasAccessibleName =
    Boolean(container.getAttribute('aria-labelledby')) ||
    Boolean(container.getAttribute('aria-label'));

  return { hasDialogRole, isModal, hasAccessibleName };
}

/**
 * Checks that a tabs container satisfies WAI-ARIA tablist requirements.
 */
export function verifyTabsSemantics(container: HTMLElement | null): {
  hasTablistRole: boolean;
  tabsCount: number;
  selectedTabsCount: number;
  hasRovingTabIndex: boolean;
} {
  if (!container) {
    return { hasTablistRole: false, tabsCount: 0, selectedTabsCount: 0, hasRovingTabIndex: false };
  }

  const hasTablistRole = container.getAttribute('role') === 'tablist';
  const tabs = Array.from(container.querySelectorAll('[role="tab"]'));
  const selectedTabs = tabs.filter((t) => t.getAttribute('aria-selected') === 'true');
  const activeTabIndexes = tabs.filter((t) => t.getAttribute('tabindex') === '0');

  return {
    hasTablistRole,
    tabsCount: tabs.length,
    selectedTabsCount: selectedTabs.length,
    hasRovingTabIndex: activeTabIndexes.length === 1,
  };
}
