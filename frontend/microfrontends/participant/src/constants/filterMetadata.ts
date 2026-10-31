// frontend/microfrontends/participant/src/constants/filterMetadata.ts - Authoritative Registry Filter Field Definitions
import { FilterFieldOption, FilterOptionItem, CustomFilterRule } from '../types/participant';

export const DEFAULT_STUDY_FILTER_OPTIONS: FilterOptionItem[] = [
  { value: 'NONE', label: 'Not in a study' },
];

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

const CUSTOM_NUMERIC_OPERATORS = [
  'equal to',
  'not equal to',
  'greater than',
  'less than',
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
    placeholder: 'Studies',
    options: DEFAULT_STUDY_FILTER_OPTIONS,
    type: 'multiselect',
  },
  {
    id: 'tags',
    label: 'Tags',
    placeholder: 'Select or enter tag...',
    type: 'multiselect',
    options: [],
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
    placeholder: 'Select city...',
    type: 'multiselect',
    options: [],
  },
  {
    id: 'state',
    label: 'State',
    placeholder: 'Select state...',
    type: 'multiselect',
    options: [],
  },
  {
    id: 'zipcode',
    label: 'Zipcode',
    placeholder: 'Select zipcode...',
    type: 'multiselect',
    options: [],
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

let dynamicCustomFields: FilterFieldOption[] = [];
let dynamicStudyFilterOptions: FilterOptionItem[] = [...DEFAULT_STUDY_FILTER_OPTIONS];

const optionsFromValues = (values: string[] | undefined): FilterOptionItem[] => {
  const options = new Map<string, FilterOptionItem>();
  (values || []).forEach((rawValue) => {
    const value = String(rawValue ?? '').trim();
    if (value && !options.has(value.toLocaleLowerCase())) {
      options.set(value.toLocaleLowerCase(), { value, label: value });
    }
  });
  return Array.from(options.values());
};

export function registerDemographicFilterOptions(options: {
  sex?: string[];
  gender?: string[];
  ethnicity?: string[];
  race?: string[];
}): void {
  const mappings: Array<[string, string[] | undefined]> = [
    ['gender', options.gender?.length ? options.gender : options.sex],
    ['ethnicity', options.ethnicity],
    ['race', options.race],
  ];
  const defaults: Record<string, FilterOptionItem[]> = {
    gender: GENDER_OPTIONS,
    ethnicity: ETHNICITY_OPTIONS,
    race: RACE_OPTIONS,
  };
  mappings.forEach(([fieldId, values]) => {
    const field = REGISTRY_FILTER_FIELDS.find((item) => item.id === fieldId);
    const dynamicOptions = optionsFromValues(values);
    if (field) field.options = dynamicOptions.length > 0 ? dynamicOptions : defaults[fieldId];
  });
}

export function registerRegistryFilterOptions(options: {
  tags?: string[];
  cities?: string[];
  states?: string[];
  zipcodes?: string[];
  statuses?: string[];
}): void {
  const mappings: Array<[string, string[] | undefined]> = [
    ['tags', options.tags],
    ['city', options.cities],
    ['state', options.states],
    ['zipcode', options.zipcodes],
    ['status', options.statuses],
  ];
  mappings.forEach(([fieldId, values]) => {
    const field = REGISTRY_FILTER_FIELDS.find((item) => item.id === fieldId);
    const dynamicOptions = optionsFromValues(values);
    if (field) {
      field.options = fieldId === 'status' && dynamicOptions.length === 0
        ? STATUS_OPTIONS
        : dynamicOptions;
    }
  });
}

export function registerStudyFilterOptions(options: FilterOptionItem[]): void {
  const seen = new Set<string>(['NONE']);
  const normalized: FilterOptionItem[] = [{ value: 'NONE', label: 'Not in a study' }];
  for (const opt of options || []) {
    const val = (opt?.value ?? '').trim();
    const label = (opt?.label ?? '').trim();
    if (!val || !label || val.toUpperCase() === 'NONE') continue;
    if (!seen.has(val)) {
      seen.add(val);
      normalized.push({ value: val, label });
    }
  }
  dynamicStudyFilterOptions = normalized;
  const studiesField = REGISTRY_FILTER_FIELDS.find((f) => f.id === 'studies');
  if (studiesField) {
    studiesField.options = dynamicStudyFilterOptions;
  }
}

export function getStudyFilterOptions(): FilterOptionItem[] {
  return dynamicStudyFilterOptions;
}

export function registerDynamicFilterFields(fields: FilterFieldOption[]): void {
  dynamicCustomFields = fields;
}

export function getDynamicFilterFields(): FilterFieldOption[] {
  return dynamicCustomFields;
}

export function getAllFilterFields(): FilterFieldOption[] {
  return [...REGISTRY_FILTER_FIELDS, ...dynamicCustomFields];
}

export function getFieldDefinition(fieldId: string): FilterFieldOption {
  const found = REGISTRY_FILTER_FIELDS.find((f) => f.id === fieldId || f.id.toLowerCase() === fieldId.toLowerCase());
  if (found) return found;
  const dynFound = dynamicCustomFields.find((f) => f.id === fieldId || f.id.toLowerCase() === fieldId.toLowerCase());
  if (dynFound) return dynFound;
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
  const isCustom = fieldId.startsWith('custom_') || dynamicCustomFields.some(f => f.id.toLowerCase() === fieldId.toLowerCase());

  switch (fieldDef.type) {
    case 'number':
      return isCustom
        ? [...CUSTOM_NUMERIC_OPERATORS, 'has any value', 'has no value']
        : ALL_NUMERIC_OPERATORS;
    case 'date':
    case 'datetime':
      return isCustom
        ? [...ALL_DATE_OPERATORS, 'has any value', 'has no value']
        : ALL_DATE_OPERATORS;
    case 'multiselect':
    case 'select':
      return isCustom
        ? [...CATEGORICAL_OPERATORS, 'has any value', 'has no value']
        : CATEGORICAL_OPERATORS;
    case 'textarea':
      return isCustom
        ? [...CATEGORICAL_OPERATORS, 'has any value', 'has no value']
        : TEXT_OPERATORS;
    case 'text':
    default:
      if (['firstName', 'lastName', 'phone'].includes(fieldDef.id)) {
        return ['equal to'];
      }
      if (isCustom) {
        return [...CATEGORICAL_OPERATORS, 'has any value', 'has no value'];
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
      const parseNumeric = def.id.toLowerCase() === 'age' ? parseAgeValueToYears : parseNumberValue;
      const minNum = parseNumeric(min);
      const maxNum = parseNumeric(max);
      if (isNaN(minNum) || isNaN(maxNum)) {
        return { isValid: false, error: def.id.toLowerCase() === 'age'
          ? 'Age ranges must use a valid age such as 1y6m or 18mo'
          : 'Range boundaries must be valid numbers' };
      }
      if (minNum > maxNum) {
        return { isValid: false, error: 'Minimum value cannot be greater than maximum value' };
      }
    } else if (def.type === 'date' || def.type === 'datetime') {
      if (min > max) {
        return { isValid: false, error: 'Start date cannot be after end date' };
      }
    }
    return { isValid: true };
  }
  const def = getFieldDefinition(rule.field);
  if (def.type === 'multiselect' || def.type === 'select') {
    const hasValues = (rule.values && rule.values.length > 0) || (rule.value && rule.value.trim().length > 0);
    if (!hasValues) {
      return { isValid: false, error: `At least one option must be selected for ${def.label}` };
    }
    return { isValid: true };
  }

  function parseNumberValue(value: string): number {
    return value.trim() ? Number(value) : Number.NaN;
  }

  function parseAgeValueToYears(value: string): number {
    const input = value.trim();
    if (!input) return Number.NaN;
    const numeric = Number(input);
    if (Number.isFinite(numeric)) return numeric;

    const match = input.match(/^(?:(\d+(?:\.\d+)?)\s*y(?:ears?)?)?\s*(?:(\d+(?:\.\d+)?)\s*m(?:onths?|o)?)?$/i);
    if (!match || (!match[1] && !match[2])) return Number.NaN;
    return Number(match[1] || 0) + Number(match[2] || 0) / 12;
  }
  if (!rule.value || rule.value.trim().length === 0) {
    return { isValid: false, error: `Value is required for ${def.label}` };
  }
  const value = rule.value.trim();
  if (def.type === 'number') {
    const parseNumeric = def.id.toLowerCase() === 'age' ? parseAgeValueToYears : parseNumberValue;
    if (Number.isNaN(parseNumeric(value))) {
      return {
        isValid: false,
        error: def.id.toLowerCase() === 'age'
          ? 'Enter a valid age such as 1y6m or 18mo'
          : 'Enter a valid number',
      };
    }
  }
  const normalizedFieldId = rule.field.toLowerCase();
  const isCustom = rule.field.startsWith('custom_')
    || dynamicCustomFields.some((field) => field.id.toLowerCase() === normalizedFieldId);
  if (['firstname', 'lastname'].includes(normalizedFieldId) && value.length < 2) {
    return { isValid: false, error: `Enter at least 2 characters for ${def.label}` };
  }
  if (normalizedFieldId === 'phone' && value.replace(/\D/g, '').length < 2) {
    return { isValid: false, error: 'Enter at least 2 digits for Phone Number' };
  }
  if (isCustom && (def.type === 'text' || def.type === 'textarea') && value.length < 2) {
    return { isValid: false, error: 'Enter at least 2 characters for this custom field' };
  }
  return { isValid: true };
}
