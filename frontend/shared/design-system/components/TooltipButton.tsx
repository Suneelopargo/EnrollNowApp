import React from 'react';

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
  return (
    <button
      {...buttonProps}
      type="button"
      disabled={disabled}
      aria-label={label}
      data-tooltip={label}
      className={className}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default TooltipButton;
