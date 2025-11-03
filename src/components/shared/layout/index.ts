/**
 * Layout Utility Components
 * 
 * Utility components for layout (EmptyState, Loading, etc.)
 * 
 * Note: Primitive layouts (Container, Flex, Grid, Stack) have been moved to:
 * @/components/design-system/primitives
 * 
 * Application layouts (DashboardLayout, AuthLayout) have been moved to:
 * @/components/compositions/layouts
 */

// Utility components that remain in shared/layout
export { default as CenteredLoading } from './CenteredLoading';
export { default as EmptyState } from './EmptyState';

// Re-export primitive layouts from design-system for backward compatibility
export { Container, Flex, Grid, Stack } from '@/components/design-system/primitives';
export type { ContainerProps, FlexProps, GridProps, StackProps } from '@/components/design-system/primitives';

// Re-export application layouts from compositions for backward compatibility
export { DashboardLayout, AuthLayout } from '@/components/compositions/layouts';
export type { MenuItem } from '@/components/compositions/layouts';
export type { AuthLayoutProps } from '@/components/compositions/layouts';

// Re-export layout-related types
export type {
  LayoutComponentProps,
} from '@/components/design-system/types/component-props';

export type {
  ResponsiveValue,
  SpacingVariant,
  AlignmentVariant,
} from '@/components/design-system/types/variants';