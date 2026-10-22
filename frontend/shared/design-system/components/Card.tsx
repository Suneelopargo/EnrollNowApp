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

const INTERACTIVE_TAGS = new Set([
  'BUTTON',
  'A',
  'INPUT',
  'SELECT',
  'TEXTAREA',
  'LABEL',
  'SUMMARY',
]);

const INTERACTIVE_ROLES = new Set([
  'button',
  'link',
  'checkbox',
  'menuitem',
  'option',
  'radio',
  'switch',
  'tab',
  'textbox',
  'combobox',
]);

const INTERACTIVE_SELECTOR =
  'button, a, input, select, textarea, label, summary, [role="button"], [role="link"], [role="checkbox"], [role="menuitem"], [role="option"], [role="radio"], [role="switch"], [role="tab"], [role="textbox"], [role="combobox"], [contenteditable="true"], [data-card-actions="true"]';

function isInteractiveNode(node: any): boolean {
  if (!node || typeof node !== 'object') return false;
  const tagName = typeof node.tagName === 'string' ? node.tagName.toUpperCase() : '';
  if (INTERACTIVE_TAGS.has(tagName)) return true;

  const role =
    (typeof node.getAttribute === 'function' ? node.getAttribute('role') : undefined) ??
    node.role;
  if (typeof role === 'string' && INTERACTIVE_ROLES.has(role.toLowerCase())) {
    return true;
  }

  const contentEditable =
    (typeof node.getAttribute === 'function' ? node.getAttribute('contenteditable') : undefined) ??
    node.contentEditable;
  if (contentEditable === 'true' || node.isContentEditable === true) {
    return true;
  }

  const isCardActions =
    (typeof node.getAttribute === 'function' ? node.getAttribute('data-card-actions') : undefined) ??
    node.dataset?.cardActions;
  if (isCardActions === 'true') {
    return true;
  }

  return false;
}

function isNestedInteractiveTarget(
  target: EventTarget | null | undefined,
  currentTarget: EventTarget | null | undefined
): boolean {
  if (!target || target === currentTarget) return false;

  let node: any = target;
  while (node && node !== currentTarget) {
    if (isInteractiveNode(node)) {
      return true;
    }
    node = node.parentElement ?? node.parentNode ?? null;
  }

  if (typeof (target as any).closest === 'function') {
    const match = (target as any).closest(INTERACTIVE_SELECTOR);
    if (
      match &&
      match !== currentTarget &&
      (!currentTarget ||
        typeof (currentTarget as any).contains !== 'function' ||
        (currentTarget as any).contains(match))
    ) {
      return true;
    }
  }

  return false;
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
  const handleClick = onClick
    ? (e?: React.MouseEvent<HTMLDivElement>) => {
        if (e?.defaultPrevented) return;
        if (e && isNestedInteractiveTarget(e.target, e.currentTarget)) return;
        onClick();
      }
    : undefined;

  const handleKeyDown = onClick
    ? (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.defaultPrevented) return;
        if (e.target && e.currentTarget && e.target !== e.currentTarget) return;
        if (isNestedInteractiveTarget(e.target, e.currentTarget)) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }
    : undefined;

  return (
    <div
      className={`card ${className}`}
      onClick={handleClick}
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
          {actions && <div data-card-actions="true">{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

export default Card;
