import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';
import { FilterOptionItem } from '../types/participant';

interface SearchableMultiSelectProps {
  options: FilterOptionItem[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  ariaLabel: string;
}

export const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = 'Select options...',
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = `multi-select-options-${useId().replace(/:/g, '')}`;

  const filteredOptions = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    const unselected = options.filter((option) => !selectedValues.includes(option.value));
    return term ? unselected.filter((option) => option.label.toLocaleLowerCase().includes(term)) : unselected;
  }, [options, query, selectedValues]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!containerRef.current?.contains(target) && !menuRef.current?.contains(target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const menuHeight = Math.min(230, Math.max(120, filteredOptions.length * 38 + 8));
      const openAbove = window.innerHeight - bounds.bottom < menuHeight && bounds.top > window.innerHeight - bounds.bottom;
      setMenuStyle({
        position: 'fixed',
        left: bounds.left,
        width: bounds.width,
        top: openAbove ? undefined : bounds.bottom + 4,
        bottom: openAbove ? window.innerHeight - bounds.top + 4 : undefined,
        maxHeight: Math.max(100, Math.min(230, openAbove ? bounds.top - 12 : window.innerHeight - bounds.bottom - 12)),
      });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, filteredOptions.length]);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(0, filteredOptions.length - 1)));
  }, [filteredOptions.length]);

  const toggleValue = (value: string) => {
    onChange(selectedValues.includes(value)
      ? selectedValues.filter((item) => item !== value)
      : [...selectedValues, value]);
    setQuery('');
    inputRef.current?.focus();
  };

  const removeValue = (value: string) => {
    onChange(selectedValues.filter((item) => item !== value));
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => Math.min(current + 1, filteredOptions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter' && isOpen && filteredOptions.length > 0) {
      event.preventDefault();
      toggleValue(filteredOptions[activeIndex]?.value ?? filteredOptions[0].value);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      setQuery('');
    } else if (event.key === 'Backspace' && !query && selectedValues.length > 0) {
      removeValue(selectedValues[selectedValues.length - 1]);
    }
  };

  const selectedOptions = selectedValues.map((value) =>
    options.find((option) => option.value === value) || { value, label: value }
  );

  return (
    <div className="searchable-multi-select" ref={containerRef}>
      <div
        className={`searchable-multi-select__control${isOpen ? ' is-open' : ''}`}
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        <div className="searchable-multi-select__value-container">
          {selectedOptions.map((option) => (
            <span className="searchable-multi-select__chip" key={option.value}>
              <span>{option.label}</span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeValue(option.value);
                }}
                aria-label={`Remove ${option.label}`}
                title={`Remove ${option.label}`}
              >
                <X size={13} aria-hidden="true" />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder={selectedValues.length === 0 ? placeholder : ''}
            aria-label={ariaLabel}
            aria-expanded={isOpen}
            aria-controls={listId}
            aria-autocomplete="list"
            role="combobox"
            onFocus={() => setIsOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="searchable-multi-select__actions">
          {selectedValues.length > 0 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onChange([]);
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Clear selected options"
              title="Clear selected options"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen((open) => !open);
              inputRef.current?.focus();
            }}
            aria-label={isOpen ? 'Close options' : 'Open options'}
            aria-expanded={isOpen}
          >
            <ChevronDown size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {isOpen && createPortal(
        <div ref={menuRef} className="searchable-multi-select__menu searchable-multi-select__menu--portal" style={menuStyle} id={listId} role="listbox" aria-label={ariaLabel} aria-multiselectable="true">
          {filteredOptions.length === 0 ? (
            <div className="searchable-multi-select__empty">No matching options</div>
          ) : filteredOptions.map((option, optionIndex) => {
            const selected = selectedValues.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                className={`searchable-multi-select__option${selected ? ' is-selected' : ''}${optionIndex === activeIndex ? ' is-active' : ''}`}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(optionIndex)}
                onClick={() => toggleValue(option.value)}
              >
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
};

export default SearchableMultiSelect;
