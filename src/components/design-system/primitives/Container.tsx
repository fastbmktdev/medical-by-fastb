"use client";

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { LayoutComponentProps } from '@/components/design-system/types/component-props';
import { ResponsiveValue } from '@/components/design-system/types/variants';

/**
 * Container Props
 * 
 * Props for the Container component with responsive max-width and padding options.
 */
export interface ContainerProps extends Omit<LayoutComponentProps, 'padding' | 'maxWidth'> {
  /**
   * Maximum width of the container
   */
  maxWidth?: ResponsiveValue<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full' | 'none'>;
  
  /**
   * Whether to center the container horizontally
   */
  centered?: boolean;
  
  /**
   * Responsive padding options
   */
  padding?: ResponsiveValue<'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'>;
  
  /**
   * Whether to apply fluid width (100% width with max-width constraint)
   */
  fluid?: boolean;
}

/**
 * Get max-width classes based on size
 */
const getMaxWidthClasses = (maxWidth: string): string => {
  const maxWidthMap: Record<string, string> = {
    'xs': 'max-w-xs',      // 320px
    'sm': 'max-w-sm',      // 384px
    'md': 'max-w-md',      // 448px
    'lg': 'max-w-lg',      // 512px
    'xl': 'max-w-xl',      // 576px
    '2xl': 'max-w-2xl',    // 672px
    '3xl': 'max-w-3xl',    // 768px
    '4xl': 'max-w-4xl',    // 896px
    '5xl': 'max-w-5xl',    // 1024px
    '6xl': 'max-w-6xl',    // 1152px
    '7xl': 'max-w-7xl',    // 1280px
    'full': 'max-w-full',  // 100%
    'none': 'max-w-none',  // none
  };
  
  return maxWidthMap[maxWidth] || 'max-w-7xl';
};

/**
 * Get padding classes based on size
 */
const getPaddingClasses = (padding: string): string => {
  const paddingMap: Record<string, string> = {
    'none': 'p-0',
    'xs': 'px-4 py-2',      // 16px horizontal, 8px vertical
    'sm': 'px-6 py-3',      // 24px horizontal, 12px vertical
    'md': 'px-8 py-4',      // 32px horizontal, 16px vertical
    'lg': 'px-12 py-6',     // 48px horizontal, 24px vertical
    'xl': 'px-16 py-8',     // 64px horizontal, 32px vertical
  };
  
  return paddingMap[padding] || 'px-8 py-4';
};

/**
 * Get responsive classes for a responsive value
 */
const getResponsiveClasses = <T extends string>(
  value: ResponsiveValue<T>,
  getClasses: (val: T) => string,
  prefix: string = ''
): string => {
  if (typeof value === 'string') {
    return getClasses(value);
  }
  
  if (typeof value === 'object' && value !== null) {
    const classes: string[] = [];
    
    // Base value (mobile-first)
    if (value.sm) classes.push(getClasses(value.sm));
    
    // Responsive breakpoints
    if (value.md) classes.push(`md:${getClasses(value.md).replace(prefix, '')}`);
    if (value.lg) classes.push(`lg:${getClasses(value.lg).replace(prefix, '')}`);
    if (value.xl) classes.push(`xl:${getClasses(value.xl).replace(prefix, '')}`);
    if (value['2xl']) classes.push(`2xl:${getClasses(value['2xl']).replace(prefix, '')}`);
    
    return classes.join(' ');
  }
  
  return '';
};

/**
 * Container Component
 * 
 * A responsive container component with configurable max-width and padding.
 * Provides consistent spacing and centering across different screen sizes.
 */
export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      children,
      className,
      maxWidth = '7xl',
      centered = true,
      padding = 'md',
      fluid = true,
      as,
      testId,
      ...props
    },
    ref
  ) => {
    const Component = (as || 'div') as keyof React.JSX.IntrinsicElements;
    // Generate responsive classes
    const maxWidthClasses = getResponsiveClasses(maxWidth, getMaxWidthClasses);
    const paddingClasses = getResponsiveClasses(padding, getPaddingClasses);
    
    const containerClasses = cn(
      // Base container styles
      'container',
      
      // Width and centering
      fluid && 'w-full',
      centered && 'mx-auto',
      
      // Responsive max-width
      maxWidthClasses,
      
      // Responsive padding
      paddingClasses,
      
      // Custom classes
      className
    );

    // Type assertion to avoid complex union type inference
    // Cast props to any to bypass TypeScript's complex union type calculation
    const componentProps = {
      ref,
      className: containerClasses,
      'data-testid': testId,
      ...props,
    } as any;

    return React.createElement(Component, componentProps, children);
  }
);

Container.displayName = 'Container';