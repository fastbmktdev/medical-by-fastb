import type { GymFormData } from './types';

/**
 * Validation rules and functions for gym forms
 */

// Regex patterns
const PHONE_REGEX = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validation constraints
export const VALIDATION_RULES = {
  GYM_NAME: { min: 3, max: 100 },
  CONTACT_NAME: { min: 2, max: 100 },
  LOCATION: { min: 10 },
} as const;

/**
 * Validate a single form field
 */
export function validateField(
  name: keyof GymFormData,
  value: string
): string | undefined {
  switch (name) {
    case 'gym_name':
      if (!value || value.trim().length < VALIDATION_RULES.GYM_NAME.min) {
        return `ชื่อยิมต้องมีความยาวอย่างน้อย ${VALIDATION_RULES.GYM_NAME.min} ตัวอักษร`;
      }
      if (value.trim().length > VALIDATION_RULES.GYM_NAME.max) {
        return `ชื่อยิมต้องมีความยาวไม่เกิน ${VALIDATION_RULES.GYM_NAME.max} ตัวอักษร`;
      }
      break;

    case 'gym_name_english':
      if (value && value.trim()) {
        if (value.trim().length < VALIDATION_RULES.GYM_NAME.min) {
          return `ชื่อภาษาอังกฤษต้องมีความยาวอย่างน้อย ${VALIDATION_RULES.GYM_NAME.min} ตัวอักษร`;
        }
        if (value.trim().length > VALIDATION_RULES.GYM_NAME.max) {
          return `ชื่อภาษาอังกฤษต้องมีความยาวไม่เกิน ${VALIDATION_RULES.GYM_NAME.max} ตัวอักษร`;
        }
      }
      break;

    case 'contact_name':
      if (!value || value.trim().length < VALIDATION_RULES.CONTACT_NAME.min) {
        return `ชื่อผู้ติดต่อต้องมีความยาวอย่างน้อย ${VALIDATION_RULES.CONTACT_NAME.min} ตัวอักษร`;
      }
      if (value.trim().length > VALIDATION_RULES.CONTACT_NAME.max) {
        return `ชื่อผู้ติดต่อต้องมีความยาวไม่เกิน ${VALIDATION_RULES.CONTACT_NAME.max} ตัวอักษร`;
      }
      break;

    case 'phone':
      if (!value) {
        return 'กรุณากรอกเบอร์โทรศัพท์';
      }
      if (!PHONE_REGEX.test(value.replace(/\s/g, ''))) {
        return 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ตัวอย่าง: 02-123-4567 หรือ 0812345678)';
      }
      break;

    case 'email':
      if (!value) {
        return 'กรุณากรอกอีเมล';
      }
      if (!EMAIL_REGEX.test(value)) {
        return 'รูปแบบอีเมลไม่ถูกต้อง';
      }
      break;

    case 'website':
      if (value) {
        try {
          new URL(value);
        } catch {
          return 'รูปแบบ URL ไม่ถูกต้อง';
        }
      }
      break;

    case 'location':
      if (!value || value.trim().length < VALIDATION_RULES.LOCATION.min) {
        return `ที่อยู่ต้องมีความยาวอย่างน้อย ${VALIDATION_RULES.LOCATION.min} ตัวอักษร`;
      }
      break;
  }

  return undefined;
}

/**
 * Validate entire form
 */
export function validateForm(data: GymFormData): Record<string, string> {
  const errors: Record<string, string> = {};

  const fields: (keyof GymFormData)[] = [
    'gym_name',
    'contact_name',
    'phone',
    'email',
    'website',
    'location',
  ];

  fields.forEach((field) => {
    const error = validateField(field, data[field] as string);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
}
