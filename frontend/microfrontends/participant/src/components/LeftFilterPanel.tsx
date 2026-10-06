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
      <div className="flex flex-col gap-1.5" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          className="text-xs font-medium text-gray-700 leading-tight filter-group-label"
          style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}
        >
          Participant can be contacted for future studies?
        </label>
        <div
          className="grid grid-cols-3 rounded border border-gray-300 text-xs overflow-hidden segmented-control-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            borderRadius: '4px',
            border: '1px solid #d1d5db',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            onClick={() => setContactFilter('all')}
            className={`segmented-btn ${contactFilter === 'all' ? 'active' : ''}`}
            style={{
              padding: '6px 4px',
              textAlign: 'center',
              fontWeight: contactFilter === 'all' ? 600 : 500,
              fontSize: '11px',
              backgroundColor: contactFilter === 'all' ? '#ffffff' : '#f9fafb',
              color: contactFilter === 'all' ? '#1976d2' : '#374151',
              border: 'none',
              borderRight: '1px solid #d1d5db',
              cursor: 'pointer',
              boxShadow: contactFilter === 'all' ? 'inset 0 0 0 2px #1976d2' : 'none',
            }}
          >
            Show Everyone
          </button>
          <button
            type="button"
            onClick={() => setContactFilter('yes')}
            className={`segmented-btn ${contactFilter === 'yes' ? 'active' : ''}`}
            style={{
              padding: '6px 4px',
              textAlign: 'center',
              fontWeight: contactFilter === 'yes' ? 600 : 500,
              fontSize: '11px',
              backgroundColor: contactFilter === 'yes' ? '#ffffff' : '#f9fafb',
              color: contactFilter === 'yes' ? '#1976d2' : '#374151',
              border: 'none',
              borderRight: '1px solid #d1d5db',
              cursor: 'pointer',
              boxShadow: contactFilter === 'yes' ? 'inset 0 0 0 2px #1976d2' : 'none',
            }}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setContactFilter('no')}
            className={`segmented-btn ${contactFilter === 'no' ? 'active' : ''}`}
            style={{
              padding: '6px 4px',
              textAlign: 'center',
              fontWeight: contactFilter === 'no' ? 600 : 500,
              fontSize: '11px',
              backgroundColor: contactFilter === 'no' ? '#ffffff' : '#f9fafb',
              color: contactFilter === 'no' ? '#1976d2' : '#374151',
              border: 'none',
              cursor: 'pointer',
              boxShadow: contactFilter === 'no' ? 'inset 0 0 0 2px #1976d2' : 'none',
            }}
          >
            No
          </button>
        </div>
      </div>

      {/* Filter 2: Participant available to add to study? */}
      <div className="flex flex-col gap-1.5" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          className="text-xs font-medium text-gray-700 leading-tight filter-group-label"
          style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}
        >
          Participant available to add to study?
        </label>
        <div
          className="grid grid-cols-3 rounded border border-gray-300 text-xs overflow-hidden segmented-control-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            borderRadius: '4px',
            border: '1px solid #d1d5db',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            onClick={() => setAvailableFilter('all')}
            className={`segmented-btn ${availableFilter === 'all' ? 'active' : ''}`}
            style={{
              padding: '6px 4px',
              textAlign: 'center',
              fontWeight: availableFilter === 'all' ? 600 : 500,
              fontSize: '11px',
              backgroundColor: availableFilter === 'all' ? '#ffffff' : '#f9fafb',
              color: availableFilter === 'all' ? '#1976d2' : '#374151',
              border: 'none',
              borderRight: '1px solid #d1d5db',
              cursor: 'pointer',
              boxShadow: availableFilter === 'all' ? 'inset 0 0 0 2px #1976d2' : 'none',
            }}
          >
            Show Everyone
          </button>
          <button
            type="button"
            onClick={() => setAvailableFilter('yes')}
            className={`segmented-btn ${availableFilter === 'yes' ? 'active' : ''}`}
            style={{
              padding: '6px 4px',
              textAlign: 'center',
              fontWeight: availableFilter === 'yes' ? 600 : 500,
              fontSize: '11px',
              backgroundColor: availableFilter === 'yes' ? '#ffffff' : '#f9fafb',
              color: availableFilter === 'yes' ? '#1976d2' : '#374151',
              border: 'none',
              borderRight: '1px solid #d1d5db',
              cursor: 'pointer',
              boxShadow: availableFilter === 'yes' ? 'inset 0 0 0 2px #1976d2' : 'none',
            }}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setAvailableFilter('no')}
            className={`segmented-btn ${availableFilter === 'no' ? 'active' : ''}`}
            style={{
              padding: '6px 4px',
              textAlign: 'center',
              fontWeight: availableFilter === 'no' ? 600 : 500,
              fontSize: '11px',
              backgroundColor: availableFilter === 'no' ? '#ffffff' : '#f9fafb',
              color: availableFilter === 'no' ? '#1976d2' : '#374151',
              border: 'none',
              cursor: 'pointer',
              boxShadow: availableFilter === 'no' ? 'inset 0 0 0 2px #1976d2' : 'none',
            }}
          >
            No
          </button>
        </div>
      </div>

      {/* Dynamic Added Filter Cards List */}
      {customFilters.length > 0 && (
        <div className="flex flex-col gap-2.5 pt-1" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', paddingTop: '4px' }}
      >
        <button
          type="button"
          onClick={onAddFilter}
          className="btn-add-filter"
          style={{
            backgroundColor: '#1976d2',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          Add Filter
        </button>
        <button
          type="button"
          onClick={onClearFilters}
          className="btn-clear-filters"
          style={{
            backgroundColor: '#d9534f',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          Clear Filters
        </button>
        <button
          type="button"
          onClick={onSaveFilter}
          className="btn-save-filter"
          style={{
            backgroundColor: '#20b2aa',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          Save Filter
        </button>
      </div>

      {/* Search Button */}
      <button
        type="button"
        onClick={onSearch}
        className="btn-search-main"
        style={{
          width: '100%',
          backgroundColor: '#00274c',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 500,
          padding: '9px 12px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          textAlign: 'center',
          marginTop: '4px',
        }}
      >
        Search
      </button>

      {/* Saved Searches Section */}
      {savedSearches && savedSearches.length > 0 && (
        <div
          className="flex flex-col gap-2.5 mt-1 pt-3 border-t border-gray-200"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginTop: '4px',
            paddingTop: '12px',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <h3
            className="text-xl text-gray-800 font-normal tracking-tight saved-searches-header"
            style={{ fontSize: '20px', fontWeight: 400, color: '#1f2937', margin: '4px 0 8px 0' }}
          >
            Saved Searches
          </h3>
          <div
            className="border border-gray-300 rounded-xl bg-gray-50/50 overflow-hidden shadow-2xs saved-searches-container"
            style={{ border: '1px solid #d1d5db', borderRadius: '12px', overflow: 'hidden' }}
          >
            {savedSearches.map((search, i) => (
              <div
                key={search.id || i}
                className="flex items-center justify-between p-3.5 bg-white border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors saved-search-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  backgroundColor: '#ffffff',
                  borderBottom: i < savedSearches.length - 1 ? '1px solid #e5e7eb' : 'none',
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelectSavedSearch?.(search)}
                  className="text-base text-gray-800 hover:text-blue-600 font-normal truncate cursor-pointer text-left flex-1 pr-2"
                  style={{
                    fontSize: '16px',
                    color: '#1f2937',
                    fontWeight: 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                  }}
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
                  style={{
                    backgroundColor: '#e04f44',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Delete saved search"
                >
                  <Trash2 className="w-4 h-4 stroke-[2.5]" style={{ width: '16px', height: '16px' }} />
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
