"use client";

import { forwardRef } from "react";
import { cn } from '@shared/lib/utils/cn';
import { FeedbackComponentProps } from "@/components/design-system/types/component-props";
import { ComponentSize } from "@/components/design-system/types/variants";

export interface LoadingProps extends Omit<FeedbackComponentProps, "variant"> {
  variant?: "spinner" | "dots" | "pulse" | "skeleton";
  size?: ComponentSize;
  text?: string;
  centered?: boolean;
  overlay?: boolean;
  color?: "primary" | "secondary" | "neutral";
}

const SIZE_MAP: Record<ComponentSize, Record<string, string>> = {
  xs: { spinner: "w-4 h-4", dots: "gap-1", pulse: "w-8 h-8", skeleton: "h-4" },
  sm: {
    spinner: "w-5 h-5",
    dots: "gap-1.5",
    pulse: "w-12 h-12",
    skeleton: "h-5",
  },
  md: {
    spinner: "w-6 h-6",
    dots: "gap-2",
    pulse: "w-16 h-16",
    skeleton: "h-6",
  },
  lg: {
    spinner: "w-8 h-8",
    dots: "gap-2.5",
    pulse: "w-20 h-20",
    skeleton: "h-8",
  },
  xl: {
    spinner: "w-10 h-10",
    dots: "gap-3",
    pulse: "w-24 h-24",
    skeleton: "h-10",
  },
};

const COLOR_MAP: Record<string, string> = {
  primary: "text-red-500 border-red-500",
  secondary: "text-gray-500 border-gray-500",
  neutral: "text-gray-400 border-gray-400",
};

const getSizeClasses = (size: ComponentSize, variant: string) =>
  SIZE_MAP[size]?.[variant] || SIZE_MAP.md[variant] || "";

const getColorClasses = (color: string) =>
  COLOR_MAP[color] || COLOR_MAP.primary;

export interface LoadingSpinnerProps {
  size?: ComponentSize;
  color?: "primary" | "secondary" | "neutral";
  className?: string;
}

export const LoadingSpinner = ({
  size = "md",
  color = "primary",
  className,
}: LoadingSpinnerProps) => (
  <div
    className={cn(
      " border-2",
      getSizeClasses(size, "spinner"),
      getColorClasses(color),
      "border-transparent border-t-current",
      "animate-spin",
      className
    )}
    role="status"
    aria-label="Loading"
  />
);

export const Loading = forwardRef<HTMLDivElement, LoadingProps>(
  (
    {
      // variant = "spinner",
      size = "md",
      text,
      centered = false,
      overlay = false,
      color = "primary",
      className,
      testId,
      ...props
    },
    ref
  ) => {
    const loadingContent = (
      <div
        className={cn("flex items-center gap-3", centered ? "justify-center" : "")}
      >
        <LoadingSpinner size={size} color={color} />
        {text && (
          <span className={cn("text-sm font-medium", getColorClasses(color))}>
            {text}
          </span>
        )}
      </div>
    );

    if (overlay) {
      return (
        <div
          ref={ref}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm",
            className
          )}
          data-testid={testId}
          {...props}
        >
          <div className="bg-white dark:bg-gray-800  p-6 shadow-lg">
            {loadingContent}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center",
          centered ? "justify-center" : "",
          className
        )}
        data-testid={testId}
        {...props}
      >
        {loadingContent}
      </div>
    );
  }
);

Loading.displayName = "Loading";
