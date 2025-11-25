/**
 * Base Component Props and Interfaces
 * 
 * Standardized prop interfaces that all components should extend.
 * Ensures consistency across the component system.
 */

import React from 'react';

/**
 * Base Component Props
 * 
 * Fundamental props that all components should support.
 * Provides accessibility, testing, and styling foundations.
 */
export interface BaseComponentProps {
  /**
   * Additional CSS classes to apply to the component
   */
  className?: string;
  
  /**
   * Test ID for automated testing
   */
  testId?: string;
  
  /**
   * Accessible label for screen readers
   */
  'aria-label'?: string;
  
  /**
   * Accessible description for screen readers
   */
  'aria-describedby'?: string;
  
  /**
   * Custom data attributes
   */
  [key: `data-${string}`]: string | number | boolean | undefined;
}

/**
 * Interactive Component Props
 * 
 * Props for components that users can interact with (buttons, inputs, etc.).
 * Extends BaseComponentProps with interaction-specific properties.
 */
export interface InteractiveProps extends BaseComponentProps {
  /**
   * Whether the component is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether the component is in a loading state
   */
  loading?: boolean;
  
  /**
   * Click handler for interactive elements
   */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  
  /**
   * Focus handler
   */
  onFocus?: (event: React.FocusEvent<HTMLElement>) => void;
  
  /**
   * Blur handler
   */
  onBlur?: (event: React.FocusEvent<HTMLElement>) => void;
  
  /**
   * Keyboard event handler
   */
  onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
  
  /**
   * Whether the component should receive focus automatically
   */
  autoFocus?: boolean;
  
  /**
   * Tab index for keyboard navigation
   */
  tabIndex?: number;
  
  /**
   * ARIA role for accessibility
   */
  role?: string;
  
  /**
   * ARIA pressed state for toggle buttons
   */
  'aria-pressed'?: boolean;
  
  /**
   * ARIA expanded state for collapsible elements
   */
  'aria-expanded'?: boolean;
}

/**
 * Form Component Props
 * 
 * Props for form input components.
 * Extends InteractiveProps with form-specific properties.
 */
export interface FormComponentProps extends InteractiveProps {
  /**
   * Form field name
   */
  name: string;
  
  /**
   * Field label text
   */
  label: string;
  
  /**
   * Error message to display
   */
  error?: string;
  
  /**
   * Helper text to display below the field
   */
  helperText?: string;
  
  /**
   * Whether the field is required
   */
  required?: boolean;
  
  /**
   * Whether the field is read-only
   */
  readOnly?: boolean;
  
  /**
   * Placeholder text
   */
  placeholder?: string;
  
  /**
   * Field value
   */
  value?: string | number | boolean;
  
  /**
   * Default value for uncontrolled components
   */
  defaultValue?: string | number | boolean;
  
  /**
   * Change handler
   */
  onChange?: (value: unknown, event?: React.ChangeEvent<HTMLElement>) => void;
  
  /**
   * Validation handler
   */
  onValidate?: (value: unknown) => string | undefined;
  
  /**
   * Whether to show validation on blur
   */
  validateOnBlur?: boolean;
  
  /**
   * Whether to show validation on change
   */
  validateOnChange?: boolean;
  
  /**
   * Form field ID (auto-generated if not provided)
   */
  id?: string;
  
  /**
   * ARIA invalid state
   */
  'aria-invalid'?: boolean;
  
  /**
   * ARIA required state
   */
  'aria-required'?: boolean;
}

/**
 * Layout Component Props
 * 
 * Props for layout and container components.
 * Extends BaseComponentProps with layout-specific properties.
 */
export interface LayoutComponentProps extends BaseComponentProps {
  /**
   * Child components
   */
  children?: React.ReactNode;
  
  /**
   * Component HTML tag to render
   */
  as?: keyof React.JSX.IntrinsicElements | React.ComponentType<Record<string, unknown>>;
  
  /**
   * Whether to render as a flex container
   */
  flex?: boolean;
  
  /**
   * Flex direction
   */
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  
  /**
   * Flex alignment
   */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  
  /**
   * Flex justification
   */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  
  /**
   * Gap between child elements
   */
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  
  /**
   * Padding size
   */
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Margin size
   */
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Maximum width
   */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full' | 'none';
  
  /**
   * Whether to center the container
   */
  centered?: boolean;
}

/**
 * Feedback Component Props
 * 
 * Props for feedback components (loading, error, empty states).
 * Extends BaseComponentProps with feedback-specific properties.
 */
export interface FeedbackComponentProps extends BaseComponentProps {
  /**
   * Feedback variant/type
   */
  variant?: 'info' | 'success' | 'warning' | 'error';
  
  /**
   * Size of the feedback component
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Title text
   */
  title?: string;
  
  /**
   * Description text
   */
  description?: string;
  
  /**
   * Icon to display
   */
  icon?: React.ReactNode;
  
  /**
   * Action button or element
   */
  action?: React.ReactNode;
  
  /**
   * Whether the feedback can be dismissed
   */
  dismissible?: boolean;
  
  /**
   * Dismiss handler
   */
  onDismiss?: () => void;
}

/**
 * Polymorphic Component Props
 * 
 * Utility type for components that can render as different HTML elements.
 * Provides type safety for the 'as' prop and its corresponding attributes.
 */
export type PolymorphicComponentProps<
  T extends React.ElementType,
  P = Record<string, never>
> = P & 
  Omit<React.ComponentPropsWithoutRef<T>, keyof P> & {
    as?: T;
  };

/**
 * Polymorphic Component Props with Ref
 * 
 * Similar to PolymorphicComponentProps but includes ref forwarding support.
 */
export type PolymorphicComponentPropsWithRef<
  T extends React.ElementType,
  P = Record<string, never>
> = P & 
  Omit<React.ComponentPropsWithRef<T>, keyof P> & {
    as?: T;
  };

/**
 * Component Ref Type
 * 
 * Utility type for getting the correct ref type for a polymorphic component.
 */
export type PolymorphicRef<T extends React.ElementType> = 
  React.ComponentPropsWithRef<T>['ref'];

/**
 * Forwarded Ref Component Type
 * 
 * Type for components that use React.forwardRef with polymorphic props.
 */
export type ForwardedRefComponent<
  T extends React.ElementType,
  P = Record<string, never>
> = React.ForwardRefExoticComponent<
  PolymorphicComponentPropsWithRef<T, P>
>;

// Export commonly used prop combinations
export type ButtonProps = InteractiveProps;
export type InputProps = FormComponentProps;
export type ContainerProps = LayoutComponentProps;
export type AlertProps = FeedbackComponentProps;