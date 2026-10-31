import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export const TooltipButton: React.FC<TooltipButtonProps> = ({
  label,
  disabled,
  className,
  onClick,
  children,
  ...buttonProps
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    placement: TooltipPlacement;
    ready: boolean;
  }>({ left: 0, top: 0, placement: 'top', ready: false });
  const tooltipId = React.useId();

  useLayoutEffect(() => {
    if (!isTooltipVisible) return;

    const updatePosition = () => {
      const buttonBounds = buttonRef.current?.getBoundingClientRect();
      const tooltipBounds = tooltipRef.current?.getBoundingClientRect();
      if (!buttonBounds || !tooltipBounds) return;

      const gap = 8;
      const padding = 8;
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = document.documentElement.clientHeight;
      const available = {
        top: buttonBounds.top - padding,
        bottom: viewportHeight - buttonBounds.bottom - padding,
        left: buttonBounds.left - padding,
        right: viewportWidth - buttonBounds.right - padding,
      };
      const fits = {
        top: available.top >= tooltipBounds.height + gap,
        bottom: available.bottom >= tooltipBounds.height + gap,
        left: available.left >= tooltipBounds.width + gap,
        right: available.right >= tooltipBounds.width + gap,
      };
      const placement: TooltipPlacement = (['top', 'bottom', 'right', 'left'] as const)
        .find((side) => fits[side])
        ?? (Object.entries(available).sort((a, b) => b[1] - a[1])[0][0] as TooltipPlacement);

      let left = buttonBounds.left + buttonBounds.width / 2 - tooltipBounds.width / 2;
      let top = buttonBounds.top - tooltipBounds.height - gap;
      if (placement === 'bottom') top = buttonBounds.bottom + gap;
      if (placement === 'left') {
        left = buttonBounds.left - tooltipBounds.width - gap;
        top = buttonBounds.top + buttonBounds.height / 2 - tooltipBounds.height / 2;
      }
      if (placement === 'right') {
        left = buttonBounds.right + gap;
        top = buttonBounds.top + buttonBounds.height / 2 - tooltipBounds.height / 2;
      }

      setPosition({
        left: Math.max(padding, Math.min(left, viewportWidth - tooltipBounds.width - padding)),
        top: Math.max(padding, Math.min(top, viewportHeight - tooltipBounds.height - padding)),
        placement,
        ready: true,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isTooltipVisible, label]);

  return (
    <>
      <button
        {...buttonProps}
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-describedby={isTooltipVisible ? tooltipId : undefined}
        className={className}
        onClick={onClick}
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
        onFocus={() => setIsTooltipVisible(true)}
        onBlur={() => setIsTooltipVisible(false)}
      >
        {children}
      </button>
      {isTooltipVisible && typeof document !== 'undefined' && createPortal(
        <span
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className="participant-action-tooltip"
          data-placement={position.placement}
          style={{
            left: position.left,
            top: position.top,
            visibility: position.ready ? 'visible' : 'hidden',
          }}
        >
          {label}
        </span>,
        document.body
      )}
    </>
  );
};

export default TooltipButton;
