"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { useTheme } from "@/components/design-system";
import type { FormComponentProps } from "@/components/design-system/types";

/**
 * Input variant styles using class-variance-authority with design tokens
 */
const inputVariants = cva(
  // Base styles using design tokens
  "w-full rounded-lg border font-mono transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-zinc-700 border-zinc-600 placeholder-zinc-500 focus:border-transparent focus:ring-red-500",
        error: "bg-zinc-700 border-red-500 placeholder-zinc-500 focus:border-red-500 focus:ring-red-500/50",
        success: "bg-zinc-700 border-green-500 placeholder-zinc-500 focus:border-green-500 focus:ring-green-500/50",
      },
      size: {
        sm: "px-3 py-2 text-sm",
        md: "px-4 py-3 text-base",
        lg: "px-5 py-4 text-lg",
      },
      hasIcon: {
        left: "pl-10",
        right: "pr-10",
        both: "pl-10 pr-10",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      hasIcon: "none",
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

export interface BaseInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof FormComponentProps | 'size'>,
    FormComponentProps,
    VariantProps<typeof inputVariants> {
  /**
   * Icon to display on the left side of the input
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to display on the right side of the input
   */
  rightIcon?: React.ReactNode;
  /**
   * Input size variant
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
}

/**
 * Loading Spinner for Input
 */
const InputSpinner: React.FC<{ size?: "sm" | "md" | "lg" }> = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div 
      className={cn(
        "border-2 border-current border-t-transparent rounded-full animate-spin text-zinc-500",
        sizeClasses[size]
      )}
      role="status"
      aria-label="Loading"
    />
  );
};

/**
 * Base Input Component
 * 
 * Provides consistent styling, error handling, and accessibility features
 * for all input components in the design system.
 * 
 * Features:
 * - Design token integration
 * - Consistent error and success states
 * - Icon support with proper spacing
 * - Loading states
 * - Full accessibility support
 * - Validation integration
 * - Proper focus management
 */
export const BaseInput = React.forwardRef<HTMLInputElement, BaseInputProps>(
  (
    {
      className,
      variant,
      size,
      hasIcon,
      name,
      label,
      error,
      helperText,
      successMessage,
      required,
      disabled,
      loading,
      leftIcon,
      rightIcon,
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
    
    // Generate unique IDs for accessibility
    const inputId = id || `input-${name}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const successId = `${inputId}-success`;

    // Determine current state
    const currentError = error || internalError;
    const hasError = Boolean(currentError);
    const hasSuccess = Boolean(successMessage && !hasError);
    const isDisabled = disabled || loading;

    // Determine variant based on state
    const currentVariant = hasError ? "error" : hasSuccess ? "success" : "default";

    // Determine icon configuration
    const iconConfig = leftIcon && rightIcon ? "both" : leftIcon ? "left" : rightIcon ? "right" : "none";

    // Validation handler
    const handleValidation = React.useCallback((inputValue: string) => {
      if (onValidate) {
        const validationError = onValidate(inputValue);
        setInternalError(validationError);
        return validationError;
      }
      return undefined;
    }, [onValidate]);

    // Change handler with validation
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      
      if (validateOnChange) {
        handleValidation(newValue);
      }
      
      onChange?.(newValue, event);
    };

    // Blur handler with validation
    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      if (validateOnBlur) {
        handleValidation(event.target.value);
      }
      
      onBlur?.(event);
    };

    // Focus handler
    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
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
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(labelVariants({ size, required }))}
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            name={name}
            type="text"
            className={cn(
              inputVariants({ 
                variant: currentVariant, 
                size, 
                hasIcon: iconConfig 
              }),
              "duration-200", // Use consistent duration from design tokens
              className
            )}
            placeholder={placeholder}
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
          />

          {/* Right Icon or Loading Spinner */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500">
            {loading ? (
              <InputSpinner size={size} />
            ) : rightIcon ? (
              <div className="pointer-events-none">
                {rightIcon}
              </div>
            ) : null}
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

BaseInput.displayName = "BaseInput";