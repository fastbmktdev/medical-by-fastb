      /**
 * Migration Utilities
 * 
 * Helper functions and utilities to assist with migrating from old component
 * patterns to the new design system. These utilities provide backward compatibility
 * and automated prop transformations.
 */

import React, { ComponentProps } from 'react';
import { ButtonProps } from '../primitives/Button';
import { BaseInputProps } from '../primitives/BaseInput';
import { CardProps } from '../primitives/Card';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Legacy component prop patterns that need migration
 */
export interface LegacyButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export interface LegacyInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  type?: string;
  className?: string;
}

export interface LegacyCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  shadow?: boolean;
  border?: boolean;
  onClick?: () => void;
}

/**
 * Migration result with warnings
 */
export interface MigrationResult<T> {
  props: T;
  warnings: string[];
  deprecated: string[];
}

// =============================================================================
// BUTTON MIGRATION
// =============================================================================

/**
 * Migrate legacy button props to new design system button props
 */
export function migrateButtonProps(
  legacyProps: LegacyButtonProps
): MigrationResult<ButtonProps> {
  const warnings: string[] = [];
  const deprecated: string[] = [];
  
  const { size, ...otherProps } = legacyProps;
  
  // Map legacy size values to new size values
  let newSize: ButtonProps['size'] = 'md';
  if (size) {
    switch (size) {
      case 'small':
        newSize = 'sm';
        warnings.push('Button size "small" mapped to "sm"');
        break;
      case 'medium':
        newSize = 'md';
        warnings.push('Button size "medium" mapped to "md"');
        break;
      case 'large':
        newSize = 'lg';
        warnings.push('Button size "large" mapped to "lg"');
        break;
      default:
        warnings.push(`Unknown button size "${size}", using "md"`);
    }
  }
  
  const migratedProps: ButtonProps = {
    ...otherProps,
    size: newSize,
  };
  
  return {
    props: migratedProps,
    warnings,
    deprecated,
  };
}

// =============================================================================
// INPUT MIGRATION
// =============================================================================

/**
 * Migrate legacy input props to new design system input props
 */
export function migrateInputProps(
  legacyProps: LegacyInputProps
): MigrationResult<BaseInputProps> {
  const warnings: string[] = [];
  const deprecated: string[] = [];
  
  const { icon, onChange, ...otherProps } = legacyProps;
  
  // Map icon prop to leftIcon
  const migratedProps: BaseInputProps = {
    ...otherProps,
    name: (otherProps as { name?: string }).name || 'input', // Required in new system - default fallback
    label: '', // Required in new system - will need to be provided
    leftIcon: icon,
    onChange: onChange ? (value: unknown) => {
      if (typeof value === 'string') {
        onChange(value);
      }
    } : undefined,
  };
  
  if (!(otherProps as { name?: string }).name) {
    warnings.push('Input "name" prop is required in new system - default value provided');
  }
  
  if (icon) {
    warnings.push('Input "icon" prop mapped to "leftIcon"');
  }
  
  if (!migratedProps.label) {
    warnings.push('Input requires a "label" prop for accessibility');
  }
  
  if (onChange) {
    warnings.push('Input onChange signature changed from (value: string) to (event: ChangeEvent)');
  }
  
  return {
    props: migratedProps,
    warnings,
    deprecated,
  };
}

// =============================================================================
// CARD MIGRATION
// =============================================================================

/**
 * Migrate legacy card props to new design system card props
 */
export function migrateCardProps(
  legacyProps: LegacyCardProps
): MigrationResult<CardProps> {
  const warnings: string[] = [];
  const deprecated: string[] = [];
  
  const { padding, shadow, border, onClick, ...otherProps } = legacyProps;
  
  // Determine variant based on legacy props
  let variant: CardProps['variant'] = 'default';
  if (shadow && border) {
    variant = 'elevated';
    warnings.push('Card with shadow and border mapped to "elevated" variant');
  } else if (border) {
    variant = 'outlined';
    warnings.push('Card with border mapped to "outlined" variant');
  } else if (shadow) {
    variant = 'elevated';
    warnings.push('Card with shadow mapped to "elevated" variant');
  }
  
  // Map padding boolean to padding size
  let paddingSize: CardProps['padding'] = 'md';
  if (padding === false) {
    paddingSize = 'none';
    warnings.push('Card padding=false mapped to padding="none"');
  } else if (padding === true) {
    paddingSize = 'md';
    warnings.push('Card padding=true mapped to padding="md"');
  }
  
  const migratedProps: CardProps = {
    ...otherProps,
    variant,
    padding: paddingSize,
    interactive: Boolean(onClick),
    onClick,
  };
  
  if (onClick) {
    warnings.push('Card onClick mapped to interactive=true');
  }
  
  return {
    props: migratedProps,
    warnings,
    deprecated,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a component is using legacy patterns
 */
export function isLegacyComponent(componentName: string, props: Record<string, unknown>): boolean {
  const legacyPatterns = {
    Button: ['size'],
    Input: ['icon'],
    Card: ['shadow', 'border'],
  };
  
  const patterns = legacyPatterns[componentName as keyof typeof legacyPatterns];
  if (!patterns) return false;
  
  return patterns.some(pattern => pattern in props);
}

/**
 * Generate migration warnings for a component
 */
export function generateMigrationWarnings(
  componentName: string,
  legacyProps: Record<string, unknown>
): string[] {
  const warnings: string[] = [];
  
  switch (componentName) {
    case 'Button':
      if ('size' in legacyProps && typeof legacyProps.size === 'string') {
        if (['small', 'medium', 'large'].includes(legacyProps.size)) {
          warnings.push(`Button: Consider updating size="${legacyProps.size}" to new size values`);
        }
      }
      break;
      
    case 'Input':
      if ('icon' in legacyProps) {
        warnings.push('Input: "icon" prop should be renamed to "leftIcon"');
      }
      if (!('label' in legacyProps)) {
        warnings.push('Input: Missing required "label" prop for accessibility');
      }
      break;
      
    case 'Card':
      if ('shadow' in legacyProps || 'border' in legacyProps) {
        warnings.push('Card: Consider using "variant" prop instead of shadow/border');
      }
      if ('padding' in legacyProps && typeof legacyProps.padding === 'boolean') {
        warnings.push('Card: Consider using padding="none"|"sm"|"md"|"lg" instead of boolean');
      }
      break;
  }
  
  return warnings;
}

/**
 * Validate migrated props against new component interfaces
 */
export function validateMigratedProps<T>(
  componentName: string,
  props: T,
  schema?: Record<string, unknown>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic validation - can be extended with more sophisticated schema validation
  if (!props || typeof props !== 'object') {
    errors.push(`${componentName}: Invalid props object`);
    return { isValid: false, errors };
  }
  
  // Component-specific validation
  switch (componentName) {
    case 'Button':
      const buttonProps = props as ButtonProps;
      if (buttonProps.size && !['sm', 'md', 'lg'].includes(buttonProps.size)) {
        errors.push(`Button: Invalid size "${buttonProps.size}"`);
      }
      break;
      
    case 'Input':
      const inputProps = props as unknown as BaseInputProps;
      if (!inputProps.label) {
        errors.push('Input: Missing required "label" prop');
      }
      if (!inputProps.name) {
        errors.push('Input: Missing required "name" prop');
      }
      break;
      
    case 'Card':
      const cardProps = props as CardProps;
      if (cardProps.variant && !['default', 'elevated', 'outlined', 'ghost'].includes(cardProps.variant)) {
        errors.push(`Card: Invalid variant "${cardProps.variant}"`);
      }
      break;
  }
  
  if (schema) {
    Object.entries(schema).forEach(([key, requirement]) => {
      const requirementShape = requirement as Record<string, unknown>;

      if (requirementShape.required) {
        const value = (props as Record<string, unknown>)[key];
        const isEmpty =
          value === undefined ||
          value === null ||
          (typeof value === "string" && value.trim().length === 0);

        if (isEmpty) {
          errors.push(`${componentName}: Missing required property "${key}"`);
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// DEVELOPMENT UTILITIES
// =============================================================================

/**
 * Log migration information in development
 */
export function logMigrationInfo<T>(
  componentName: string,
  result: MigrationResult<T>
): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  if (result.warnings.length > 0 || result.deprecated.length > 0) {
    console.group(`🔄 Migration Info: ${componentName}`);
    
    if (result.warnings.length > 0) {
      console.warn('Warnings:');
      result.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    
    if (result.deprecated.length > 0) {
      console.warn('Deprecated:');
      result.deprecated.forEach(dep => console.warn(`  - ${dep}`));
    }
    
    console.groupEnd();
  }
}

/**
 * Create a migration wrapper component
 */
export function createMigrationWrapper<T, U extends Record<string, unknown>>(
  NewComponent: React.ComponentType<U>,
  migrationFn: (props: T) => MigrationResult<U>,
  componentName: string
) {
  return function MigrationWrapper(props: T) {
    const result = migrationFn(props);
    
    // Log migration info in development
    logMigrationInfo(componentName, result);
    
    return <NewComponent {...result.props} />;
  };
}

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

/**
 * All migration utilities
 */
export const migrationUtils = {
  migrateButtonProps,
  migrateInputProps,
  migrateCardProps,
  isLegacyComponent,
  generateMigrationWarnings,
  validateMigratedProps,
  logMigrationInfo,
  createMigrationWrapper,
} as const;

/**
 * Development-only migration helpers
 */
export const devMigrationUtils = process.env.NODE_ENV === 'development' ? {
  /**
   * Scan component tree for legacy patterns
   */
  scanForLegacyPatterns: (_element: React.ReactElement): string[] => {
    const warnings: string[] = [];
    
    // This would need to be implemented with React DevTools or similar
    // For now, it's a placeholder for future development
    console.warn('scanForLegacyPatterns not yet implemented');
    
    return warnings;
  },
  
  /**
   * Generate migration report
   */
  generateMigrationReport: (): void => {
    console.group('📊 Migration Report');
    console.log('This feature is planned for future development');
    console.groupEnd();
  },
} : undefined;