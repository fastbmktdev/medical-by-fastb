"use client";

import React from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from '@/lib/utils/cn';
import { useTheme } from "@/components/design-system";
import type { FormComponentProps } from "@/components/design-system/types";
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from "@/components/design-system/primitives/Loading";

/**
 * Select variant styles using class-variance-authority with design tokens
 */
const selectVariants = cva(
  // Base styles using design tokens
  "appearance-none w-full rounded-lg border font-mono transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10",
  {
    variants: {
      variant: {
        default: "bg-zinc-700 border-zinc-600 focus:border-transparent focus:ring-red-500",
        error: "bg-zinc-700 border-red-500 focus:border-red-500 focus:ring-red-500/50",
        success: "bg-zinc-700 border-green-500 focus:border-green-500 focus:ring-green-500/50",
      },
      size: {
        sm: "px-3 py-2 text-sm",
        md: "px-4 py-3 text-base",
        lg: "px-5 py-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

/**
 * Label variant styles
 */
const labelVariants = cva(
  "block font-medium text-zinc-300 mb-2",
  {
    variants: {
      size: {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
      },
      required: {
        true: "after:content-['*'] after:ml-1 after:text-red-500",
        false: "",
      },
    },
    defaultVariants: {
      size: "md",
      required: false,
    },
  }
);

/**
 * Helper text variant styles
 */
const helperTextVariants = cva(
  "mt-2 text-sm",
  {
    variants: {
      variant: {
        default: "text-zinc-400",
        error: "text-red-400",
        success: "text-green-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, keyof FormComponentProps | 'size'>,
    FormComponentProps,
    VariantProps<typeof selectVariants> {
  /**
   * Select size variant
   */
  size?: "sm" | "md" | "lg";
  /**
   * Whether to show loading state
   */
  loading?: boolean;
  /**
   * Success message to display
   */
  successMessage?: string;
  /**
   * Whether to validate on blur
   */
  validateOnBlur?: boolean;
  /**
   * Whether to validate on change
   */
  validateOnChange?: boolean;
  /**
   * Select options as children
   */
  children: React.ReactNode;
}

/**
 * Select Input Component
 * 
 * Enhanced select component with consistent styling, error handling, and accessibility.
 * Built with design system tokens and follows the same patterns as other form components.
 * 
 * Features:
 * - Design token integration
 * - Consistent error and success states
 * - Loading states
 * - Full accessibility support
 * - Validation integration
 * - Proper focus management
 */
const CustomSelect = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      variant,
      size,
      name,
      label,
      error,
      helperText,
      successMessage,
      required,
      disabled,
      loading,
      placeholder,
      value,
      defaultValue,
      onChange,
      onValidate,
      validateOnBlur = true,
      validateOnChange = false,
      onFocus,
      onBlur,
      testId,
      id,
      children,
      "aria-label": ariaLabel,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      "aria-required": ariaRequired,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const [internalError, setInternalError] = React.useState<string | undefined>();
    const [isFocused, setIsFocused] = React.useState(false);
    
    // Generate unique IDs for accessibility
    const selectId = id || `select-${name}`;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;
    const successId = `${selectId}-success`;

    // Determine current state
    const currentError = error || internalError;
    const hasError = Boolean(currentError);
    const hasSuccess = Boolean(successMessage && !hasError);
    const isDisabled = disabled || loading;

    // Determine variant based on state
    const currentVariant = hasError ? "error" : hasSuccess ? "success" : "default";

    // Validation handler
    const handleValidation = React.useCallback((selectValue: string) => {
      if (onValidate) {
        const validationError = onValidate(selectValue);
        setInternalError(validationError);
        return validationError;
      }
      return undefined;
    }, [onValidate]);

    // Change handler with validation
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = event.target.value;
      
      if (validateOnChange) {
        handleValidation(newValue);
      }
      
      onChange?.(newValue, event);
    };

    // Blur handler with validation
    const handleBlur = (event: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(false);
      
      if (validateOnBlur) {
        handleValidation(event.target.value);
      }
      
      onBlur?.(event);
    };

    // Focus handler
    const handleFocus = (event: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(true);
      onFocus?.(event);
    };

    // Build aria-describedby
    const describedByIds = [
      ariaDescribedBy,
      currentError ? errorId : undefined,
      helperText ? helperId : undefined,
      successMessage ? successId : undefined,
    ].filter(Boolean).join(' ');

    return (
      <div
        className={cn(
          "w-full transition-shadow duration-200",
          isFocused && "shadow-lg shadow-red-500/20"
        )}
      >
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
            className={cn(labelVariants({ size, required }))}
          >
            {label}
          </label>
        )}

        {/* Select Container */}
        <div className="relative">
          {/* Select */}
          <select
            ref={ref}
            id={selectId}
            name={name}
            className={cn(
              selectVariants({ 
                variant: currentVariant, 
                size
              }),
              `duration-${theme.animations.duration.normal.replace('ms', '')}`,
              isFocused && "border-red-400 shadow-inner",
              className
            )}
            value={value as string | number | readonly string[] | undefined}
            defaultValue={defaultValue as string | number | readonly string[] | undefined}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={isDisabled}
            required={required}
            aria-label={ariaLabel || label}
            aria-describedby={describedByIds || undefined}
            aria-invalid={ariaInvalid ?? hasError}
            aria-required={ariaRequired ?? required}
            data-testid={testId}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children}
          </select>

          {/* Dropdown Icon or Loading Spinner */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 pointer-events-none">
            {loading ? (
              <LoadingSpinner size={size} />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
          </div>
        </div>

        {/* Error Message */}
        {currentError && (
          <p
            id={errorId}
            className={cn(helperTextVariants({ variant: "error" }))}
            role="alert"
            aria-live="polite"
          >
            {currentError}
          </p>
        )}

        {/* Success Message */}
        {successMessage && !hasError && (
          <p
            id={successId}
            className={cn(helperTextVariants({ variant: "success" }))}
            role="status"
            aria-live="polite"
          >
            {successMessage}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !hasError && !successMessage && (
          <p
            id={helperId}
            className={cn(helperTextVariants({ variant: "default" }))}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

CustomSelect.displayName = 'CustomSelect';

export { CustomSelect };
