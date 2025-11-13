/**
 * Shared validation utilities for admin forms
 * Provides common validation patterns and functions
 */

// Common regex patterns
export const VALIDATION_PATTERNS = {
  PHONE: /^0\d{1,2}-?\d{3,4}-?\d{4}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  THAI_PHONE: /^(0[689]\d{8}|0[2-7]\d{7,8})$/,
} as const;

// Common validation rules
export const VALIDATION_RULES = {
  NAME: { min: 2, max: 100 },
  TITLE: { min: 3, max: 100 },
  DESCRIPTION: { min: 10, max: 1000 },
  ADDRESS: { min: 10, max: 500 },
  PHONE: { min: 9, max: 12 },
  EMAIL: { min: 5, max: 100 },
} as const;

// Common error messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'กรุณากรอกข้อมูลนี้',
  MIN_LENGTH: (field: string, min: number) => `${field}ต้องมีความยาวอย่างน้อย ${min} ตัวอักษร`,
  MAX_LENGTH: (field: string, max: number) => `${field}ต้องมีความยาวไม่เกิน ${max} ตัวอักษร`,
  INVALID_FORMAT: (field: string) => `รูปแบบ${field}ไม่ถูกต้อง`,
  INVALID_PHONE: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ตัวอย่าง: 02-123-4567 หรือ 0812345678)',
  INVALID_EMAIL: 'รูปแบบอีเมลไม่ถูกต้อง',
  INVALID_URL: 'รูปแบบ URL ไม่ถูกต้อง',
} as const;

/**
 * Validate required field
 */
export function validateRequired(value: string | null | undefined, _fieldName: string): string | undefined {
  if (!value || value.trim().length === 0) {
    return VALIDATION_MESSAGES.REQUIRED;
  }
  return undefined;
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  fieldName: string,
  min?: number,
  max?: number
): string | undefined {
  const trimmedValue = value.trim();

  if (min && trimmedValue.length < min) {
    return VALIDATION_MESSAGES.MIN_LENGTH(fieldName, min);
  }

  if (max && trimmedValue.length > max) {
    return VALIDATION_MESSAGES.MAX_LENGTH(fieldName, max);
  }

  return undefined;
}

/**
 * Validate email format
 */
export function validateEmail(value: string): string | undefined {
  if (!value) return VALIDATION_MESSAGES.REQUIRED;

  if (!VALIDATION_PATTERNS.EMAIL.test(value)) {
    return VALIDATION_MESSAGES.INVALID_EMAIL;
  }

  return undefined;
}

/**
 * Validate phone number format
 */
export function validatePhone(value: string): string | undefined {
  if (!value) return VALIDATION_MESSAGES.REQUIRED;

  const cleanPhone = value.replace(/\s/g, '');
  if (!VALIDATION_PATTERNS.PHONE.test(cleanPhone)) {
    return VALIDATION_MESSAGES.INVALID_PHONE;
  }

  return undefined;
}

/**
 * Validate URL format (optional field)
 */
export function validateUrl(value: string): string | undefined {
  if (!value) return undefined; // URL is optional

  try {
    new URL(value);
    return undefined;
  } catch {
    return VALIDATION_MESSAGES.INVALID_URL;
  }
}

/**
 * Validate name field (required with length constraints)
 */
export function validateName(value: string, fieldName: string): string | undefined {
  const requiredError = validateRequired(value, fieldName);
  if (requiredError) return requiredError;

  return validateLength(value, fieldName, VALIDATION_RULES.NAME.min, VALIDATION_RULES.NAME.max);
}

/**
 * Validate title field (required with length constraints)
 */
export function validateTitle(value: string, fieldName: string): string | undefined {
  const requiredError = validateRequired(value, fieldName);
  if (requiredError) return requiredError;

  return validateLength(value, fieldName, VALIDATION_RULES.TITLE.min, VALIDATION_RULES.TITLE.max);
}

/**
 * Validate address field (required with length constraints)
 */
export function validateAddress(value: string): string | undefined {
  const requiredError = validateRequired(value, 'ที่อยู่');
  if (requiredError) return requiredError;

  return validateLength(value, 'ที่อยู่', VALIDATION_RULES.ADDRESS.min, VALIDATION_RULES.ADDRESS.max);
}

/**
 * Generic form validator that takes validation rules
 */
export interface ValidationRule<T> {
  field: keyof T;
  validator: (value: unknown) => string | undefined;
}

export function validateForm<T extends Record<string, unknown>>(
  data: T,
  rules: ValidationRule<T>[]
): Record<keyof T, string> {
  const errors: Partial<Record<keyof T, string>> = {};

  rules.forEach(({ field, validator }) => {
    const error = validator(data[field]);
    if (error) {
      errors[field] = error;
    }
  });

  return errors as Record<keyof T, string>;
}

/**
 * Check if form has any validation errors
 */
export function hasValidationErrors<T>(errors: Record<keyof T, string>): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Clean form data by trimming strings and removing empty values
 */
export function cleanFormData<T extends Record<string, unknown>>(data: T): T {
  const cleaned = { ...data } as Record<string, unknown>;

  Object.keys(cleaned).forEach((key) => {
    const value = cleaned[key];
    if (typeof value === 'string') {
      cleaned[key] = value.trim() || undefined;
    }
  });

  return cleaned as T;
}