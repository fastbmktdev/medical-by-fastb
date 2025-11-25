/**
 * Validation Constants
 * Centralized validation patterns and rules used across the application
 */

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_THAI: /^(0[689]\d{8}|0[2-7]\d{7,8})$/,
  PHONE_INTERNATIONAL: /^\+?[1-9]\d{1,14}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  USERNAME: /^[a-zA-Z0-9_]+$/,
  USERNAME_WITH_DASH: /^[a-zA-Z0-9_-]+$/,
} as const;

// Validation rules (min/max lengths)
export const VALIDATION_RULES = {
  NAME: { min: 2, max: 100 },
  USERNAME: { min: 3, max: 30 },
  EMAIL: { min: 5, max: 100 },
  PHONE: { min: 9, max: 15 },
  PASSWORD: { min: 6, max: 128 },
  MESSAGE: { min: 10, max: 5000 },
  SUBJECT: { min: 3, max: 200 },
  ADDRESS: { min: 10, max: 500 },
  DESCRIPTION: { min: 10, max: 1000 },
  TITLE: { min: 3, max: 100 },
  BIO: { min: 0, max: 500 },
  PRICE: { min: 0, max: 999999 },
} as const;
