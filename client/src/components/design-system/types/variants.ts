/**
 * Component Variant Types
 * 
 * Utility types for creating consistent component variants and responsive values.
 * Supports type-safe variant definitions and responsive design patterns.
 */

/**
 * Component Size Variants
 * 
 * Standard size scale used across components.
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Component Color Variants
 * 
 * Standard color variants based on the design system.
 */
export type ComponentColor = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info' 
  | 'neutral';

/**
 * Component Visual Variants
 * 
 * Common visual styles used across components.
 */
export type ComponentVariant = 
  | 'solid' 
  | 'outline' 
  | 'ghost' 
  | 'link' 
  | 'subtle';

/**
 * Component Radius Variants
 * 
 * Border radius options for components.
 */
export type ComponentRadius = 
  | 'none' 
  | 'sm' 
  | 'md' 
  | 'lg' 
  | 'xl' 
  | 'full';

/**
 * Component Shadow Variants
 * 
 * Box shadow options for components.
 */
export type ComponentShadow = 
  | 'none' 
  | 'sm' 
  | 'md' 
  | 'lg' 
  | 'xl' 
  | '2xl';

/**
 * Responsive Breakpoints
 * 
 * Breakpoint names for responsive design.
 */
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Responsive Value Type
 * 
 * Allows values to be responsive across different breakpoints.
 * Can be a single value or an object with breakpoint-specific values.
 * 
 * @example
 * ```tsx
 * // Single value
 * const size: ResponsiveValue<ComponentSize> = 'md';
 * 
 * // Responsive values
 * const responsiveSize: ResponsiveValue<ComponentSize> = {
 *   sm: 'sm',
 *   md: 'md',
 *   lg: 'lg'
 * };
 * ```
 */
export type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

/**
 * Component Variants Configuration
 * 
 * Type for defining component variant configurations.
 * Used with class-variance-authority or similar variant systems.
 * 
 * @example
 * ```tsx
 * const buttonVariants: ComponentVariantsConfig = {
 *   size: {
 *     sm: 'px-3 py-1.5 text-sm',
 *     md: 'px-4 py-2 text-base',
 *     lg: 'px-6 py-3 text-lg'
 *   },
 *   variant: {
 *     solid: 'bg-primary text-zinc-950',
 *     outline: 'border border-primary text-primary'
 *   }
 * };
 * ```
 */
export type ComponentVariantsConfig = Record<string, Record<string, string>>;

/**
 * Variant Props Type
 * 
 * Utility type for extracting variant props from a variants configuration.
 * Automatically generates the correct prop types based on variant definitions.
 */
export type VariantProps<T extends ComponentVariantsConfig> = {
  [K in keyof T]?: keyof T[K] | ResponsiveValue<keyof T[K]>;
};

/**
 * Component With Variants Type
 * 
 * Utility type for components that support variants.
 * Combines base props with variant props.
 * 
 * @example
 * ```tsx
 * interface ButtonProps extends ComponentWithVariants<typeof buttonVariants> {
 *   children: React.ReactNode;
 *   onClick?: () => void;
 * }
 * ```
 */
export type ComponentWithVariants<
  T extends ComponentVariantsConfig,
  P = Record<string, never>
> = P & VariantProps<T>;

/**
 * Theme Variant Type
 * 
 * Type for components that can adapt to different themes.
 */
export type ThemeVariant = 'light' | 'dark' | 'auto';

/**
 * Animation Variant Type
 * 
 * Type for components that support different animation styles.
 */
export type AnimationVariant = 
  | 'none' 
  | 'fade' 
  | 'slide' 
  | 'scale' 
  | 'bounce' 
  | 'spring';

/**
 * Loading Variant Type
 * 
 * Type for different loading state presentations.
 */
export type LoadingVariant = 
  | 'spinner' 
  | 'dots' 
  | 'pulse' 
  | 'skeleton' 
  | 'progress';

/**
 * Placement Variant Type
 * 
 * Type for positioning components like tooltips, popovers, etc.
 */
export type PlacementVariant = 
  | 'top' 
  | 'top-start' 
  | 'top-end'
  | 'bottom' 
  | 'bottom-start' 
  | 'bottom-end'
  | 'left' 
  | 'left-start' 
  | 'left-end'
  | 'right' 
  | 'right-start' 
  | 'right-end';

/**
 * Orientation Variant Type
 * 
 * Type for components that can be oriented horizontally or vertically.
 */
export type OrientationVariant = 'horizontal' | 'vertical';

/**
 * Alignment Variant Type
 * 
 * Type for content alignment options.
 */
export type AlignmentVariant = 
  | 'start' 
  | 'center' 
  | 'end' 
  | 'justify' 
  | 'stretch';

/**
 * Spacing Variant Type
 * 
 * Type for spacing options using semantic spacing tokens.
 */
export type SpacingVariant = 
  | 'none' 
  | 'xs' 
  | 'sm' 
  | 'md' 
  | 'lg' 
  | 'xl' 
  | '2xl' 
  | '3xl';

/**
 * State Variant Type
 * 
 * Type for component states.
 */
export type StateVariant = 
  | 'default' 
  | 'hover' 
  | 'active' 
  | 'focus' 
  | 'disabled' 
  | 'loading' 
  | 'error' 
  | 'success';

/**
 * Density Variant Type
 * 
 * Type for component density/compactness.
 */
export type DensityVariant = 'compact' | 'normal' | 'comfortable';

/**
 * Helper type for creating variant unions
 * 
 * Creates a union type from variant configuration keys.
 */
export type VariantUnion<T extends ComponentVariantsConfig, K extends keyof T> = keyof T[K];

/**
 * Helper type for creating responsive variant props
 * 
 * Creates responsive props for a specific variant.
 */
export type ResponsiveVariantProp<T extends ComponentVariantsConfig, K extends keyof T> = 
  ResponsiveValue<VariantUnion<T, K>>;

// Common variant combinations for reuse
export type SizeVariantProp = ResponsiveValue<ComponentSize>;
export type ColorVariantProp = ResponsiveValue<ComponentColor>;
export type VisualVariantProp = ResponsiveValue<ComponentVariant>;
export type RadiusVariantProp = ResponsiveValue<ComponentRadius>;
export type ShadowVariantProp = ResponsiveValue<ComponentShadow>;
export type SpacingVariantProp = ResponsiveValue<SpacingVariant>;