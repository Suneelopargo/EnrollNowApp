import React from 'react';

export interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  footer,
  children,
  className = '',
  onClick,
}) => {
  const handleKeyDown = onClick
    ? (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.target && e.currentTarget && e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }
    : undefined;

  return (
    <div
      className={`card ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      {(title || actions) && (
        <div className="card-header">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p className="stat-subtext">{subtitle}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

export default Card;
