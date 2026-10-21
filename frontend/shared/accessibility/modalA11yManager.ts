// frontend/shared/accessibility/modalA11yManager.ts
// Coordinated Modal Accessibility Manager: Reference-Counted Scroll Lock and Ancestor-Safe Inert Background Management
// WCAG 2.2 AA (2.4.3 Focus Order, 1.4.11 Non-text Contrast, 2.1.1 Keyboard) & ADA Compliance

let scrollLockCount = 0;
let originalBodyOverflow = '';
let originalBodyPaddingRight = '';
let originalHtmlOverflow = '';

/**
 * Acquire document/body scroll lock using reference counting.
 * Prevents background page scrolling while modal is open, while preserving
 * internal modal scrolling and preventing layout shift from disappearing scrollbars.
 */
export function acquireScrollLock(): () => void {
  if (typeof document === 'undefined') {
    return () => {};
  }

  const body = document.body;
  const html = document.documentElement;

  if (scrollLockCount === 0) {
    originalBodyOverflow = body.style.overflow;
    originalBodyPaddingRight = body.style.paddingRight;
    originalHtmlOverflow = html.style.overflow;

    // Compensate for scrollbar width to prevent layout jump on desktop browsers
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    if (scrollbarWidth > 0) {
      const existingPadding = parseFloat(window.getComputedStyle(body).paddingRight || '0');
      body.style.paddingRight = `${existingPadding + scrollbarWidth}px`;
    }

    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    body.classList.add('enl-modal-open', 'enl-body-freeze');
  }

  scrollLockCount++;
  let released = false;

  return () => {
    if (released) return;
    released = true;
    scrollLockCount = Math.max(0, scrollLockCount - 1);

    if (scrollLockCount === 0) {
      body.style.overflow = originalBodyOverflow;
      body.style.paddingRight = originalBodyPaddingRight;
      html.style.overflow = originalHtmlOverflow;
      body.classList.remove('enl-modal-open', 'enl-body-freeze');
    }
  };
}

// Global registry tracking inert reference counts per DOM element
const inertElementRefCounts = new Map<HTMLElement, number>();

/**
 * Applies native `inert` and `aria-hidden` to all background siblings across the DOM tree.
 * CRITICAL RULE: NEVER makes an ancestor containing the active modal inert.
 * Supports nested dialogs safely via reference counting.
 */
export function acquireInertBackground(activeDialogElement: HTMLElement | null): () => void {
  if (typeof document === 'undefined' || !activeDialogElement) {
    return () => {};
  }

  // Find all elements to make inert:
  // For activeDialogElement and every ancestor up to document.body,
  // select all sibling elements that are not ancestors of activeDialogElement.
  const elementsToInert: HTMLElement[] = [];
  const ancestors = new Set<HTMLElement>();

  let ancestorNode: HTMLElement | null = activeDialogElement;
  while (ancestorNode && ancestorNode !== document.body) {
    ancestors.add(ancestorNode);
    ancestorNode = ancestorNode.parentElement;
  }
  ancestors.add(document.body);

  let currentNode: HTMLElement | null = activeDialogElement;
  while (currentNode && currentNode.parentElement && currentNode !== document.body) {
    const parentNode: HTMLElement = currentNode.parentElement;
    const children = Array.from(parentNode.children) as HTMLElement[];

    for (const child of children) {
      if (child instanceof HTMLElement && !ancestors.has(child) && !child.contains(activeDialogElement)) {
        // Exclude script, style, meta, etc.
        const tagName = child.tagName.toLowerCase();
        if (tagName !== 'script' && tagName !== 'style' && tagName !== 'meta' && tagName !== 'link') {
          elementsToInert.push(child);
        }
      }
    }

    currentNode = parentNode;
  }

  // Apply inert attribute to elements
  for (const el of elementsToInert) {
    const currentCount = inertElementRefCounts.get(el) || 0;
    if (currentCount === 0) {
      // Store existing aria-hidden state if any
      const existingAriaHidden = el.getAttribute('aria-hidden');
      if (existingAriaHidden !== null) {
        el.dataset.enlPrevAriaHidden = existingAriaHidden;
      }
      el.setAttribute('inert', '');
      (el as any).inert = true;
      el.setAttribute('aria-hidden', 'true');
    }
    inertElementRefCounts.set(el, currentCount + 1);
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;

    for (const el of elementsToInert) {
      const currentCount = inertElementRefCounts.get(el);
      if (currentCount === undefined) continue;

      if (currentCount <= 1) {
        inertElementRefCounts.delete(el);
        el.removeAttribute('inert');
        (el as any).inert = false;

        if (el.dataset.enlPrevAriaHidden !== undefined) {
          el.setAttribute('aria-hidden', el.dataset.enlPrevAriaHidden);
          delete el.dataset.enlPrevAriaHidden;
        } else {
          el.removeAttribute('aria-hidden');
        }
      } else {
        inertElementRefCounts.set(el, currentCount - 1);
      }
    }
  };
}
