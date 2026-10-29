// frontend/microfrontends/participant/src/components/FilterCard.tsx - Dynamic Data-Type-Aware Rule Card
import React from 'react';
import { X, ChevronDown } from 'lucide-react';
import {
  REGISTRY_FILTER_FIELDS,
  getAllFilterFields,
  getFieldDefinition,
  getOperatorsForField,
  isRangeOperator,
  isNoValueOperator,
} from '../constants/filterMetadata';
import { CustomFilterRule, FilterOptionItem } from '../types/participant';
import { SearchableMultiSelect } from './SearchableMultiSelect';

interface FilterCardProps {
  filter: CustomFilterRule;
  index: number;
  onUpdate: (index: number, updatedFilter: CustomFilterRule) => void;
  onRemove: (index: number) => void;
  studyOptions?: FilterOptionItem[];
}

export const FilterCard: React.FC<FilterCardProps> = ({ filter, index, onUpdate, onRemove, studyOptions }) => {
  const currentField = filter.field || 'age';
  const currentFieldDef = getFieldDefinition(currentField);
  const availableOperators = getOperatorsForField(currentField);
  const currentOperator = filter.operator || availableOperators[0] || 'equal to';

  const isRange = isRangeOperator(currentOperator);
  const isNoVal = isNoValueOperator(currentOperator);

  const handleFieldChange = (newFieldId: string) => {
    const newDef = getFieldDefinition(newFieldId);
    const newOps = getOperatorsForField(newFieldId);
    const defaultOp = newOps[0] || 'equal to';

    onUpdate(index, {
      ...filter,
      field: newFieldId,
      operator: defaultOp,
      value: '',
      minValue: '',
      maxValue: '',
      values: [],
      placeholder: newDef.placeholder,
    });
  };

  const handleOperatorChange = (newOp: string) => {
    const wasRange = isRangeOperator(filter.operator);
    const willBeRange = isRangeOperator(newOp);

    onUpdate(index, {
      ...filter,
      operator: newOp,
      // If transitioning between range and single value, clean values safely
      ...(wasRange && !willBeRange ? { minValue: '', maxValue: '' } : {}),
      ...(!wasRange && willBeRange ? { value: '' } : {}),
    });
  };

  const handleValueChange = (newVal: string) => {
    onUpdate(index, {
      ...filter,
      value: newVal,
      values: newVal ? [newVal] : [],
    });
  };

  const handleMinChange = (newMin: string) => {
    onUpdate(index, {
      ...filter,
      minValue: newMin,
      value: `${newMin} - ${filter.maxValue || ''}`,
    });
  };

  const handleMaxChange = (newMax: string) => {
    onUpdate(index, {
      ...filter,
      maxValue: newMax,
      value: `${filter.minValue || ''} - ${newMax}`,
    });
  };

  const renderValueControl = () => {
    if (isNoVal) {
      return (
        <div className="filter-card-no-value-notice text-xs text-gray-500 italic py-1 px-2 bg-gray-50 rounded border border-gray-200">
          No value input needed for &quot;{currentOperator}&quot;
        </div>
      );
    }

    if (isRange) {
      const isDate = currentFieldDef.type === 'date';
      return (
        <div className="grid grid-cols-2 gap-2 filter-card-range-inputs">
          <input
            type={isDate ? 'date' : 'number'}
            value={filter.minValue || ''}
            onChange={(e) => handleMinChange(e.target.value)}
            placeholder={isDate ? 'Start Date' : 'Min'}
            aria-label={`Filter rule ${index + 1} minimum value`}
            className="filter-card-value-input text-xs"
          />
          <input
            type={isDate ? 'date' : 'number'}
            value={filter.maxValue || ''}
            onChange={(e) => handleMaxChange(e.target.value)}
            placeholder={isDate ? 'End Date' : 'Max'}
            aria-label={`Filter rule ${index + 1} maximum value`}
            className="filter-card-value-input text-xs"
          />
        </div>
      );
    }

    if (currentFieldDef.type === 'date') {
      return (
        <input
          type="date"
          value={filter.value || ''}
          onChange={(e) => handleValueChange(e.target.value)}
          aria-label={`Filter rule ${index + 1} date value`}
          className="filter-card-value-input text-xs"
        />
      );
    }

    const effectiveOptions =
      currentField.toLowerCase() === 'studies' && studyOptions && studyOptions.length > 0
        ? studyOptions
        : currentFieldDef.options;

    if (currentFieldDef.type === 'multiselect' && effectiveOptions && effectiveOptions.length > 0) {
      const selected = filter.values || (filter.value ? filter.value.split(',').map((s) => s.trim()) : []);
      return (
        <SearchableMultiSelect
          options={effectiveOptions}
          selectedValues={selected}
          onChange={(values) => onUpdate(index, { ...filter, values, value: values.join(',') })}
          placeholder={currentFieldDef.placeholder || 'Select options...'}
          ariaLabel={`Filter rule ${index + 1} values`}
        />
      );
    }
    if (currentFieldDef.type === 'number') {
      return (
        <input
          type="text"
          value={filter.value || ''}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={currentFieldDef.placeholder || 'Enter age or number...'}
          aria-label={`Filter rule ${index + 1} numeric value`}
          className="filter-card-value-input text-xs"
        />
      );
    }

    return (
      <input
        type="text"
        value={filter.value || ''}
        onChange={(e) => handleValueChange(e.target.value)}
        placeholder={currentFieldDef.placeholder || 'Enter value...'}
        aria-label={`Filter rule ${index + 1} text value`}
        className="filter-card-value-input text-xs"
      />
    );
  };

  return (
    <div className="card card-body custom-filter-card">
      <div className="filter-card-header">
        <span className="filter-card-label">Filter</span>
        <button
          type="button"
          onClick={() => onRemove(index)}
          title="Remove Filter"
          aria-label={`Remove filter rule ${index + 1}`}
          className="filter-card-remove"
        >
          <X size={14} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>

      <div className="filter-card-fields">
        {/* Field Dropdown */}
        <div className="filter-card-field-wrap">
          <select
            value={currentField}
            onChange={(e) => handleFieldChange(e.target.value)}
            aria-label={`Filter rule ${index + 1} field`}
            className="filter-select filter-select--field"
          >
            {getAllFilterFields().map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} color="#6b7280" className="filter-card-chevron" aria-hidden="true" />
        </div>

        {/* Operator Dropdown */}
        <div className="filter-card-field-wrap">
          <select
            value={currentOperator}
            onChange={(e) => handleOperatorChange(e.target.value)}
            aria-label={`Filter rule ${index + 1} operator`}
            className="filter-select filter-select--operator"
          >
            {availableOperators.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            color="#6b7280"
            className="filter-card-chevron"
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="filter-card-value mt-2">
        {renderValueControl()}
      </div>
    </div>
  );
};

export default FilterCard;
