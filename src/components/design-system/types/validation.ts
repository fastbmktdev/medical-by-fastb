/**
 * Component Prop Validation Utilities
 * 
 * Runtime validation utilities for component props in development environment.
 * Helps catch prop misuse and provides helpful error messages.
 */

/**
 * Validation Result Type
 * 
 * Result of a prop validation check.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validation Rule Type
 * 
 * Function that validates a specific aspect of props.
 */
export type ValidationRule<T = unknown> = (value: T, propName: string, componentName: string) => string | null;

/**
 * Validation Schema Type
 * 
 * Schema defining validation rules for component props.
 */
export type ValidationSchema<T = Record<string, unknown>> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

/**
 * Prop Validator Configuration
 */
interface PropValidatorConfig {
  /**
   * Whether to run validation (typically only in development)
   */
  enabled: boolean;
  
  /**
   * Whether to throw errors on validation failure
   */
  throwOnError: boolean;
  
  /**
   * Whether to log warnings to console
   */
  logWarnings: boolean;
}

// Default configuration
const defaultConfig: PropValidatorConfig = {
  enabled: process.env.NODE_ENV === 'development',
  throwOnError: false,
  logWarnings: true,
};

/**
 * Validate Component Props
 * 
 * Validates component props against a schema in development environment.
 * 
 * @param props - Props to validate
 * @param schema - Validation schema
 * @param componentName - Name of the component for error messages
 * @param config - Validation configuration
 * @returns Validation result
 * 
 * @example
 * ```tsx
 * const buttonSchema: ValidationSchema<ButtonProps> = {
 *   size: [required(), oneOf(['sm', 'md', 'lg'])],
 *   variant: [oneOf(['solid', 'outline', 'ghost'])],
 *   children: [required()],
 * };
 * 
 * function Button(props: ButtonProps) {
 *   const validation = validateComponentProps(props, buttonSchema, 'Button');
 *   
 *   if (!validation.isValid) {
 *     console.warn('Button validation failed:', validation.errors);
 *   }
 *   
 *   // ... component implementation
 * }
 * ```
 */
export const validateComponentProps = <T>(
  props: T,
  schema: ValidationSchema<T>,
  componentName: string,
  config: Partial<PropValidatorConfig> = {}
): ValidationResult => {
  const finalConfig = { ...defaultConfig, ...config };
  
  if (!finalConfig.enabled) {
    return { isValid: true, errors: [], warnings: [] };
  }
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate each prop according to schema
  Object.entries(schema).forEach(([propName, rules]) => {
    if (!rules || !Array.isArray(rules)) return;
    
    const propValue = (props as Record<string, unknown>)[propName];
    
    rules.forEach((rule) => {
      const result = rule(propValue, propName, componentName);
      if (result) {
        if (result.startsWith('Warning:')) {
          warnings.push(result);
        } else {
          errors.push(result);
        }
      }
    });
  });
  
  const isValid = errors.length === 0;
  
  // Handle errors and warnings
  if (!isValid && finalConfig.throwOnError) {
    throw new Error(`${componentName} validation failed:\n${errors.join('\n')}`);
  }
  
  if (warnings.length > 0 && finalConfig.logWarnings) {
    console.warn(`${componentName} validation warnings:\n${warnings.join('\n')}`);
  }
  
  if (!isValid) {
    console.error(`${componentName} validation errors:\n${errors.join('\n')}`);
  }
  
  return { isValid, errors, warnings };
};

/**
 * Common Validation Rules
 * 
 * Pre-built validation rules for common prop validation scenarios.
 */

/**
 * Required Prop Validation
 * 
 * Validates that a prop is provided and not null/undefined.
 */
export const required = <T>(): ValidationRule<T> => (
  value: T,
  propName: string,
  componentName: string
): string | null => {
  if (value === null || value === undefined) {
    return `${componentName}: prop '${propName}' is required but was not provided.`;
  }
  return null;
};

/**
 * One Of Validation
 * 
 * Validates that a prop value is one of the allowed values.
 */
export const oneOf = <T>(allowedValues: T[]): ValidationRule<T> => (
  value: T,
  propName: string,
  componentName: string
): string | null => {
  if (value !== undefined && !allowedValues.includes(value)) {
    return `${componentName}: prop '${propName}' must be one of [${allowedValues.join(', ')}], but received '${value}'.`;
  }
  return null;
};

/**
 * Type Validation
 * 
 * Validates that a prop is of the expected type.
 */
export const ofType = (expectedType: string): ValidationRule => (
  value: unknown,
  propName: string,
  componentName: string
): string | null => {
  if (value !== undefined && typeof value !== expectedType) {
    return `${componentName}: prop '${propName}' expected ${expectedType}, but received ${typeof value}.`;
  }
  return null;
};

/**
 * Array Of Validation
 * 
 * Validates that a prop is an array and optionally validates each item.
 */
export const arrayOf = <T>(itemValidator?: ValidationRule<T>): ValidationRule<T[]> => (
  value: T[],
  propName: string,
  componentName: string
): string | null => {
  if (value !== undefined) {
    if (!Array.isArray(value)) {
      return `${componentName}: prop '${propName}' expected array, but received ${typeof value}.`;
    }
    
    if (itemValidator) {
      for (let i = 0; i < value.length; i++) {
        const itemError = itemValidator(value[i], `${propName}[${i}]`, componentName);
        if (itemError) {
          return itemError;
        }
      }
    }
  }
  return null;
};

/**
 * Shape Validation
 * 
 * Validates that a prop is an object with the expected shape.
 */
export const shape = <T extends Record<string, unknown>>(
  shapeSchema: ValidationSchema<T>
): ValidationRule<T> => (
  value: T,
  propName: string,
  componentName: string
): string | null => {
  if (value !== undefined) {
    if (typeof value !== 'object' || value === null) {
      return `${componentName}: prop '${propName}' expected object, but received ${typeof value}.`;
    }
    
    const validation = validateComponentProps(value, shapeSchema, `${componentName}.${propName}`);
    if (!validation.isValid) {
      return validation.errors[0]; // Return first error
    }
  }
  return null;
};

/**
 * Min/Max Validation
 * 
 * Validates that a numeric prop is within the specified range.
 */
export const minMax = (min?: number, max?: number): ValidationRule<number> => (
  value: number,
  propName: string,
  componentName: string
): string | null => {
  if (value !== undefined) {
    if (typeof value !== 'number') {
      return `${componentName}: prop '${propName}' expected number, but received ${typeof value}.`;
    }
    
    if (min !== undefined && value < min) {
      return `${componentName}: prop '${propName}' must be >= ${min}, but received ${value}.`;
    }
    
    if (max !== undefined && value > max) {
      return `${componentName}: prop '${propName}' must be <= ${max}, but received ${value}.`;
    }
  }
  return null;
};

/**
 * String Length Validation
 * 
 * Validates that a string prop meets length requirements.
 */
export const stringLength = (minLength?: number, maxLength?: number): ValidationRule<string> => (
  value: string,
  propName: string,
  componentName: string
): string | null => {
  if (value !== undefined) {
    if (typeof value !== 'string') {
      return `${componentName}: prop '${propName}' expected string, but received ${typeof value}.`;
    }
    
    if (minLength !== undefined && value.length < minLength) {
      return `${componentName}: prop '${propName}' must be at least ${minLength} characters, but received ${value.length}.`;
    }
    
    if (maxLength !== undefined && value.length > maxLength) {
      return `${componentName}: prop '${propName}' must be at most ${maxLength} characters, but received ${value.length}.`;
    }
  }
  return null;
};

/**
 * Custom Validation
 * 
 * Creates a custom validation rule with a predicate function.
 */
export const custom = <T>(
  predicate: (value: T) => boolean,
  errorMessage: string
): ValidationRule<T> => (
  value: T,
  propName: string,
  componentName: string
): string | null => {
  if (value !== undefined && !predicate(value)) {
    return `${componentName}: prop '${propName}' ${errorMessage}`;
  }
  return null;
};

/**
 * Deprecated Prop Warning
 * 
 * Creates a warning for deprecated props.
 */
export const deprecated = (message?: string): ValidationRule => (
  value: unknown,
  propName: string,
  componentName: string
): string | null => {
  if (value !== undefined) {
    const defaultMessage = `prop '${propName}' is deprecated and will be removed in a future version.`;
    return `Warning: ${componentName}: ${message || defaultMessage}`;
  }
  return null;
};

/**
 * Conditional Validation
 * 
 * Validates a prop only when a condition is met.
 */
export const when = <T>(
  condition: (props: Record<string, unknown>) => boolean,
  rule: ValidationRule<T>
): ValidationRule<T> => (
  value: T,
  propName: string,
  componentName: string,
  allProps?: Record<string, unknown>
): string | null => {
  if (allProps && condition(allProps)) {
    return rule(value, propName, componentName);
  }
  return null;
};

// Export validation utilities
export const validators = {
  required,
  oneOf,
  ofType,
  arrayOf,
  shape,
  minMax,
  stringLength,
  custom,
  deprecated,
  when,
};