"use client";

import React, { forwardRef, ReactNode, ButtonHTMLAttributes, KeyboardEvent, MouseEvent } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from '@shared/lib/utils/cn';
import { useTheme } from "@/components/design-system";
import type { InteractiveProps } from "@/components/design-system/types";
import { LoadingSpinner } from "@/components/design-system/primitives/Loading";

// Button variant styles with design tokens
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold text-sm focus:outline-none focus:ring-2 disabled:pointer-events-none disabled:opacity-50 transform transition-all",
  {
    variants: {
      variant: {
        primary: "bg-violet-700 hover:bg-[#8B5CF6] text-zinc-950 shadow-lg hover:shadow-xl hover:shadow-[#A78BFA]/25 focus:ring-[#A78BFA]/50",
        secondary: "bg-[#00ACC1] hover:bg-[#0097A7] text-zinc-950 border border-[#00ACC1] hover:border-[#0097A7] focus:ring-[#00ACC1]/50",
        outline: "border border-[#A78BFA] text-[#A78BFA] hover:bg-violet-700 hover:text-zinc-950 focus:ring-[#A78BFA]/50",
        ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-[#A78BFA]/50",
        danger: "bg-red-600 hover:bg-red-700 text-zinc-950 shadow-lg hover:shadow-xl hover:shadow-red-500/25 focus:ring-red-500/50",
        success: "bg-[#4CAF50] hover:bg-[#45A049] text-zinc-950 shadow-lg hover:shadow-xl hover:shadow-[#4CAF50]/25 focus:ring-[#4CAF50]/50",
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
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof InteractiveProps>,
    InteractiveProps,
    VariantProps<typeof buttonVariants> {
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  asChild?: boolean;
  animation?: "none" | "scale" | "lift" | "glow";
}

const getSpinnerSize = (size?: ButtonProps['size']) => {
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

const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const {
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
    ...restProps
  } = props;

  useTheme(); // For future theming logic

  const isDisabled = disabled || loading;
  const accessibleLabel = ariaLabel || (typeof children === 'string' ? children : undefined);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isDisabled && onClick) {
        onClick(event as unknown as MouseEvent<HTMLButtonElement>);
      }
    }
    onKeyDown?.(event);
  };

  const buttonContent = loading ? (
    <>
      <LoadingSpinner size={getSpinnerSize(size)} />
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
  );

  const durationClass = "duration-200";

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
      {...restProps}
    >
      {buttonContent}
    </button>
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };