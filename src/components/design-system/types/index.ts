/**
 * Design System Types
 * 
 * Centralized export of all design system types and interfaces.
 * Provides type safety and consistency across the component system.
 */

// Component Props and Interfaces
export * from './component-props';
export * from './variants';
export * from './validation';

// Re-export commonly used types for convenience
export type {
  BaseComponentProps,
  InteractiveProps,
  FormComponentProps,
  LayoutComponentProps,
  FeedbackComponentProps,
  PolymorphicComponentProps,
  PolymorphicComponentPropsWithRef,
  PolymorphicRef,
  ForwardedRefComponent,
  ButtonProps,
  InputProps,
  ContainerProps,
  AlertProps,
} from './component-props';

export type {
  ComponentSize,
  ComponentColor,
  ComponentVariant,
  ComponentRadius,
  ComponentShadow,
  Breakpoint,
  ResponsiveValue,
  ComponentVariantsConfig,
  VariantProps,
  ComponentWithVariants,
  ThemeVariant,
  AnimationVariant,
  LoadingVariant,
  PlacementVariant,
  OrientationVariant,
  AlignmentVariant,
  SpacingVariant,
  StateVariant,
  DensityVariant,
  SizeVariantProp,
  ColorVariantProp,
  VisualVariantProp,
  RadiusVariantProp,
  ShadowVariantProp,
  SpacingVariantProp,
} from './variants';

export type {
  ValidationResult,
  ValidationRule,
  ValidationSchema,
} from './validation';

export {
  validateComponentProps,
  validators,
  required,
  oneOf,
  ofType,
  arrayOf,
  shape,
  minMax,
  stringLength,
  custom,
  deprecated,
  when,
} from './validation';

// Utility types for common patterns
export type WithChildren<T = {}> = T & {
  children?: React.ReactNode;
};

export type WithClassName<T = {}> = T & {
  className?: string;
};

export type WithTestId<T = {}> = T & {
  testId?: string;
};

export type WithLoading<T = {}> = T & {
  loading?: boolean;
};

export type WithDisabled<T = {}> = T & {
  disabled?: boolean;
};

export type WithVariant<T extends string = string> = {
  variant?: T;
};

export type WithSize<T extends string = ComponentSize> = {
  size?: T;
};

export type WithColor<T extends string = ComponentColor> = {
  color?: T;
};

// Event handler types
export type ClickHandler = (event: React.MouseEvent<HTMLElement>) => void;
export type ChangeHandler<T = any> = (value: T, event?: React.ChangeEvent<HTMLElement>) => void;
export type FocusHandler = (event: React.FocusEvent<HTMLElement>) => void;
export type BlurHandler = (event: React.FocusEvent<HTMLElement>) => void;
export type KeyboardHandler = (event: React.KeyboardEvent<HTMLElement>) => void;

// Common component state types
export type ComponentState = 'idle' | 'loading' | 'success' | 'error';
export type ValidationState = 'valid' | 'invalid' | 'pending';
export type InteractionState = 'default' | 'hover' | 'active' | 'focus' | 'disabled';

// Accessibility types
export type AriaRole = React.AriaRole;
export type AriaAttributes = React.AriaAttributes;

// Style-related types
export type CSSProperties = React.CSSProperties;
export type ClassName = string | undefined;
export type StyleProp = CSSProperties | undefined;

// Component composition types
export type ComponentFactory<P = {}> = (props: P) => React.ReactElement;
export type ComponentRenderer<P = {}> = (props: P) => React.ReactNode;

// Forward ref component type helper
export type ForwardRefComponent<T, P = {}> = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<P> & React.RefAttributes<T>
>;

// Generic component props with ref
export type ComponentPropsWithRef<T extends React.ElementType> = 
  React.ComponentPropsWithRef<T>;

// Generic component props without ref
export type ComponentPropsWithoutRef<T extends React.ElementType> = 
  React.ComponentPropsWithoutRef<T>;

// Element type constraint
export type ElementType = keyof JSX.IntrinsicElements | React.ComponentType<any>;

// Render prop types
export type RenderProp<T = {}> = (props: T) => React.ReactNode;
export type ChildrenRenderProp<T = {}> = {
  children: RenderProp<T>;
};

// Component display name type
export type ComponentDisplayName = string;

// Component with display name
export type ComponentWithDisplayName<T = React.ComponentType<any>> = T & {
  displayName?: ComponentDisplayName;
};

// Default props type
export type DefaultProps<T = {}> = Partial<T>;

// Component with default props
export type ComponentWithDefaults<P, D extends Partial<P>> = React.ComponentType<P> & {
  defaultProps?: D;
};

// Slot-based component types (for compound components)
export type SlotProps<T = {}> = T & {
  slot?: string;
};

export type CompoundComponent<T = {}> = React.ComponentType<T> & {
  [key: string]: React.ComponentType<any>;
};

// Theme-aware component types
export type ThemedComponent<T = {}> = T & {
  theme?: 'light' | 'dark' | 'auto';
};

// Responsive component types
export type ResponsiveComponent<T = {}> = T & {
  responsive?: boolean;
};

// Animation-aware component types
export type AnimatedComponent<T = {}> = T & {
  animated?: boolean;
  animation?: AnimationVariant;
};

// Virtualized component types (for large lists)
export type VirtualizedComponent<T = {}> = T & {
  virtualized?: boolean;
  itemHeight?: number;
  overscan?: number;
};

// Async component types
export type AsyncComponent<T = {}> = T & {
  loading?: boolean;
  error?: Error | string;
  retry?: () => void;
};