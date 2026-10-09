/** Shared validation primitives for forms across all microfrontends. */
export type FieldValidator = (value: unknown) => string | undefined;
export type ValidationSchema<T extends Record<string, unknown>> = Partial<
  Record<keyof T, FieldValidator | FieldValidator[]>
>;
export type ValidationErrors<T extends Record<string, unknown>> = Partial<Record<keyof T, string>>;
export interface PasswordValidationOptions {
  minLength?: number;
  maxLength?: number;
}

const toText = (value: unknown): string => (value == null ? '' : String(value));

export const validators = {
  required: (label = 'This field'): FieldValidator => (value) =>
    toText(value).trim() ? undefined : `${label} is required`,

  /** Accepts printable text, including punctuation and non-English characters. */
  text: (label = 'This field'): FieldValidator => (value) => {
    const text = toText(value);
    if (!text.trim()) return undefined;
    return /[\u0000-\u001F\u007F]/u.test(text) ? `${label} contains invalid characters` : undefined;
  },

  /** Person names may include Unicode letters, spaces, apostrophes, periods, and hyphens. */
  personName: (label = 'Name'): FieldValidator => (value) => {
    const text = toText(value).trim();
    if (!text) return undefined;
    return /^[\p{L}\p{M}]+(?:[ .'\u2019-][\p{L}\p{M}]+)*\.?$/u.test(text)
      ? undefined
      : `${label} can contain letters, spaces, apostrophes, periods, and hyphens`;
  },

  email: (label = 'Email'): FieldValidator => (value) => {
    const text = toText(value).trim();
    if (!text) return undefined;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(text) ? undefined : `Enter a valid ${label.toLowerCase()}`;
  },

  phone: (label = 'Phone number'): FieldValidator => (value) => {
    const text = toText(value).trim();
    if (!text) return undefined;
    if (!/^\+?[\d\s().-]+$/u.test(text)) return `${label} contains invalid characters`;
    const digitCount = text.replace(/\D/gu, '').length;
    return digitCount >= 7 && digitCount <= 15
      ? undefined
      : `${label} must contain 7 to 15 digits`;
  },

  /**
   * Password strength is based on length and printable characters rather than
   * character-class rules. Defaults suit single-factor password creation;
   * pass { minLength: 8 } when the product's MFA policy permits it.
   */
  password: (label = 'Password', options: PasswordValidationOptions = {}): FieldValidator => (value) => {
    const text = toText(value);
    if (!text) return undefined;
    const length = Array.from(text).length;
    const minLength = options.minLength ?? 15;
    const maxLength = options.maxLength ?? 128;
    if (/[\u0000-\u001F\u007F]/u.test(text)) return `${label} contains unsupported control characters`;
    if (length < minLength) return `${label} must be at least ${minLength} characters`;
    if (length > maxLength) return `${label} must be ${maxLength} characters or fewer`;
    return undefined;
  },

  passwordConfirmation: (password: string): FieldValidator => (value) =>
    toText(value) === password ? undefined : 'Passwords do not match',

  minLength: (min: number, label = 'This field'): FieldValidator => (value) => {
    const text = toText(value).trim();
    return text && text.length < min ? `${label} must be at least ${min} characters` : undefined;
  },

  maxLength: (max: number, label = 'This field'): FieldValidator => (value) =>
    toText(value).length > max ? `${label} must be ${max} characters or fewer` : undefined,
};

/** Returns the first message for a field, preserving the rule order. */
export function validateField(value: unknown, rules: FieldValidator | FieldValidator[]): string {
  const ruleList = Array.isArray(rules) ? rules : [rules];
  for (const rule of ruleList) {
    const error = rule(value);
    if (error) return error;
  }
  return '';
}

/** Validates a values object with a reusable field-to-rules schema. */
export function validateForm<T extends Record<string, unknown>>(
  values: T,
  schema: ValidationSchema<T>,
): ValidationErrors<T> {
  const errors: ValidationErrors<T> = {};
  (Object.keys(schema) as Array<keyof T>).forEach((field) => {
    const rules = schema[field];
    if (!rules) return;
    const error = validateField(values[field], rules);
    if (error) errors[field] = error;
  });
  return errors;
}
