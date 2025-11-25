"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from '@shared/lib/utils/cn';
import { useTheme } from "@/components/design-system";
import type { InteractiveProps } from "@/components/design-system/types";
import { LoadingSpinner } from "@/components/design-system/primitives/Loading";

/**
 * Button variant styles using class-variance-authority with design tokens
 */
const buttonVariants = cva(
  // Base styles - consistent animation and transition for all buttons using design tokens
  "inline-flex items-center justify-center gap-2  font-semibold text-sm focus:outline-none focus:ring-2 disabled:pointer-events-none disabled:opacity-50 transform transition-all",
  {
    variants: {
      variant: {
        // Primary button - main action buttons (Violet-400)
        primary: "bg-[#A78BFA] hover:bg-[#8B5CF6] text-white shadow-lg hover:shadow-xl hover:shadow-[#A78BFA]/25 focus:ring-[#A78BFA]/50",
        
        // Secondary button - secondary actions (Medical Teal)
        secondary: "bg-[#00ACC1] hover:bg-[#0097A7] text-white border border-[#00ACC1] hover:border-[#0097A7] focus:ring-[#00ACC1]/50",
        
        // Outline button - alternative actions (Violet-400)
        outline: "border border-[#A78BFA] text-[#A78BFA] hover:bg-[#A78BFA] hover:text-white focus:ring-[#A78BFA]/50",
        
        // Ghost button - subtle actions
        ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-[#A78BFA]/50",
        
        // Danger button - destructive actions
        danger: "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl hover:shadow-red-500/25 focus:ring-red-500/50",
        
        // Success button - positive actions (Medical Green)
        success: "bg-[#4CAF50] hover:bg-[#45A049] text-white shadow-lg hover:shadow-xl hover:shadow-[#4CAF50]/25 focus:ring-[#4CAF50]/50",
        
        // Link button - navigation actions (Violet-400)
        link: "text-[#A78BFA] hover:text-[#8B5CF6] underline-offset-4 hover:underline p-0 h-auto focus:ring-[#A78BFA]/50",
      },
      size: {
        xs: "h-7 px-2.5 text-xs",
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 py-3 text-base",
        xl: "h-14 px-8 py-4 text-lg",
        icon: "h-10 w-10",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
      animation: {
        none: "",
        scale: "hover:scale-[1.02] active:scale-[0.98]",
        lift: "hover:-translate-y-0.5 active:translate-y-0",
        glow: "hover:shadow-lg active:shadow-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
      animation: "scale",
    },
  }
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof InteractiveProps>,
    InteractiveProps,
    VariantProps<typeof buttonVariants> {
  /**
   * Loading text to display when loading
   */
  loadingText?: string;
  /**
   * Icon to display before text
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to display after text
   */
  rightIcon?: React.ReactNode;
  /**
   * Render as child component (e.g., Link)
   */
  asChild?: boolean;
  /**
   * Animation variant for hover/active states
   */
  animation?: "none" | "scale" | "lift" | "glow";
}

/**
 * Enhanced Button Component
 * 
 * Features:
 * - Design token integration for consistent theming
 * - Enhanced TypeScript support with InteractiveProps
 * - Improved accessibility with ARIA attributes
 * - Configurable animations (scale, lift, glow, none)
 * - Consistent loading states with proper spinner
 * - Icon support with proper spacing
 * - Full keyboard navigation support
 * - Focus management and visual indicators
 * 
 * Design Token Usage:
 * - Colors: Uses design system color tokens
 * - Spacing: Uses semantic spacing tokens
 * - Animations: Uses design system animation tokens
 * - Typography: Uses design system typography tokens
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      animation,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      asChild = false,
      testId,
      "aria-label": ariaLabel,
      "aria-describedby": ariaDescribedBy,
      onClick,
      onFocus,
      onBlur,
      onKeyDown,
      autoFocus,
      tabIndex,
      role,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const isDisabled = disabled || loading;
    const Comp = asChild ? React.Fragment : "button";

    // Generate accessible label if not provided
    const accessibleLabel = ariaLabel || (typeof children === 'string' ? children : undefined);

    // Handle keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Allow Enter and Space to trigger button
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!isDisabled && onClick) {
          onClick(event as unknown as React.MouseEvent<HTMLButtonElement>);
        }
      }
      onKeyDown?.(event);
    };

    // Determine spinner size based on button size
    const getSpinnerSize = () => {
      switch (size) {
        case 'xs':
        case 'sm':
          return 'sm';
        case 'lg':
        case 'xl':
          return 'lg';
        default:
          return 'md';
      }
    };

    const buttonContent = (
      <>
        {loading ? (
          <>
            <LoadingSpinner size={getSpinnerSize()} />
            <span className="sr-only">Loading</span>
            {loadingText || children || "กำลังโหลด..."}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="shrink-0" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className="shrink-0" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </>
    );

    // Apply design token-based duration using CSS variable
    const durationClass = "duration-200"; // Use consistent duration from design tokens

    if (asChild) {
      return (
        <div
          className={cn(
            buttonVariants({ variant, size, fullWidth, animation }),
            durationClass,
            className
          )}
          data-testid={testId}
        >
          {buttonContent}
        </div>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          buttonVariants({ variant, size, fullWidth, animation }),
          durationClass,
          className
        )}
        disabled={isDisabled}
        aria-label={accessibleLabel}
        aria-describedby={ariaDescribedBy}
        aria-disabled={isDisabled}
        data-testid={testId}
        onClick={onClick}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        tabIndex={isDisabled ? -1 : tabIndex}
        role={role || "button"}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };