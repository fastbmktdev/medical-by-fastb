"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { LayoutComponentProps } from "@/components/design-system/types/component-props";
import {
  ResponsiveValue,
  SpacingVariant,
  AlignmentVariant,
} from "@/components/design-system/types/variants";

/**
 * Flex Props
 *
 * Props for the Flex component with comprehensive flexbox control.
 */
export interface FlexProps
  extends Omit<
    LayoutComponentProps,
    "direction" | "justify" | "wrap" | "align" | "gap"
  > {
  /**
   * Flex direction
   */
  direction?: ResponsiveValue<
    "row" | "column" | "row-reverse" | "column-reverse" | undefined
  >;

  /**
   * Gap between flex items
   */
  gap?: ResponsiveValue<SpacingVariant | number | undefined>;

  /**
   * Alignment of items along the cross axis
   */
  align?: ResponsiveValue<AlignmentVariant | undefined>;

  /**
   * Justification of items along the main axis
   */
  justify?: ResponsiveValue<
    "start" | "center" | "end" | "between" | "around" | "evenly" | undefined
  >;

  /**
   * Whether items should wrap
   */
  wrap?: ResponsiveValue<"nowrap" | "wrap" | "wrap-reverse" | undefined>;

  /**
   * Flex grow for the container
   */
  grow?: ResponsiveValue<0 | 1>;

  /**
   * Flex shrink for the container
   */
  shrink?: ResponsiveValue<0 | 1>;

  /**
   * Flex basis for the container
   */
  basis?: ResponsiveValue<
    "auto" | "full" | "1/2" | "1/3" | "2/3" | "1/4" | "3/4"
  >;

  /**
   * Whether to fill the available height
   */
  fillHeight?: boolean;

  /**
   * Whether to fill the available width
   */
  fillWidth?: boolean;

  /**
   * Inline flex instead of block flex
   */
  inline?: boolean;
}

/**
 * Get direction classes
 */
const getDirectionClasses = (direction: string): string => {
  const directionMap: Record<string, string> = {
    row: "flex-row",
    column: "flex-col",
    "row-reverse": "flex-row-reverse",
    "column-reverse": "flex-col-reverse",
  };

  return directionMap[direction] || "flex-row";
};

/**
 * Get gap classes
 */
const getGapClasses = (gap: SpacingVariant): string => {
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

  return gapMap[gap] || "gap-4";
};

/**
 * Get alignment classes
 */
const getAlignClasses = (align: AlignmentVariant): string => {
  const alignMap: Record<AlignmentVariant, string> = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
    justify: "items-stretch", // fallback for justify
  };

  return alignMap[align] || "items-start";
};

/**
 * Get justify classes
 */
const getJustifyClasses = (justify: string): string => {
  const justifyMap: Record<string, string> = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  };

  return justifyMap[justify] || "justify-start";
};

/**
 * Get wrap classes
 */
const getWrapClasses = (wrap: string): string => {
  const wrapMap: Record<string, string> = {
    nowrap: "flex-nowrap",
    wrap: "flex-wrap",
    "wrap-reverse": "flex-wrap-reverse",
  };

  return wrapMap[wrap] || "flex-nowrap";
};

/**
 * Get grow classes
 */
const getGrowClasses = (grow: number): string => {
  const growMap: Record<number, string> = {
    0: "flex-grow-0",
    1: "flex-grow",
  };

  return growMap[grow] || "flex-grow-0";
};

/**
 * Get shrink classes
 */
const getShrinkClasses = (shrink: number): string => {
  const shrinkMap: Record<number, string> = {
    0: "flex-shrink-0",
    1: "flex-shrink",
  };

  return shrinkMap[shrink] || "flex-shrink";
};

/**
 * Get basis classes
 */
const getBasisClasses = (basis: string): string => {
  const basisMap: Record<string, string> = {
    auto: "flex-auto",
    full: "flex-1",
    "1/2": "flex-1/2",
    "1/3": "flex-1/3",
    "2/3": "flex-2/3",
    "1/4": "flex-1/4",
    "3/4": "flex-3/4",
  };

  return basisMap[basis] || "flex-auto";
};

/**
 * Get responsive classes for a responsive value
 */
const getResponsiveClasses = <T extends string | number>(
  value: ResponsiveValue<T>,
  getClasses: (val: T) => string
): string => {
  if (typeof value === "string" || typeof value === "number") {
    return getClasses(value);
  }

  if (typeof value === "object" && value !== null) {
    const classes: string[] = [];

    // Base value (mobile-first)
    if (value.sm !== undefined) classes.push(getClasses(value.sm));

    // Responsive breakpoints
    if (value.md !== undefined) {
      const baseClass = getClasses(value.md);
      classes.push(`md:${baseClass.replace(/^[a-z-]+:/, "")}`);
    }
    if (value.lg !== undefined) {
      const baseClass = getClasses(value.lg);
      classes.push(`lg:${baseClass.replace(/^[a-z-]+:/, "")}`);
    }
    if (value.xl !== undefined) {
      const baseClass = getClasses(value.xl);
      classes.push(`xl:${baseClass.replace(/^[a-z-]+:/, "")}`);
    }
    if (value["2xl"] !== undefined) {
      const baseClass = getClasses(value["2xl"]);
      classes.push(`2xl:${baseClass.replace(/^[a-z-]+:/, "")}`);
    }

    return classes.join(" ");
  }

  return "";
};

/**
 * Flex Component
 *
 * A comprehensive flexbox component with full control over flex properties.
 * Supports responsive breakpoints and all flexbox features.
 *
 * @example
 * ```tsx
 * // Basic flex container
 * <Flex gap="md" align="center">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Flex>
 *
 * // Column layout with justification
 * <Flex direction="column" justify="between" fillHeight>
 *   <div>Header</div>
 *   <div>Content</div>
 *   <div>Footer</div>
 * </Flex>
 *
 * // Responsive flex
 * <Flex
 *   direction={{ sm: 'column', md: 'row' }}
 *   gap={{ sm: 'sm', md: 'md', lg: 'lg' }}
 *   align={{ sm: 'start', md: 'center' }}
 *   wrap={{ sm: 'wrap', lg: 'nowrap' }}
 * >
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Flex>
 * ```
 */
export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  (
    {
      children,
      className,
      direction = "row",
      gap = "md",
      align = "start",
      justify = "start",
      wrap = "nowrap",
      grow,
      shrink,
      basis,
      fillHeight = false,
      fillWidth = false,
      inline = false,
      as: Component = "div",
      testId,
      ...props
    },
    ref
  ) => {
    // Generate responsive classes
    const directionClasses = getResponsiveClasses(
      direction,
      getDirectionClasses
    );
    const gapClasses =
      typeof gap === "object"
        ? getResponsiveClasses(
            gap as ResponsiveValue<SpacingVariant>,
            getGapClasses
          )
        : getGapClasses(gap as SpacingVariant);
    const alignClasses = getResponsiveClasses(align, getAlignClasses);
    const justifyClasses = getResponsiveClasses(justify, getJustifyClasses);
    const wrapClasses =
      typeof wrap === "object"
        ? getResponsiveClasses(wrap as ResponsiveValue<string>, getWrapClasses)
        : getWrapClasses(wrap as string);
    const growClasses =
      grow !== undefined ? getResponsiveClasses(grow, getGrowClasses) : "";
    const shrinkClasses =
      shrink !== undefined
        ? getResponsiveClasses(shrink, getShrinkClasses)
        : "";
    const basisClasses =
      basis !== undefined ? getResponsiveClasses(basis, getBasisClasses) : "";

    const flexClasses = cn(
      // Base flex styles
      inline ? "inline-flex" : "flex",

      // Direction
      directionClasses,

      // Gap
      gapClasses,

      // Alignment
      alignClasses,

      // Justification
      justifyClasses,

      // Wrap
      wrapClasses,

      // Flex properties
      growClasses,
      shrinkClasses,
      basisClasses,

      // Fill dimensions
      fillHeight && "h-full",
      fillWidth && "w-full",

      // Custom classes
      className
    );

    // Type assertion to avoid complex union type inference
    const ComponentWithProps = Component as React.ElementType;

    return (
      <ComponentWithProps
        ref={ref}
        className={flexClasses}
        data-testid={testId}
        {...(props as React.ComponentPropsWithoutRef<typeof Component>)}
      >
        {children}
      </ComponentWithProps>
    );
  }
);

Flex.displayName = "Flex";

export default Flex;
