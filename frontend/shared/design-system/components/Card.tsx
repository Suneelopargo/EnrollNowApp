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
  return (
    <div className={`card ${className}`} onClick={onClick}>
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
