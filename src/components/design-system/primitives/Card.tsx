"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { useTheme } from "@/components/design-system";
import type { InteractiveProps, LayoutComponentProps } from "@/components/design-system/types";

/**
 * Card variant styles using class-variance-authority with design tokens
 */
const cardVariants = cva(
  // Base styles using design tokens
  "rounded-lg overflow-hidden transition-all focus:outline-none",
  {
    variants: {
      variant: {
        default: "bg-zinc-950 border border-zinc-700",
        elevated: "bg-zinc-950 border border-zinc-700 shadow-lg",
        outlined: "bg-transparent border-2 border-zinc-600",
        ghost: "bg-zinc-900/50 border border-transparent",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      interactive: {
        true: "cursor-pointer hover:shadow-2xl hover:shadow-red-500/30 hover:border-red-500 focus:ring-2 focus:ring-red-500/50",
        false: "",
      },
      loading: {
        true: "animate-pulse",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      interactive: false,
      loading: false,
    },
  }
);

export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, keyof InteractiveProps | keyof LayoutComponentProps>,
    InteractiveProps,
    LayoutComponentProps,
    VariantProps<typeof cardVariants> {
  /**
   * Card variant style
   */
  variant?: "default" | "elevated" | "outlined" | "ghost";
  /**
   * Internal padding size
   */
  padding?: "none" | "sm" | "md" | "lg";
  /**
   * Whether the card is interactive (clickable)
   */
  interactive?: boolean;
  /**
   * Whether to show loading state
   */
  loading?: boolean;
  /**
   * Card content
   */
  children?: React.ReactNode;
}

/**
 * Loading Skeleton Component
 */
const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse", className)}>
    <div className="space-y-4">
      <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-zinc-700 rounded"></div>
        <div className="h-3 bg-zinc-700 rounded w-5/6"></div>
      </div>
    </div>
  </div>
);

/**
 * Base Card Component
 * 
 * Unified card component with consistent styling and behavior patterns.
 * Supports multiple variants, interactive states, and loading states.
 * 
 * Features:
 * - Design token integration
 * - Multiple visual variants (default, elevated, outlined, ghost)
 * - Interactive states with hover and focus effects
 * - Loading states with skeleton animation
 * - Configurable padding
 * - Full accessibility support
 * - Polymorphic rendering (can render as different HTML elements)
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      padding,
      interactive,
      loading,
      children,
      as: Component = "div",
      onClick,
      onFocus,
      onBlur,
      onKeyDown,
      disabled,
      tabIndex,
      role,
      testId,
      "aria-label": ariaLabel,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const isInteractive = interactive || Boolean(onClick);
    const isDisabled = disabled || loading;

    // Handle keyboard navigation for interactive cards
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isInteractive && !isDisabled) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick?.(event as unknown as React.MouseEvent<HTMLDivElement>);
        }
      }
      onKeyDown?.(event);
    };

    // Handle click for interactive cards
    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isDisabled) {
        onClick?.(event);
      }
    };

    const ElementComponent = Component as React.ElementType;

    return (
      <ElementComponent
        ref={ref}
        className={cn(
          cardVariants({ 
            variant, 
            padding, 
            interactive: isInteractive,
            loading 
          }),
          "duration-200", // Use consistent duration from design tokens
          isDisabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={isInteractive ? handleClick : undefined}
        onFocus={isInteractive ? onFocus : undefined}
        onBlur={isInteractive ? onBlur : undefined}
        onKeyDown={isInteractive ? handleKeyDown : undefined}
        tabIndex={isInteractive && !isDisabled ? (tabIndex ?? 0) : undefined}
        role={isInteractive ? (role || "button") : role}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-disabled={isDisabled}
        data-testid={testId}
        {...props}
      >
        {loading ? <CardSkeleton /> : children}
      </ElementComponent>
    );
  }
);

Card.displayName = "Card";

/**
 * Card Header Component
 * 
 * Standardized header section for cards with consistent spacing and typography.
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Header content
   */
  children?: React.ReactNode;
  /**
   * Whether to add bottom border
   */
  bordered?: boolean;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, bordered = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-6 py-4",
        bordered && "border-b border-zinc-700",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = "CardHeader";

/**
 * Card Content Component
 * 
 * Main content area of the card with consistent padding.
 */
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Content
   */
  children?: React.ReactNode;
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-6 py-4", className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardContent.displayName = "CardContent";

/**
 * Card Footer Component
 * 
 * Footer section for cards with consistent spacing and optional top border.
 */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Footer content
   */
  children?: React.ReactNode;
  /**
   * Whether to add top border
   */
  bordered?: boolean;
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, bordered = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-6 py-4",
        bordered && "border-t border-zinc-700",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = "CardFooter";