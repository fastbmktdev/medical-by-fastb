"use client";

import React, { useMemo } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { cn } from "@shared/lib/utils/cn";

export interface AuthFormFieldProps {
  /**
   * Field label
   */
  label: string;
  
  /**
   * Field name/id
   */
  name: string;
  
  /**
   * Field type
   */
  type?: React.HTMLInputTypeAttribute;
  
  /**
   * Field value
   */
  value: string;
  
  /**
   * Change handler
   */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  
  /**
   * Error message
   */
  error?: string;
  
  /**
   * Placeholder text
   */
  placeholder?: string;
  
  /**
   * Auto complete attribute
   */
  autoComplete?: string;
  
  /**
   * Whether field is required
   */
  required?: boolean;
  
  /**
   * Whether field is disabled
   */
  disabled?: boolean;
  
  /**
   * Additional className
   */
  className?: string;
  
  /**
   * Test ID for testing
   */
  testId?: string;
}

const BASE_INPUT_CLASSES = "w-full bg-white text-zinc-950 border  px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/70 focus:shadow-lg focus:shadow-red-500/10 transition-all duration-200 font-mono text-sm";
const ERROR_INPUT_CLASSES = "border-red-500/70 shadow-red-500/20";
const NORMAL_INPUT_CLASSES = "border-gray-300 hover:border-gray-400";

/**
 * Auth Form Field Component
 * 
 * Optimized reusable form field component with consistent styling matching
 * the forget-password page design. Uses React.memo for performance optimization
 * and includes proper accessibility attributes.
 * 
 * @example
 * ```tsx
 * <AuthFormField
 *   label="Email"
 *   name="email"
 *   type="email"
 *   value={formData.email}
 *   onChange={handleInputChange}
 *   error={errors.email}
 *   placeholder="Enter your email"
 *   autoComplete="email"
 *   required
 * />
 * ```
 */
export const AuthFormField = React.memo<AuthFormFieldProps>(({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
  required,
  disabled,
  className,
  testId,
}) => {
  const inputId = useMemo(() => name, [name]);
  const errorId = useMemo(() => `${name}-error`, [name]);
  
  const inputClassName = useMemo(
    () => cn(
      BASE_INPUT_CLASSES,
      error ? ERROR_INPUT_CLASSES : NORMAL_INPUT_CLASSES
    ),
    [error]
  );

  const hasError = Boolean(error);

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className="block mb-2 font-medium text-zinc-950 text-sm"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          className={inputClassName}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          aria-required={required}
          data-testid={testId}
          suppressHydrationWarning
        />
      </div>
      {hasError && (
        <p
          id={errorId}
          className="flex items-center gap-1 mt-2 text-red-400 text-sm"
          role="alert"
          aria-live="polite"
        >
          <ExclamationTriangleIcon className="w-4 h-4" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.value === nextProps.value &&
    prevProps.error === nextProps.error &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.label === nextProps.label &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.required === nextProps.required &&
    prevProps.type === nextProps.type &&
    prevProps.className === nextProps.className
  );
});

AuthFormField.displayName = "AuthFormField";

