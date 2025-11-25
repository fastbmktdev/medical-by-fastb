/**
 * Form Constants
 * Common form-related constants and options
 */

/**
 * Service options for hospital/medical facilities
 */
export const SERVICE_OPTIONS = [
  'General Consultation',
  'Specialist Consultation',
  'Emergency Care',
  'Surgery',
  'Physical Therapy',
  'Rehabilitation',
  'Health Check-up',
  'Vaccination',
] as const;

/**
 * Experience level options
 */
export const EXPERIENCE_LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Professional',
] as const;

/**
 * Availability options
 */
export const AVAILABILITY_OPTIONS = [
  'Morning',
  'Afternoon',
  'Evening',
  'Flexible',
] as const;

/**
 * Payment method options
 */
export const PAYMENT_METHODS = [
  'Credit Card',
  'Bank Transfer',
  'Cash',
  'E-Wallet',
] as const;

export type ServiceOption = typeof SERVICE_OPTIONS[number];
export type ExperienceLevel = typeof EXPERIENCE_LEVELS[number];
export type AvailabilityOption = typeof AVAILABILITY_OPTIONS[number];
export type PaymentMethod = typeof PAYMENT_METHODS[number];
