"use client";

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { LayoutComponentProps } from '@/components/design-system/types/component-props';
import { ResponsiveValue, SpacingVariant } from '@/components/design-system/types/variants';

/**
 * Grid Props
 * 
 * Props for the Grid component with responsive columns and spacing.
 */
export interface GridProps extends Omit<LayoutComponentProps, 'gap' | 'padding' | 'margin' | 'maxWidth' | 'centered'> {
  /**
   * Number of columns in the grid
   */
  cols?: ResponsiveValue<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | undefined>;
  
  /**
   * Gap between grid items
   */
  gap?: ResponsiveValue<SpacingVariant | undefined>;
  
  /**
   * Row gap (if different from column gap)
   */
  rowGap?: ResponsiveValue<SpacingVariant | number | undefined>;
  
  /**
   * Column gap (if different from row gap)
   */
  colGap?: ResponsiveValue<SpacingVariant | number | undefined>;
  
  /**
   * Auto-fit columns with minimum width
   */
  autoFit?: ResponsiveValue<'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined>;
  
  /**
   * Auto-fill columns with minimum width
   */
  autoFill?: ResponsiveValue<'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined>;
  
  /**
   * Dense grid packing
   */
  dense?: boolean;
}

/**
 * Get grid columns classes
 */
const getColsClasses = (cols: number): string => {
  const colsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8',
    9: 'grid-cols-9',
    10: 'grid-cols-10',
    11: 'grid-cols-11',
    12: 'grid-cols-12',
  };
  
  return colsMap[cols] || 'grid-cols-1';
};

/**
 * Get gap classes
 */
const getGapClasses = (gap: SpacingVariant | number): string => {
  const gapMap: Record<SpacingVariant, string> = {
    'none': 'gap-0',
    'xs': 'gap-1',      // 4px
    'sm': 'gap-2',      // 8px
    'md': 'gap-4',      // 16px
    'lg': 'gap-6',      // 24px
    'xl': 'gap-8',      // 32px
    '2xl': 'gap-12',    // 48px
    '3xl': 'gap-16',    // 64px
  };
  
  return gapMap[gap as SpacingVariant] || 'gap-4';
};

/**
 * Get row gap classes
 */
const getRowGapClasses = (gap: SpacingVariant | number): string => {
  const gapMap: Record<SpacingVariant, string> = {
    'none': 'gap-y-0',
    'xs': 'gap-y-1',
    'sm': 'gap-y-2',
    'md': 'gap-y-4',
    'lg': 'gap-y-6',
    'xl': 'gap-y-8',
    '2xl': 'gap-y-12',
    '3xl': 'gap-y-16',
  };
  
  return gapMap[gap as SpacingVariant] || 'gap-y-4';
};

/**
 * Get column gap classes
 */
const getColGapClasses = (gap: SpacingVariant | number): string => {
  const gapMap: Record<SpacingVariant, string> = {
    'none': 'gap-x-0',
    'xs': 'gap-x-1',
    'sm': 'gap-x-2',
    'md': 'gap-x-4',
    'lg': 'gap-x-6',
    'xl': 'gap-x-8',
    '2xl': 'gap-x-12',
    '3xl': 'gap-x-16',
  };
  
  return gapMap[gap as SpacingVariant] || 'gap-x-4';
};

/**
 * Get auto-fit classes
 */
const getAutoFitClasses = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): string => {
  const sizeMap: Record<string, string> = {
    'xs': 'grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]',  // 256px
    'sm': 'grid-cols-[repeat(auto-fit,minmax(20rem,1fr))]',  // 320px
    'md': 'grid-cols-[repeat(auto-fit,minmax(24rem,1fr))]',  // 384px
    'lg': 'grid-cols-[repeat(auto-fit,minmax(28rem,1fr))]',  // 448px
    'xl': 'grid-cols-[repeat(auto-fit,minmax(32rem,1fr))]',  // 512px
  };
  
  return sizeMap[size] || sizeMap.md;
};

/**
 * Get auto-fill classes
 */
const getAutoFillClasses = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): string => {
  const sizeMap: Record<string, string> = {
    'xs': 'grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]',
    'sm': 'grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]',
    'md': 'grid-cols-[repeat(auto-fill,minmax(24rem,1fr))]',
    'lg': 'grid-cols-[repeat(auto-fill,minmax(28rem,1fr))]',
    'xl': 'grid-cols-[repeat(auto-fill,minmax(32rem,1fr))]',
  };
  
  return sizeMap[size] || sizeMap.md;
};

/**
 * Get responsive classes for a responsive value
 */
const getResponsiveClasses = <T extends string | number | undefined>(
  value: ResponsiveValue<T>,
  getClasses: (val: Exclude<T, undefined> | number) => string
): string => {
  if (typeof value === 'string' || typeof value === 'number') {
    return getClasses(value as Exclude<T, undefined> | number);
  }
  
  if (typeof value === 'object' && value !== null) {
    const classes: string[] = [];
    
    // Base value (mobile-first)
    if (value.sm !== undefined) classes.push(getClasses(value.sm as Exclude<T, undefined> | number));
    
    // Responsive breakpoints
    if (value.md !== undefined) {
      const baseClass = getClasses(value.md as Exclude<T, undefined> | number);
      classes.push(`md:${baseClass.replace(/^[a-z-]+:/, '')}`);
    }
    if (value.lg !== undefined) {
      const baseClass = getClasses(value.lg as Exclude<T, undefined> | number);
      classes.push(`lg:${baseClass.replace(/^[a-z-]+:/, '')}`);
    }
    if (value.xl !== undefined) {
      const baseClass = getClasses(value.xl as Exclude<T, undefined> | number);
      classes.push(`xl:${baseClass.replace(/^[a-z-]+:/, '')}`);
    }
    if (value['2xl'] !== undefined) {
      const baseClass = getClasses(value['2xl'] as Exclude<T, undefined> | number);
      classes.push(`2xl:${baseClass.replace(/^[a-z-]+:/, '')}`);
    }
    
    return classes.join(' ');
  }
  
  return '';
};

/**
 * Grid Component
 * 
 * A responsive CSS Grid component with configurable columns, gaps, and auto-sizing.
 * Supports responsive breakpoints and flexible grid layouts.
 * 
 * @example
 * ```tsx
 * // Basic grid
 * <Grid cols={3} gap="md">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Grid>
 * 
 * // Responsive grid
 * <Grid 
 *   cols={{ sm: 1, md: 2, lg: 3, xl: 4 }}
 *   gap={{ sm: 'sm', md: 'md', lg: 'lg' }}
 * >
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Grid>
 * 
 * // Auto-fit grid
 * <Grid autoFit="md" gap="lg">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Grid>
 * ```
 */
export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  (
    {
      children,
      className,
      cols,
      gap = 'md',
      rowGap,
      colGap,
      autoFit,
      autoFill,
      dense = false,
      as: Component = 'div',
      testId,
      ...props
    },
    ref
  ) => {
    // Generate responsive classes
    const colsClasses = cols ? getResponsiveClasses(cols as ResponsiveValue<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | undefined>, getColsClasses) : '';
    const gapClasses = getResponsiveClasses(gap as ResponsiveValue<SpacingVariant | undefined>, getGapClasses);
    const rowGapClasses = rowGap ? getResponsiveClasses(rowGap as ResponsiveValue<SpacingVariant | number | undefined>, getRowGapClasses) : '';
    const colGapClasses = colGap ? getResponsiveClasses(colGap as ResponsiveValue<SpacingVariant | number | undefined>, getColGapClasses) : '';
    const autoFitClasses = autoFit ? getResponsiveClasses(autoFit as ResponsiveValue<'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined>, (val) => getAutoFitClasses(val as 'xs' | 'sm' | 'md' | 'lg' | 'xl')) : '';
    const autoFillClasses = autoFill ? getResponsiveClasses(autoFill as ResponsiveValue<'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined>, (val) => getAutoFillClasses(val as 'xs' | 'sm' | 'md' | 'lg' | 'xl')) : '';
    
    const gridClasses = cn(
      // Base grid styles
      'grid',
      
      // Dense packing
      dense && 'grid-flow-dense',
      
      // Columns (priority: autoFit > autoFill > cols)
      autoFitClasses || autoFillClasses || colsClasses,
      
      // Gap (specific gaps override general gap)
      !rowGap && !colGap && gapClasses,
      rowGapClasses,
      colGapClasses,
      
      // Custom classes
      className
    );

    // Type assertion to avoid complex union type inference
    const ComponentWithProps = Component as React.ElementType;

      return (
      <ComponentWithProps
        ref={ref}
        className={gridClasses}
        data-testid={testId}
        {...(props as React.ComponentPropsWithoutRef<typeof Component>)}
      >
        {children}
      </ComponentWithProps>
    );
  }
);

Grid.displayName = 'Grid';

export default Grid;