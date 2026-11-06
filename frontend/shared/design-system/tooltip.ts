type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipWindow extends Window {
  __enl_tooltip_auto_pos_init__?: boolean;
}

const TOOLTIP_SELECTOR = '[data-tooltip]';
const PLACEMENTS: TooltipPlacement[] = ['top', 'bottom', 'right', 'left'];

export function initTooltipAutoPosition(): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const tooltipWindow = window as TooltipWindow;
  if (tooltipWindow.__enl_tooltip_auto_pos_init__) return;
  if (!document.body) {
    document.addEventListener('DOMContentLoaded', initTooltipAutoPosition, { once: true });
    return;
  }

  tooltipWindow.__enl_tooltip_auto_pos_init__ = true;

  const tooltip = document.createElement('div');
  tooltip.className = 'enrollnow-tooltip';
  tooltip.id = 'enrollnow-global-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.setAttribute('aria-hidden', 'true');
  document.body.appendChild(tooltip);

  let activeTarget: HTMLElement | null = null;
  let originalPlacement: string | null = null;
  let originalDescribedBy: string | null = null;

  const restoreTargetAttributes = () => {
    if (!activeTarget) return;
    if (originalPlacement === null) {
      activeTarget.removeAttribute('data-tooltip-pos');
    } else {
      activeTarget.setAttribute('data-tooltip-pos', originalPlacement);
    }
    if (originalDescribedBy === null) {
      activeTarget.removeAttribute('aria-describedby');
    } else {
      activeTarget.setAttribute('aria-describedby', originalDescribedBy);
    }
  };

  const hideTooltip = () => {
    restoreTargetAttributes();
    activeTarget = null;
    originalPlacement = null;
    originalDescribedBy = null;
    tooltip.removeAttribute('data-visible');
    tooltip.setAttribute('aria-hidden', 'true');
  };

  const updatePosition = () => {
    if (!activeTarget?.isConnected) {
      hideTooltip();
      return;
    }
    const text = activeTarget.getAttribute('data-tooltip')?.trim();
    if (!text) {
      hideTooltip();
      return;
    }
    if (tooltip.textContent !== text) tooltip.textContent = text;

    const targetBounds = activeTarget.getBoundingClientRect();
    const tooltipBounds = tooltip.getBoundingClientRect();
    const gap = 8;
    const padding = 8;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const available = {
      top: targetBounds.top - padding,
      bottom: viewportHeight - targetBounds.bottom - padding,
      right: viewportWidth - targetBounds.right - padding,
      left: targetBounds.left - padding,
    };
    const fits: Record<TooltipPlacement, boolean> = {
      top: available.top >= tooltipBounds.height + gap,
      bottom: available.bottom >= tooltipBounds.height + gap,
      right: available.right >= tooltipBounds.width + gap,
      left: available.left >= tooltipBounds.width + gap,
    };

    const preferredPlacement = activeTarget.getAttribute('data-tooltip-placement') as TooltipPlacement | null;
    const placementOrder = preferredPlacement && PLACEMENTS.includes(preferredPlacement)
      ? [preferredPlacement, ...PLACEMENTS.filter((side) => side !== preferredPlacement)]
      : PLACEMENTS;
    const placement = placementOrder.find((side) => fits[side])
      ?? PLACEMENTS.reduce((best, side) => available[side] > available[best] ? side : best, PLACEMENTS[0]);

    let left = targetBounds.left + targetBounds.width / 2 - tooltipBounds.width / 2;
    let top = targetBounds.top - tooltipBounds.height - gap;
    if (placement === 'bottom') top = targetBounds.bottom + gap;
    if (placement === 'left') {
      left = targetBounds.left - tooltipBounds.width - gap;
      top = targetBounds.top + targetBounds.height / 2 - tooltipBounds.height / 2;
    }
    if (placement === 'right') {
      left = targetBounds.right + gap;
      top = targetBounds.top + targetBounds.height / 2 - tooltipBounds.height / 2;
    }

    left = Math.max(padding, Math.min(left, viewportWidth - tooltipBounds.width - padding));
    top = Math.max(padding, Math.min(top, viewportHeight - tooltipBounds.height - padding));
    tooltip.dataset.placement = placement;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.setProperty(
      '--tooltip-arrow-x',
      `${Math.max(10, Math.min(targetBounds.left + targetBounds.width / 2 - left, tooltipBounds.width - 10))}px`
    );
    tooltip.style.setProperty(
      '--tooltip-arrow-y',
      `${Math.max(10, Math.min(targetBounds.top + targetBounds.height / 2 - top, tooltipBounds.height - 10))}px`
    );
    activeTarget.setAttribute('data-tooltip-pos', placement);
  };

  const showTooltip = (target: HTMLElement | null) => {
    const text = target?.getAttribute('data-tooltip')?.trim();
    if (!target || !text) {
      hideTooltip();
      return;
    }
    if (activeTarget === target) {
      tooltip.textContent = text;
      updatePosition();
      return;
    }

    restoreTargetAttributes();
    activeTarget = target;
    originalPlacement = target.getAttribute('data-tooltip-pos');
    originalDescribedBy = target.getAttribute('aria-describedby');
    target.setAttribute(
      'aria-describedby',
      [originalDescribedBy, tooltip.id].filter(Boolean).join(' ')
    );
    tooltip.textContent = text;
    tooltip.style.visibility = 'hidden';
    tooltip.setAttribute('aria-hidden', 'false');
    tooltip.setAttribute('data-visible', 'true');
    updatePosition();
    tooltip.style.visibility = 'visible';
  };

  const getTooltipTarget = (eventTarget: EventTarget | null): HTMLElement | null => {
    if (!(eventTarget instanceof Element)) return null;
    return eventTarget.closest<HTMLElement>(TOOLTIP_SELECTOR);
  };

  document.addEventListener('mouseover', (event) => {
    showTooltip(getTooltipTarget(event.target));
  }, true);

  document.addEventListener('mouseout', (event) => {
    if (!activeTarget || !(event.target instanceof Node)) return;
    const relatedTarget = event.relatedTarget;
    if (relatedTarget instanceof Node && activeTarget.contains(relatedTarget)) return;
    if (activeTarget.contains(event.target) || activeTarget === event.target) hideTooltip();
  }, true);

  document.addEventListener('focusin', (event) => {
    showTooltip(getTooltipTarget(event.target));
  }, true);

  document.addEventListener('focusout', (event) => {
    if (!activeTarget || !(event.target instanceof Node)) return;
    const relatedTarget = event.relatedTarget;
    if (relatedTarget instanceof Node && activeTarget.contains(relatedTarget)) return;
    if (activeTarget.contains(event.target) || activeTarget === event.target) hideTooltip();
  }, true);

  document.addEventListener('pointerdown', hideTooltip, true);
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition, true);
}

if (typeof window !== 'undefined') {
  initTooltipAutoPosition();
}
