// frontend/microfrontends/participant/src/components/FilterCard.tsx - Dynamic Custom Rule Card
import React from 'react';
import { X, ChevronDown } from 'lucide-react';
import { filterFieldOptions, operatorOptions } from '../mockData';
import { CustomFilterRule } from '../types/participant';

interface FilterCardProps {
  filter: CustomFilterRule;
  index: number;
  onUpdate: (index: number, updatedFilter: CustomFilterRule) => void;
  onRemove: (index: number) => void;
}

export const FilterCard: React.FC<FilterCardProps> = ({ filter, index, onUpdate, onRemove }) => {
  const currentFieldConfig = filterFieldOptions.find((f) => f.id === filter.field) || filterFieldOptions[0];

  const handleFieldChange = (newFieldId: string) => {
    const newConfig = filterFieldOptions.find((f) => f.id === newFieldId) || filterFieldOptions[0];
    onUpdate(index, {
      ...filter,
      field: newFieldId,
      placeholder: newConfig.placeholder,
    });
  };

  const handleOperatorChange = (newOp: string) => {
    onUpdate(index, {
      ...filter,
      operator: newOp,
    });
  };

  const handleValueChange = (newVal: string) => {
    onUpdate(index, {
      ...filter,
      value: newVal,
    });
  };

  return (
    <div className="card card-body custom-filter-card">
      <div className="flex items-center justify-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="text-xs font-medium text-gray-700" style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}>Filter</span>
        <button
          type="button"
          onClick={() => onRemove(index)}
          title="Remove Filter"
          className="text-gray-400 hover:text-gray-700 p-0.5 rounded cursor-pointer transition-colors"
          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '2px' }}
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 filter-card-fields" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
        <div className="relative" style={{ position: 'relative' }}>
          <select
            value={filter.field || 'age'}
            onChange={(e) => handleFieldChange(e.target.value)}
            className="w-full appearance-none bg-white border border-blue-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 rounded px-2.5 py-1.5 pr-7 text-xs text-gray-800 focus:outline-none cursor-pointer shadow-xs filter-select"
            style={{
              width: '100%',
              backgroundColor: '#ffffff',
              border: '1px solid #60a5fa',
              borderRadius: '4px',
              padding: '6px 28px 6px 10px',
              fontSize: '12px',
              color: '#1f2937',
              outline: 'none',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            {filterFieldOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            color="#6b7280"
            style={{ position: 'absolute', right: '8px', top: '10px', pointerEvents: 'none' }}
          />
        </div>

        <div className="relative" style={{ position: 'relative' }}>
          <select
            value={filter.operator || 'equal to'}
            onChange={(e) => handleOperatorChange(e.target.value)}
            className="w-full appearance-none bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2.5 py-1.5 pr-7 text-xs text-gray-800 focus:outline-none cursor-pointer shadow-xs filter-select"
            style={{
              width: '100%',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              padding: '6px 28px 6px 10px',
              fontSize: '12px',
              color: '#1f2937',
              outline: 'none',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            {operatorOptions.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            color="#6b7280"
            style={{ position: 'absolute', right: '8px', top: '10px', pointerEvents: 'none' }}
          />
        </div>
      </div>

      <div className="filter-card-value">
        <input
          type="text"
          value={filter.value || ''}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={currentFieldConfig.placeholder || 'Enter value...'}
          className="w-full border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2.5 py-1.5 text-xs text-gray-800 bg-white placeholder-gray-400 outline-none shadow-xs filter-input"
          style={{
            width: '100%',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            padding: '6px 10px',
            fontSize: '12px',
            color: '#1f2937',
            backgroundColor: '#ffffff',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  );
};

export default FilterCard;
