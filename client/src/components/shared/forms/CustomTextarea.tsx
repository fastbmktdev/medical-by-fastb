"use client";

import React from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from '@shared/lib/utils/cn';
import { useTheme } from "@/components/design-system";
import type { FormComponentProps } from "@/components/design-system/types";

/**
 * Textarea variant styles using class-variance-authority with design tokens
 */
const textareaVariants = cva(
  // Base styles using design tokens
  "w-full border font-mono transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical",
  {
    variants: {
      variant: {
        default: "bg-white text-zinc-950 border-gray-300 placeholder-gray-400 focus:border-transparent focus:ring-red-500",
        error: "bg-white text-zinc-950 border-red-500 placeholder-gray-400 focus:border-red-500 focus:ring-red-500/50",
        success: "bg-white text-zinc-950 border-green-500 placeholder-gray-400 focus:border-green-500 focus:ring-green-500/50",
      },
      size: {
        sm: "px-3 py-2 text-sm min-h-[80px]",
        md: "px-4 py-3 text-base min-h-[100px]",
        lg: "px-5 py-4 text-lg min-h-[120px]",
      },
      resize: {
        none: "resize-none",
        vertical: "resize-y",
        horizontal: "resize-x",
        both: "resize",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      resize: "vertical",
    },
  }
);

/**
 * Label variant styles
 */
const labelVariants = cva(
  "block font-medium text-zinc-950 mb-2",
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
        default: "text-gray-600",
        error: "text-red-400",
        success: "text-green-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, keyof FormComponentProps>,
    FormComponentProps,
    VariantProps<typeof textareaVariants> {
  /**
   * Textarea size variant
   */
  size?: "sm" | "md" | "lg";
  /**
   * Resize behavior
   */
  resize?: "none" | "vertical" | "horizontal" | "both";
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
   * Maximum character count
   */
  maxLength?: number;
  /**
   * Whether to show character count
   */
  showCharacterCount?: boolean;
}

/**
 * Textarea Input Component
 * 
 * Enhanced textarea component with consistent styling, error handling, and accessibility.
 * Built with design system tokens and follows the same patterns as other form components.
 * 
 * Features:
 * - Design token integration
 * - Consistent error and success states
 * - Character count display
 * - Configurable resize behavior
 * - Full accessibility support
 * - Validation integration
 * - Proper focus management
 */
const CustomTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      size,
      resize,
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
      maxLength,
      showCharacterCount = false,
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
    const [characterCount, setCharacterCount] = React.useState(0);
    
    // Generate unique IDs for accessibility
    const textareaId = id || `textarea-${name}`;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;
    const successId = `${textareaId}-success`;
    const countId = `${textareaId}-count`;

    // Determine current state
    const currentError = error || internalError;
    const hasError = Boolean(currentError);
    const hasSuccess = Boolean(successMessage && !hasError);
    const isDisabled = disabled || loading;

    // Determine variant based on state
    const currentVariant = hasError ? "error" : hasSuccess ? "success" : "default";

    // Update character count
    React.useEffect(() => {
      const currentValue = value || defaultValue || '';
      setCharacterCount(typeof currentValue === 'string' ? currentValue.length : 0);
    }, [value, defaultValue]);

    // Validation handler
    const handleValidation = React.useCallback((textareaValue: string) => {
      if (onValidate) {
        const validationError = onValidate(textareaValue);
        setInternalError(validationError);
        return validationError;
      }
      return undefined;
    }, [onValidate]);

    // Change handler with validation
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      setCharacterCount(newValue.length);
      
      if (validateOnChange) {
        handleValidation(newValue);
      }
      
      onChange?.(newValue, event);
    };

    // Blur handler with validation
    const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      
      if (validateOnBlur) {
        handleValidation(event.target.value);
      }
      
      onBlur?.(event);
    };

    // Focus handler
    const handleFocus = (event: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.(event);
    };

    // Build aria-describedby
    const describedByIds = [
      ariaDescribedBy,
      currentError ? errorId : undefined,
      helperText ? helperId : undefined,
      successMessage ? successId : undefined,
      showCharacterCount ? countId : undefined,
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
            htmlFor={textareaId}
            className={cn(labelVariants({ size, required }))}
          >
            {label}
          </label>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          id={textareaId}
          name={name}
          className={cn(
            textareaVariants({
              variant: currentVariant,
              size,
              resize,
            }),
            "duration-200",
            isFocused && "border-red-400 shadow-inner",
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
          maxLength={maxLength}
          aria-label={ariaLabel || label}
          aria-describedby={describedByIds || undefined}
          aria-invalid={ariaInvalid ?? hasError}
          aria-required={ariaRequired ?? required}
          data-testid={testId}
          {...props}
        />

        {/* Character Count */}
        {showCharacterCount && (
          <div className="flex justify-end mt-1">
            <span
              id={countId}
              className={cn(
                "text-xs",
                maxLength && characterCount > maxLength 
                  ? "text-red-400" 
                  : "text-zinc-500"
              )}
            >
              {characterCount}{maxLength && `/${maxLength}`}
            </span>
          </div>
        )}

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

CustomTextarea.displayName = 'CustomTextarea';

export { CustomTextarea };
