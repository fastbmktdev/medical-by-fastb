import type { HospitalFormData } from './types';
import {
  validateTitle,
  validateName,
  validatePhone,
  validateEmail,
  validateUrl,
  validateAddress,
  validateForm as validateFormGeneric,
  type ValidationRule,
} from '../shared/adminValidation';

/**
 * hospital-specific validation functions using shared validation utilities
 */

/**
 * Validate a single hospital form field
 */
export function validateField(
  name: keyof HospitalFormData,
  value: string
): string | undefined {
  switch (name) {
    case 'hospital_name':
      return validateTitle(value, 'ชื่อโรงพยาบาล');

    case 'hospital_name_english':
      if (!value || !value.trim()) return undefined; // Optional field
      return validateTitle(value, 'ชื่อภาษาอังกฤษ');

    case 'contact_name':
      return validateName(value, 'ชื่อผู้ติดต่อ');

    case 'phone':
      return validatePhone(value);

    case 'email':
      return validateEmail(value);

    case 'website':
      return validateUrl(value);

    case 'location':
      return validateAddress(value);

    default:
      return undefined;
  }
}

/**
 * Validation rules for hospital form
 */
const hospital_VALIDATION_RULES: ValidationRule<HospitalFormData>[] = [
  { field: 'hospital_name', validator: (value) => validateField('hospital_name', typeof value === 'string' ? value : '') },
  { field: 'hospital_name_english', validator: (value) => validateField('hospital_name_english', typeof value === 'string' ? value : '') },
  { field: 'contact_name', validator: (value) => validateField('contact_name', typeof value === 'string' ? value : '') },
  { field: 'phone', validator: (value) => validateField('phone', typeof value === 'string' ? value : '') },
  { field: 'email', validator: (value) => validateField('email', typeof value === 'string' ? value : '') },
  { field: 'website', validator: (value) => validateField('website', typeof value === 'string' ? value : '') },
  { field: 'location', validator: (value) => validateField('location', typeof value === 'string' ? value : '') },
];

/**
 * Validate entire hospital form
 */
export function validateForm(data: HospitalFormData): Record<string, string> {
  return validateFormGeneric(
    data as unknown as Record<string, unknown>, 
    hospital_VALIDATION_RULES as unknown as Array<{ field: string; validator: (value: unknown) => string | undefined }>
  );
}
