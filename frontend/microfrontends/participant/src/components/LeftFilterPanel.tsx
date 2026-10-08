// frontend/microfrontends/participant/src/components/LeftFilterPanel.tsx - Left Filter Panel with Custom Criteria Builder
import React from 'react';
import { Trash2 } from 'lucide-react';
import FilterCard from './FilterCard';
import { CustomFilterRule, SavedSearch } from '../types/participant';

interface LeftFilterPanelProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  contactFilter: 'all' | 'yes' | 'no';
  setContactFilter: (val: 'all' | 'yes' | 'no') => void;
  availableFilter: 'all' | 'yes' | 'no';
  setAvailableFilter: (val: 'all' | 'yes' | 'no') => void;
  customFilters?: CustomFilterRule[];
  onAddFilter: () => void;
  onUpdateFilter: (index: number, updatedFilter: CustomFilterRule) => void;
  onRemoveFilter: (index: number) => void;
  onAddParticipant?: () => void;
  onClearFilters: () => void;
  onSaveFilter: () => void;
  onSearch: () => void;
  savedSearches?: SavedSearch[];
  onSelectSavedSearch?: (search: SavedSearch) => void;
  onDeleteRequest?: (search: SavedSearch) => void;
}

export const LeftFilterPanel: React.FC<LeftFilterPanelProps> = ({
  contactFilter,
  setContactFilter,
  availableFilter,
  setAvailableFilter,
  customFilters = [],
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
  onClearFilters,
  onSaveFilter,
  onSearch,
  savedSearches = [],
  onSelectSavedSearch,
  onDeleteRequest,
}) => {
  return (
    <aside
      className="card card-body participant-filter-panel"
    >
      {/* Filter 1: Participant can be contacted for future studies? */}
      <div className="flex flex-col gap-1.5">
        <label
          className="text-xs font-medium text-gray-700 leading-tight filter-group-label"
        >
          Participant can be contacted for future studies?
        </label>
        <div
          className="grid grid-cols-3 rounded border border-gray-300 text-xs overflow-hidden segmented-control-grid"
        >
          <button
            type="button"
            onClick={() => setContactFilter('all')}
            className={`segmented-btn ${contactFilter === 'all' ? 'active' : ''}`}
          >
            Show Everyone
          </button>
          <button
            type="button"
            onClick={() => setContactFilter('yes')}
            className={`segmented-btn ${contactFilter === 'yes' ? 'active' : ''}`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setContactFilter('no')}
            className={`segmented-btn ${contactFilter === 'no' ? 'active' : ''}`}
          >
            No
          </button>
        </div>
      </div>

      {/* Filter 2: Participant available to add to study? */}
      <div className="flex flex-col gap-1.5">
        <label
          className="text-xs font-medium text-gray-700 leading-tight filter-group-label"
        >
          Participant available to add to study?
        </label>
        <div
          className="grid grid-cols-3 rounded border border-gray-300 text-xs overflow-hidden segmented-control-grid"
        >
          <button
            type="button"
            onClick={() => setAvailableFilter('all')}
            className={`segmented-btn ${availableFilter === 'all' ? 'active' : ''}`}
          >
            Show Everyone
          </button>
          <button
            type="button"
            onClick={() => setAvailableFilter('yes')}
            className={`segmented-btn ${availableFilter === 'yes' ? 'active' : ''}`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setAvailableFilter('no')}
            className={`segmented-btn ${availableFilter === 'no' ? 'active' : ''}`}
          >
            No
          </button>
        </div>
      </div>

      {/* Dynamic Added Filter Cards List */}
      {customFilters.length > 0 && (
        <div className="flex flex-col gap-2.5 pt-1">
          {customFilters.map((f, index) => (
            <FilterCard
              key={f.id}
              filter={f}
              index={index}
              onUpdate={onUpdateFilter}
              onRemove={onRemoveFilter}
            />
          ))}
        </div>
      )}

      {/* Filter Action Buttons Row */}
      <div
        className="grid grid-cols-3 gap-2 pt-1 filter-actions-row"
      >
        <button
          type="button"
          onClick={onAddFilter}
          className="btn-add-filter"
        >
          Add Filter
        </button>
        <button
          type="button"
          onClick={onClearFilters}
          className="btn-clear-filters"
        >
          Clear Filters
        </button>
        <button
          type="button"
          onClick={onSaveFilter}
          className="btn-save-filter"
        >
          Save Filter
        </button>
      </div>

      {/* Search Button */}
      <button
        type="button"
        onClick={onSearch}
        className="btn-search-main"
      >
        Search
      </button>

      {/* Saved Searches Section */}
      {savedSearches && savedSearches.length > 0 && (
        <div className="participant-saved-searches">
          <h3
            className="text-xl text-gray-800 font-normal tracking-tight saved-searches-header"
          >
            Saved Searches
          </h3>
          <div
            className="border border-gray-300 rounded-xl bg-gray-50/50 overflow-hidden shadow-2xs saved-searches-container"
          >
            {savedSearches.map((search, i) => (
              <div
                key={search.id || i}
                className="flex items-center justify-between p-3.5 bg-white border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors saved-search-item"
              >
                <button
                  type="button"
                  onClick={() => onSelectSavedSearch?.(search)}
                  className="saved-search-apply"
                  title={`Click to apply search "${search.name}"`}
                >
                  {search.name}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRequest?.(search);
                  }}
                  className="btn-delete-saved"
                  title="Delete saved search"
                >
                  <Trash2 className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default LeftFilterPanel;
