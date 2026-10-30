// frontend/shared/design-system/tooltip.ts - Auto-adjusting Tooltip Position
/**
 * Automatically adjusts tooltip positioning (top vs bottom) based on available
 * viewport and parent container space.
 */
export function initTooltipAutoPosition(): void {
  if (typeof document === 'undefined') return;

  // Ensure singleton initialization
  if ((window as any).__enl_tooltip_auto_pos_init__) return;
  (window as any).__enl_tooltip_auto_pos_init__ = true;

  const handleHover = (e: MouseEvent) => {
    const target = (e.target as HTMLElement)?.closest?.('[data-tooltip]') as HTMLElement | null;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    let spaceAbove = rect.top;
    let spaceBelow = window.innerHeight - rect.bottom;

    // Check nearest scrolling container (AG Grid viewport, tables, dialogs)
    const scrollParent = target.closest(
      '.ag-body-viewport, .ag-center-cols-viewport, .ag-pinned-right-cols-container, .ag-root, .ag-root-wrapper, .table-container, .modal-body, .record-detail__panel-content, .participant-grid-card'
    );
    if (scrollParent) {
      const parentRect = scrollParent.getBoundingClientRect();
      const distFromParentTop = rect.top - parentRect.top;
      const distFromParentBottom = parentRect.bottom - rect.bottom;
      spaceAbove = Math.min(spaceAbove, distFromParentTop);
      spaceBelow = Math.min(spaceBelow, distFromParentBottom);
    }

    // Prefer above, but flip below when there is not enough room above and
    // the tooltip can fit below (for example, near the top of a grid).
    if (spaceAbove < 65 && spaceBelow > spaceAbove) {
      target.setAttribute('data-tooltip-pos', 'bottom');
    } else {
      target.removeAttribute('data-tooltip-pos');
    }
  };

  document.addEventListener('mouseover', handleHover, { capture: true, passive: true });
  document.addEventListener('pointerenter', handleHover as EventListener, { capture: true, passive: true });
}

// Auto-initialize when running in browser
if (typeof window !== 'undefined') {
  initTooltipAutoPosition();
}
