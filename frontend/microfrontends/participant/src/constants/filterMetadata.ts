// frontend/microfrontends/participant/src/constants/filterMetadata.ts - Authoritative Registry Filter Field Definitions
import { FilterFieldOption, FilterOptionItem, CustomFilterRule } from '../types/participant';

export const GENDER_OPTIONS: FilterOptionItem[] = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
  { value: 'Unspecified', label: 'Unspecified' },
];

export const ETHNICITY_OPTIONS: FilterOptionItem[] = [
  { value: 'Hispanic or Latino', label: 'Hispanic or Latino' },
  { value: 'Not Hispanic or Latino', label: 'Not Hispanic or Latino' },
  { value: 'Not Disclosed', label: 'Not Disclosed' },
  { value: 'Unknown', label: 'Unknown' },
];

export const RACE_OPTIONS: FilterOptionItem[] = [
  { value: 'American Indian or Alaska Native', label: 'American Indian or Alaska Native' },
  { value: 'Asian', label: 'Asian' },
  { value: 'Black or African American', label: 'Black or African American' },
  { value: 'Native Hawaiian or Other Pacific Islander', label: 'Native Hawaiian or Other Pacific Islander' },
  { value: 'White / Caucasian', label: 'White / Caucasian' },
  { value: 'More than one race', label: 'More than one race' },
  { value: 'Not Disclosed', label: 'Not Disclosed' },
];

export const BIRTH_MONTH_OPTIONS: FilterOptionItem[] = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export const STATUS_OPTIONS: FilterOptionItem[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SCREENING', label: 'Screening' },
  { value: 'ENROLLED', label: 'Enrolled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

export const ALL_NUMERIC_OPERATORS = [
  'equal to',
  'not equal to',
  'greater than',
  'less than',
  'between',
  'not between',
];

export const ALL_DATE_OPERATORS = [
  'equal to',
  'not equal to',
  'greater than',
  'less than',
  'between',
  'not between',
];

export const CATEGORICAL_OPERATORS = [
  'equal to',
  'not equal to',
];

export const TEXT_OPERATORS = [
  'equal to',
  'contains',
];

export const CUSTOM_VARIABLE_OPERATORS = [
  'equal to',
  'not equal to',
  'has any value',
  'has no value',
];

export const REGISTRY_FILTER_FIELDS: FilterFieldOption[] = [
  {
    id: 'age',
    label: 'Age',
    placeholder: 'e.g. 1y6m or 18mo or 1.5 or 34',
    type: 'number',
  },
  {
    id: 'gender',
    label: 'Sex/Gender',
    placeholder: 'Select gender...',
    type: 'multiselect',
    options: GENDER_OPTIONS,
  },
  {
    id: 'studies',
    label: 'Studies',
    placeholder: 'Select or enter study name...',
    type: 'multiselect',
  },
  {
    id: 'tags',
    label: 'Tags',
    placeholder: 'Select or enter tag...',
    type: 'multiselect',
  },
  {
    id: 'ethnicity',
    label: 'Ethnicity',
    placeholder: 'Select ethnicity...',
    type: 'multiselect',
    options: ETHNICITY_OPTIONS,
  },
  {
    id: 'race',
    label: 'Race',
    placeholder: 'Select race...',
    type: 'multiselect',
    options: RACE_OPTIONS,
  },
  {
    id: 'city',
    label: 'City',
    placeholder: 'e.g. Philadelphia, Chicago',
    type: 'text',
  },
  {
    id: 'state',
    label: 'State',
    placeholder: 'e.g. PA, IL, WA',
    type: 'text',
  },
  {
    id: 'zipcode',
    label: 'Zipcode',
    placeholder: 'e.g. 19104, 60603',
    type: 'text',
  },
  {
    id: 'phone',
    label: 'Phone Number',
    placeholder: 'e.g. (215) 555-0143 or 2155550143',
    type: 'text',
  },
  {
    id: 'status',
    label: 'Participant Status',
    placeholder: 'Select status...',
    type: 'multiselect',
    options: STATUS_OPTIONS,
  },
  {
    id: 'lastContact',
    label: 'Last Contact',
    placeholder: 'YYYY-MM-DD',
    type: 'date',
  },
  {
    id: 'dateCreated',
    label: 'Date Created',
    placeholder: 'YYYY-MM-DD',
    type: 'date',
  },
  {
    id: 'birthMonth',
    label: 'Birth Month',
    placeholder: 'Select month...',
    type: 'multiselect',
    options: BIRTH_MONTH_OPTIONS,
  },
  {
    id: 'firstName',
    label: 'First Name',
    placeholder: 'e.g. Drexel, Alice',
    type: 'text',
  },
  {
    id: 'lastName',
    label: 'Last Name',
    placeholder: 'e.g. Smith, Johnson',
    type: 'text',
  },
];

export function getFieldDefinition(fieldId: string): FilterFieldOption {
  const found = REGISTRY_FILTER_FIELDS.find((f) => f.id === fieldId || f.id.toLowerCase() === fieldId.toLowerCase());
  if (found) return found;
  if (fieldId.startsWith('custom_')) {
    return {
      id: fieldId,
      label: fieldId.replace(/^custom_/, 'Custom: '),
      placeholder: 'Enter custom value...',
      type: 'text',
    };
  }
  return REGISTRY_FILTER_FIELDS[0];
}

export function getOperatorsForField(fieldId: string): string[] {
  const fieldDef = getFieldDefinition(fieldId);
  if (fieldId.startsWith('custom_')) {
    return CUSTOM_VARIABLE_OPERATORS;
  }
  switch (fieldDef.type) {
    case 'number':
      return ALL_NUMERIC_OPERATORS;
    case 'date':
      return ALL_DATE_OPERATORS;
    case 'multiselect':
    case 'select':
      return CATEGORICAL_OPERATORS;
    case 'text':
    default:
      if (['firstName', 'lastName', 'phone'].includes(fieldDef.id)) {
        return ['equal to'];
      }
      return TEXT_OPERATORS;
  }
}

export function isRangeOperator(operator: string): boolean {
  const op = (operator || '').toLowerCase().trim();
  return op === 'between' || op === 'not between' || op === 'not_between';
}

export function isNoValueOperator(operator: string): boolean {
  const op = (operator || '').toLowerCase().trim();
  return op === 'has any value' || op === 'has no value' || op === 'assigned' || op === 'not_assigned';
}

export function validateFilterRule(rule: CustomFilterRule): { isValid: boolean; error?: string } {
  if (!rule.field) {
    return { isValid: false, error: 'Filter field is required' };
  }
  if (!rule.operator) {
    return { isValid: false, error: 'Filter operator is required' };
  }
  if (isNoValueOperator(rule.operator)) {
    return { isValid: true };
  }
  if (isRangeOperator(rule.operator)) {
    const min = (rule.minValue ?? '').trim();
    const max = (rule.maxValue ?? '').trim();
    if (!min || !max) {
      return { isValid: false, error: `Both minimum and maximum values are required for "${rule.operator}"` };
    }
    const def = getFieldDefinition(rule.field);
    if (def.type === 'number') {
      const minNum = parseFloat(min);
      const maxNum = parseFloat(max);
      if (isNaN(minNum) || isNaN(maxNum)) {
        return { isValid: false, error: 'Range boundaries must be valid numbers' };
      }
      if (minNum > maxNum) {
        return { isValid: false, error: 'Minimum value cannot be greater than maximum value' };
      }
    } else if (def.type === 'date') {
      if (min > max) {
        return { isValid: false, error: 'Start date cannot be after end date' };
      }
    }
    return { isValid: true };
  }
  const def = getFieldDefinition(rule.field);
  if (def.type === 'multiselect') {
    const hasValues = (rule.values && rule.values.length > 0) || (rule.value && rule.value.trim().length > 0);
    if (!hasValues) {
      return { isValid: false, error: `At least one option must be selected for ${def.label}` };
    }
    return { isValid: true };
  }
  if (!rule.value || rule.value.trim().length === 0) {
    return { isValid: false, error: `Value is required for ${def.label}` };
  }
  return { isValid: true };
}
