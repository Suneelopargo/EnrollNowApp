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
      <div className="filter-card-header">
        <span className="filter-card-label">Filter</span>
        <button
          type="button"
          onClick={() => onRemove(index)}
          title="Remove Filter"
          className="filter-card-remove"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>

      <div className="filter-card-fields">
        <div className="filter-card-field-wrap">
          <select
            value={filter.field || 'age'}
            onChange={(e) => handleFieldChange(e.target.value)}
            className="filter-select filter-select--field"
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
            className="filter-card-chevron"
          />
        </div>

        <div className="filter-card-field-wrap">
          <select
            value={filter.operator || 'equal to'}
            onChange={(e) => handleOperatorChange(e.target.value)}
            className="filter-select filter-select--operator"
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
            className="filter-card-chevron"
          />
        </div>
      </div>

      <div className="filter-card-value">
        <input
          type="text"
          value={filter.value || ''}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={currentFieldConfig.placeholder || 'Enter value...'}
          className="filter-card-value-input"
        />
      </div>
    </div>
  );
};

export default FilterCard;
