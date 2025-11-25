/**
 * Form Components
 * 
 * Standardized form input components with consistent styling,
 * validation, and accessibility features.
 */

// Base Form Components
export { BaseInput } from '@/components/design-system/primitives/BaseInput';

// Specific Input Components
export { CustomInput } from './CustomInput';
export { TextInput } from './TextInput';
export { NumberInput } from './NumberInput';
export { CustomSelect } from './CustomSelect';
export { CustomTextarea } from './CustomTextarea';

// Type Exports
export type { BaseInputProps } from '@/components/design-system/primitives/BaseInput';
export type { InputProps } from './CustomInput';
export type { SelectProps } from './CustomSelect';
export type { TextareaProps } from './CustomTextarea';

// Re-export design system types for convenience
export type {
  FormComponentProps,
  ValidationResult,
} from '@/components/design-system/types';