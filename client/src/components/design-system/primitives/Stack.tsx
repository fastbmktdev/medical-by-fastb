"use client";

import React from "react";
import { cn } from '@shared/lib/utils/cn';
import { LayoutComponentProps } from "@/components/design-system/types/component-props";
import {
  ResponsiveValue,
  SpacingVariant,
  AlignmentVariant,
} from "@/components/design-system/types/variants";

/**
 * Stack Props
 *
 * Props for the Stack component with responsive spacing and alignment.
 */
export interface StackProps
  extends Omit<
    LayoutComponentProps,
    "direction" | "align" | "justify" | "gap"
  > {
  /**
   * Stack direction
   */
  direction?: ResponsiveValue<"vertical" | "horizontal" | undefined>;

  /**
   * Gap between stack items
   */
  gap?: ResponsiveValue<SpacingVariant | number | undefined>;

  /**
   * Alignment of items along the cross axis
   */
  align?: ResponsiveValue<AlignmentVariant | "justify" | undefined>;

  /**
   * Whether items should wrap
   */
  wrap?: ResponsiveValue<"nowrap" | "wrap" | "wrap-reverse" | undefined>;

  /**
   * Whether to reverse the order of items
   */
  reverse?: ResponsiveValue<boolean | undefined>;

  /**
   * Whether to fill the available height (for vertical stacks)
   */
  fillHeight?: ResponsiveValue<boolean | undefined>;

  /**
   * Whether to fill the available width (for horizontal stacks)
   */
  fillWidth?: ResponsiveValue<boolean | undefined>;
}

/**
 * Get direction classes
 */
const getDirectionClasses = (
  direction: string,
  reverse: boolean = false
): string => {
  const directionMap: Record<string, string> = {
    vertical: reverse ? "flex-col-reverse" : "flex-col",
    horizontal: reverse ? "flex-row-reverse" : "flex-row",
  };

  return directionMap[direction] || "flex-col";
};

/**
 * Get gap classes
 */
const getGapClasses = (gap: SpacingVariant | number): string => {
  const gapMap: Record<SpacingVariant, string> = {
    none: "gap-0",
    xs: "gap-1", // 4px
    sm: "gap-2", // 8px
    md: "gap-4", // 16px
    lg: "gap-6", // 24px
    xl: "gap-8", // 32px
    "2xl": "gap-12", // 48px
    "3xl": "gap-16", // 64px
  };

  return gapMap[gap as SpacingVariant] || "gap-4";
};

/**
 * Get alignment classes
 */
const getAlignClasses = (
  align: AlignmentVariant | "justify" | undefined
): string => {
  const alignMap: Record<AlignmentVariant, string> = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
    justify: "items-stretch", // fallback for justify
  };

  return alignMap[align as AlignmentVariant | "justify"] || "items-start";
};

/**
 * Get justify classes
 */

/**
 * Get responsive classes for a responsive value
 */
const getResponsiveClasses = <T extends string | number | undefined>(
  value: ResponsiveValue<T>,
  getClasses: (val: Exclude<T, undefined> | number) => string
): string => {
  if (typeof value === "string" || typeof value === "number") {
    return getClasses(value as Exclude<T, undefined> | number);
  }

  if (typeof value === "object" && value !== null) {
    const classes: string[] = [];

    // Base value (mobile-first)
    if (value.sm !== undefined)
      classes.push(getClasses(value.sm as Exclude<T, undefined> | number));

    // Responsive breakpoints
    if (value.md !== undefined) {
      const baseClass = getClasses(value.md as Exclude<T, undefined> | number);
      classes.push(`md:${baseClass.replace(/^[a-z-]+:/, "")}`);
    }
    if (value.lg !== undefined) {
      const baseClass = getClasses(value.lg as Exclude<T, undefined> | number);
      classes.push(`lg:${baseClass.replace(/^[a-z-]+:/, "")}`);
    }
    if (value.xl !== undefined) {
      const baseClass = getClasses(value.xl as Exclude<T, undefined> | number);
      classes.push(`xl:${baseClass.replace(/^[a-z-]+:/, "")}`);
    }
    if (value["2xl"] !== undefined) {
      const baseClass = getClasses(
        value["2xl"] as Exclude<T, undefined> | number
      );
      classes.push(`2xl:${baseClass.replace(/^[a-z-]+:/, "")}`);
    }

    return classes.join(" ");
  }

  return "";
};

/**
 * Stack Component
 *
 * A flexible layout component that arranges children in a vertical or horizontal stack.
 * Provides consistent spacing, alignment, and responsive behavior.
 *
 * @example
 * ```tsx
 * // Vertical stack (default)
 * <Stack gap="md">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Stack>
 *
 * // Horizontal stack
 * <Stack direction="horizontal" gap="lg" align="center">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Stack>
 *
 * // Responsive stack
 * <Stack
 *   direction={{ sm: 'vertical', md: 'horizontal' }}
 *   gap={{ sm: 'sm', md: 'md', lg: 'lg' }}
 *   align={{ sm: 'start', md: 'center' }}
 * >
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Stack>
 * ```
 */
export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  (
    {
      children,
      className,
      direction = "vertical",
      gap = "md",
      align = "start",
      wrap = false,
      reverse = false,
      fillHeight = false,
      fillWidth = false,
      as: Component = "div",
      testId,
      ...props
    },
    ref
  ) => {
    // Generate responsive classes
    const directionClasses = getResponsiveClasses(direction, (dir) =>
      getDirectionClasses(dir as "vertical" | "horizontal", reverse as boolean)
    );
    const gapClasses = getResponsiveClasses(gap, (gap) =>
      getGapClasses(gap as SpacingVariant | number)
    );
    const alignClasses = getResponsiveClasses(align, (align) =>
      getAlignClasses(align as AlignmentVariant | "justify")
    );

    const stackClasses = cn(
      // Base flex styles
      "flex",

      // Direction
      directionClasses,

      // Gap
      gapClasses,

      // Alignment
      alignClasses,

      // Wrap
      wrap ? "flex-wrap" : "",

      // Fill dimensions
      fillHeight ? "h-full" : "",
      fillWidth ? "w-full" : "",

      // Custom classes
      className
    );

    // Type assertion to avoid complex union type inference
    const ComponentWithProps = Component as React.ElementType;

    return (
      <ComponentWithProps
        ref={ref}
        className={stackClasses}
        data-testid={testId}
        {...(props as React.ComponentPropsWithoutRef<typeof Component>)}
      >
        {children}
      </ComponentWithProps>
    );
  }
);

Stack.displayName = "Stack";

export default Stack;
