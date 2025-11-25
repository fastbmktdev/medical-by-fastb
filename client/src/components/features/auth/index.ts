/**
 * Auth Feature Components
 * 
 * Authentication and authorization components for the application.
 * These components handle user authentication, role-based access control,
 * and authentication-related UI patterns.
 */

// Authentication Components
export { RoleGuard } from './RoleGuard';

// Form Components
export { AuthFormField } from './AuthFormField';
export { AuthFormError } from './AuthFormError';
export { AuthFormInfo } from './AuthFormInfo';

// Type Exports
export type { RoleGuardProps } from './RoleGuard';
export type { AuthFormFieldProps } from './AuthFormField';
export type { AuthFormErrorProps } from './AuthFormError';
export type { AuthFormInfoProps } from './AuthFormInfo';

// Re-export auth types for convenience
export type { UserRole } from '@shared/lib/auth';
