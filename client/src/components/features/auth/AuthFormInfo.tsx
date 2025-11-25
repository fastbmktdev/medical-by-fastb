"use client";

import React from "react";
import { cn } from "@shared/lib/utils/cn";

export interface AuthFormInfoProps {
  /**
   * Info message to display
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

const INFO_CONTAINER_CLASSES = "bg-white text-zinc-950 p-4 border border-gray-300 hover:border-gray-400  transition-colors";

/**
 * Auth Form Info Component
 *
 * Optimized reusable info message component with consistent styling matching
 * the forget-password page design. Uses React.memo for performance optimization
 * and includes proper accessibility attributes.
 *
 * @example
 * ```tsx
 * <AuthFormInfo message="Please enter your email to reset your password" />
 * ```
 */
const AuthFormInfoComponent: React.FC<AuthFormInfoProps> = ({
  message,
  className,
  testId,
}) => {
  // Early return for empty messages
  if (!message?.trim()) return null;

  return (
    <div
      className={cn(INFO_CONTAINER_CLASSES, className)}
      role="status"
      aria-live="polite"
      data-testid={testId}
    >
      <p className="text-sm">{message}</p>
    </div>
  );
};

// Memoize with custom comparison function
export const AuthFormInfo = React.memo(
  AuthFormInfoComponent,
  (prevProps, nextProps) =>
    prevProps.message === nextProps.message &&
    prevProps.className === nextProps.className &&
    prevProps.testId === nextProps.testId
);

AuthFormInfo.displayName = "AuthFormInfo";
