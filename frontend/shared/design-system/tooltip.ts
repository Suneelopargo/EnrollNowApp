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

    // Check nearest scrolling container (AG Grid viewport, tables, dialogs)
    const scrollParent = target.closest(
      '.ag-body-viewport, .ag-center-cols-viewport, .ag-pinned-right-cols-container, .ag-root, .ag-root-wrapper, .table-container, .modal-body, .record-detail__panel-content'
    );
    if (scrollParent) {
      const parentRect = scrollParent.getBoundingClientRect();
      const distFromParentTop = rect.top - parentRect.top;
      spaceAbove = Math.min(spaceAbove, distFromParentTop);
    }

    // If less than 65px of vertical space above the element, position tooltip at the bottom
    if (spaceAbove < 65) {
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
