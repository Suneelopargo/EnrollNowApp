// frontend/shared/accessibility/useFocusTrap.ts
// Reusable WAI-ARIA Compliant Focus Trap Hook (WCAG 2.4.3 Focus Order, 2.1.1 Keyboard)
// Supports Ancestor-Safe Native Inert, Reference-Counted Scroll Locking, and Safe Focus Restoration

import { useEffect, useRef } from 'react';
import { acquireScrollLock, acquireInertBackground } from './modalA11yManager';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]',
].join(', ');

export interface UseFocusTrapOptions {
  active?: boolean;
  onEscape?: () => void;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  returnFocus?: boolean;
  lockScroll?: boolean;
  inertBackground?: boolean;
  fallbackFocusSelector?: string;
}

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  options: UseFocusTrapOptions = {}
) {
  const {
    active = true,
    onEscape,
    initialFocusRef,
    returnFocus = true,
    lockScroll = true,
    inertBackground = true,
    fallbackFocusSelector = '#main-content',
  } = options;

  const containerRef = useRef<T | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Capture currently focused element so we can restore focus upon close
    if (typeof document !== 'undefined') {
      const activeEl = document.activeElement;
      if (activeEl instanceof HTMLElement) {
        triggerRef.current = activeEl;
      }
    }

    const container = containerRef.current;
    if (!container) return;

    // 1. Acquire reference-counted document scroll lock
    const releaseScroll = lockScroll ? acquireScrollLock() : undefined;

    // 2. Acquire ancestor-safe background inert
    const releaseInert = inertBackground ? acquireInertBackground(container) : undefined;

    // 3. Focus first focusable element, autofocus target, or container
    const focusTimer = setTimeout(() => {
      if (initialFocusRef?.current && document.body.contains(initialFocusRef.current)) {
        initialFocusRef.current.focus();
        return;
      }

      // Check for autofocus element inside container
      const autoFocusTarget = container.querySelector<HTMLElement>('[autofocus]:not([disabled])');
      if (autoFocusTarget) {
        autoFocusTarget.focus();
        return;
      }

      // Find all focusable elements
      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.hasAttribute('disabled') && (el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0));

      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        container.focus();
      }
    }, 20);

    // 4. Handle Tab / Shift+Tab keyboard focus containment
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onEscape) {
          e.preventDefault();
          e.stopPropagation();
          onEscape();
        }
        return;
      }

      if (e.key !== 'Tab') {
        // Allow Arrow keys, Enter, Space, and all typing keys to flow naturally
        // to active inputs, selects, tabs, and tables without interference.
        return;
      }

      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.hasAttribute('disabled') && (el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0));

      if (focusables.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }

      const firstElement = focusables[0];
      const lastElement = focusables[focusables.length - 1];
      const activeElement = document.activeElement;

      // If activeElement is outside the container, bring focus back inside
      if (!container.contains(activeElement)) {
        e.preventDefault();
        if (e.shiftKey) {
          lastElement.focus();
        } else {
          firstElement.focus();
        }
        return;
      }

      if (e.shiftKey) {
        // Shift + Tab: if on first element or on container, wrap to last element
        if (activeElement === firstElement || activeElement === container) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if on last element, wrap to first element
        if (activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);

      // Release background inert and scroll lock
      if (releaseInert) releaseInert();
      if (releaseScroll) releaseScroll();

      // Restore focus to original trigger element with safe fallback
      if (returnFocus) {
        setTimeout(() => {
          try {
            const trigger = triggerRef.current;
            if (trigger && document.body.contains(trigger) && typeof trigger.focus === 'function') {
              trigger.focus();
            } else if (fallbackFocusSelector) {
              const fallbackEl = document.querySelector<HTMLElement>(fallbackFocusSelector);
              if (fallbackEl && typeof fallbackEl.focus === 'function') {
                fallbackEl.focus();
              }
            }
          } catch {
            // Safe fallback if target element is no longer focusable
          }
        }, 10);
      }
    };
  }, [active, onEscape, initialFocusRef, returnFocus, lockScroll, inertBackground, fallbackFocusSelector]);

  return containerRef;
}

export default useFocusTrap;
