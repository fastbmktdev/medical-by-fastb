"use client";

import React, { useMemo } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { cn } from "@shared/lib/utils/cn";

export interface AuthFormErrorProps {
  /**
   * Error message to display
   */
  message: string;
  
  /**
   * Additional className
   */
  className?: string;
  
  /**
   * Test ID for testing
   */
  testId?: string;
}

const ERROR_CONTAINER_CLASSES = "bg-red-500/20 p-4 border border-red-500/70 shadow-red-500/20 ";

/**
 * Auth Form Error Component
 * 
 * Optimized reusable error display component with consistent styling matching
 * the forget-password page design. Uses React.memo for performance optimization
 * and includes proper accessibility attributes.
 * 
 * @example
 * ```tsx
 * {errors.general && (
 *   <AuthFormError message={errors.general} />
 * )}
 * ```
 */
export const AuthFormError = React.memo<AuthFormErrorProps>(({ 
  message, 
  className,
  testId,
}) => {
  const containerClassName = useMemo(
    () => cn(ERROR_CONTAINER_CLASSES, className),
    [className]
  );

  if (!message?.trim()) return null;

  return (
    <div
      className={containerClassName}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-testid={testId}
    >
      <div className="flex items-center gap-3">
        <ExclamationTriangleIcon 
          className="shrink-0 w-6 h-6 text-red-400" 
          aria-hidden="true"
        />
        <p className="text-red-400 text-sm">{message}</p>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.message === nextProps.message && prevProps.className === nextProps.className;
});

AuthFormError.displayName = "AuthFormError";

