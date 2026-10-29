import React, { useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../accessibility/useFocusTrap';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'default' | 'wide';
  className?: string;
  ariaLabel?: string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'default',
  className = '',
  ariaLabel,
  initialFocusRef,
}) => {
  const titleId = useId();
  const trapRef = useFocusTrap<HTMLDivElement>({
    active: isOpen,
    onEscape: onClose,
    initialFocusRef,
    returnFocus: true,
  });

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal((
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabel ? undefined : titleId}
        aria-label={ariaLabel}
        tabIndex={-1}
        className={`modal-container ${size === 'wide' ? 'modal-container--wide' : ''} ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id={titleId}>{title}</h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  ), document.body);
};

export default Modal;
