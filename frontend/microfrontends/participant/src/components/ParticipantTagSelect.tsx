// frontend/microfrontends/participant/src/components/ParticipantTagSelect.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, Loader2, ChevronDown } from 'lucide-react';
import { participantApi } from '../../../../shared/api/participantApi';

export interface ParticipantTagSelectProps {
  id?: string;
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  tenantId?: string;
  siteId?: string;
}

export const ParticipantTagSelect: React.FC<ParticipantTagSelectProps> = ({
  id = 'participant-tags',
  selectedTags = [],
  onChange,
  placeholder = 'Select tags or type to create...',
  disabled = false,
  tenantId,
  siteId,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialSuggestionsRef = useRef<string[] | null>(null);
  const lastFetchedQueryRef = useRef<string | null>(null);

  // Reset caches if tenant or site changes
  useEffect(() => {
    initialSuggestionsRef.current = null;
    lastFetchedQueryRef.current = null;
  }, [tenantId, siteId]);

  // Fetch suggestions from backend
  const fetchSuggestions = useCallback(
    async (searchQuery: string) => {
      const cleanQuery = searchQuery.trim();
      // If empty query and initial suggestions are cached, use them
      if (!cleanQuery && initialSuggestionsRef.current !== null) {
        setSuggestions(initialSuggestionsRef.current);
        return;
      }
      // If same query as last fetched, avoid duplicate network call
      if (cleanQuery === lastFetchedQueryRef.current) {
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const results = await participantApi.getParticipantTags(cleanQuery || undefined, 20, {
          params: { tenantId, siteId },
        });
        const list = Array.isArray(results) ? results : [];
        if (!cleanQuery) {
          initialSuggestionsRef.current = list;
        }
        lastFetchedQueryRef.current = cleanQuery;
        setSuggestions(list);
      } catch (err: any) {
        setError('Failed to load tag suggestions');
        setSuggestions(initialSuggestionsRef.current || []);
      } finally {
        setIsLoading(false);
      }
    },
    [tenantId, siteId]
  );

  // Fetch initial suggestions once when dropdown is opened
  useEffect(() => {
    if (!isOpen) return;
    if (initialSuggestionsRef.current === null && !inputValue.trim()) {
      fetchSuggestions('');
    }
  }, [isOpen, inputValue, fetchSuggestions]);

  // Trigger search on input change with 250ms debounce
  useEffect(() => {
    if (!isOpen) return;
    const clean = inputValue.trim();
    if (!clean) {
      if (initialSuggestionsRef.current !== null) {
        setSuggestions(initialSuggestionsRef.current);
      }
      return;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(clean);
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue, isOpen, fetchSuggestions]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const trimmedInput = inputValue.trim();

  // Filter out already selected tags from suggestions
  const availableSuggestions = suggestions.filter(
    (tag) => !selectedTags.some((s) => s.toLowerCase() === tag.toLowerCase())
  );

  // Can we create a new tag with the current input?
  const isInputExactMatchInSelected = selectedTags.some(
    (s) => s.toLowerCase() === trimmedInput.toLowerCase()
  );
  const isInputExactMatchInSuggestions = availableSuggestions.some(
    (tag) => tag.toLowerCase() === trimmedInput.toLowerCase()
  );
  const showCreateOption = trimmedInput.length > 0 && !isInputExactMatchInSelected && !isInputExactMatchInSuggestions;

  const totalOptionsCount = availableSuggestions.length + (showCreateOption ? 1 : 0);

  const handleAddTag = (tagToAdd: string) => {
    const cleanTag = tagToAdd.trim();
    if (!cleanTag) return;
    if (selectedTags.some((s) => s.toLowerCase() === cleanTag.toLowerCase())) {
      setInputValue('');
      return;
    }
    onChange([...selectedTags, cleanTag]);
    setInputValue('');
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  const handleRemoveTag = (indexToRemove: number) => {
    if (disabled) return;
    const next = selectedTags.filter((_, idx) => idx !== indexToRemove);
    onChange(next);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange([]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      handleRemoveTag(selectedTags.length - 1);
      return;
    }

    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < totalOptionsCount - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : totalOptionsCount - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setFocusedIndex(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < availableSuggestions.length) {
        handleAddTag(availableSuggestions[focusedIndex]);
      } else if (focusedIndex === availableSuggestions.length && showCreateOption) {
        handleAddTag(trimmedInput);
      } else if (trimmedInput && !isInputExactMatchInSelected) {
        handleAddTag(trimmedInput);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="participant-tag-select"
      data-testid="participant-tag-select"
    >
      <div
        className={`participant-tag-select__control ${isOpen ? 'participant-tag-select__control--focused' : ''} ${disabled ? 'participant-tag-select__control--disabled' : ''}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <div className="participant-tag-select__pill-list">
          {selectedTags.map((tag, idx) => (
            <span key={`${tag}-${idx}`} className="participant-tag-select__pill" data-testid={`tag-pill-${tag}`}>
              <span className="participant-tag-select__pill-text">{tag}</span>
              {!disabled && (
                <button
                  type="button"
                  aria-label={`Remove tag ${tag}`}
                  className="participant-tag-select__pill-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTag(idx);
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}

          <div className="participant-tag-select__input-wrapper">
            <input
              ref={inputRef}
              id={id}
              type="text"
              className="participant-tag-select__input"
              value={inputValue}
              disabled={disabled}
              placeholder={selectedTags.length === 0 ? placeholder : ''}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (!isOpen) setIsOpen(true);
                setFocusedIndex(-1);
              }}
              onFocus={() => {
                setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              role="combobox"
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              aria-controls={`${id}-menu`}
              aria-autocomplete="list"
              aria-activedescendant={focusedIndex >= 0 ? `${id}-opt-${focusedIndex}` : undefined}
            />
          </div>
        </div>

        <div className="participant-tag-select__actions">
          {isLoading && <Loader2 size={14} className="animate-spin" data-testid="tags-loading-spinner" />}
          {selectedTags.length > 0 && !disabled && (
            <button
              type="button"
              className="participant-tag-select__clear-btn"
              onClick={handleClearAll}
              title="Clear all tags"
              aria-label="Clear all tags"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={14} style={{ opacity: 0.6 }} />
        </div>
      </div>

      {isOpen && (
        <div
          id={`${id}-menu`}
          className="participant-tag-select__menu"
          role="listbox"
          aria-label="Tag suggestions"
        >
          {error && (
            <div className="participant-tag-select__message participant-tag-select__message--error" role="alert">
              {error}
            </div>
          )}

          {!isLoading && !error && availableSuggestions.length === 0 && !showCreateOption && (
            <div className="participant-tag-select__message">
              {selectedTags.length > 0 && !trimmedInput ? 'All tags selected' : 'No matching tags found'}
            </div>
          )}

          {availableSuggestions.map((tag, idx) => {
            const isFocused = focusedIndex === idx;
            return (
              <div
                key={tag}
                id={`${id}-opt-${idx}`}
                role="option"
                aria-selected={isFocused}
                className={`participant-tag-select__option ${isFocused ? 'participant-tag-select__option--focused' : ''}`}
                onMouseEnter={() => setFocusedIndex(idx)}
                onClick={() => handleAddTag(tag)}
                data-testid={`tag-option-${tag}`}
              >
                <span>{tag}</span>
              </div>
            );
          })}

          {showCreateOption && (
            <div
              id={`${id}-opt-${availableSuggestions.length}`}
              role="option"
              aria-selected={focusedIndex === availableSuggestions.length}
              className={`participant-tag-select__create-option ${focusedIndex === availableSuggestions.length ? 'participant-tag-select__create-option--focused' : ''}`}
              onMouseEnter={() => setFocusedIndex(availableSuggestions.length)}
              onClick={() => handleAddTag(trimmedInput)}
              data-testid={`tag-create-${trimmedInput}`}
            >
              <Plus size={14} />
              <span>Create &ldquo;{trimmedInput}&rdquo;</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParticipantTagSelect;
