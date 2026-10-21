// frontend/shared/accessibility/AccessibleField.tsx
// Reusable Accessible Form Field Wrapper (WCAG 3.3.1 Error Identification, 3.3.2 Labels/Instructions, 4.1.2 Name/Role/Value)

import React from 'react';

export interface AccessibleFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string | null;
  helperText?: string;
  placeholder?: string;
  value?: string | number | readonly string[];
  children: (props: {
    id: string;
    'aria-invalid': boolean;
    'aria-describedby': string | undefined;
    'aria-required': boolean;
    required: boolean;
    placeholder: string | undefined;
  }) => React.ReactNode;
  className?: string;
  labelClassName?: string;
}

export const AccessibleField: React.FC<AccessibleFieldProps> = ({
  id,
  label,
  required = false,
  error,
  helperText,
  placeholder,
  value,
  children,
  className = 'form-group',
  labelClassName = 'form-label',
}) => {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

  // Visual Inline Error: When invalid and value is empty, replace placeholder with error message
  const isValueEmpty = value === undefined || value === null || String(value).trim() === '';
  const inlinePlaceholder = (error && isValueEmpty) ? error : placeholder;

  return (
    <div className={className}>
      <label htmlFor={id} className={labelClassName}>
        {label}
        {required && (
          <span className="form-required-marker" aria-hidden="true">
            {' '}*
          </span>
        )}
      </label>

      {children({
        id,
        'aria-invalid': !!error,
        'aria-describedby': describedBy,
        'aria-required': required,
        required,
        placeholder: inlinePlaceholder,
      })}

      {helperText && (
        <div id={helperId} className="form-field-helper">
          {helperText}
        </div>
      )}

      {/* Screen-reader accessible error announcement (visually hidden so no separate visible error appears below input) */}
      {error && (
        <div id={errorId} className="sr-only" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default AccessibleField;
