/**
 * Shared Components Barrel Export
 * 
 * Optimized for tree-shaking with focused exports.
 * Components are organized by frequency of use and category.
 */

// === MOST COMMONLY USED COMPONENTS ===
// UI Components (exported directly for better tree-shaking)
export { Button, buttonVariants } from '@/components/design-system/primitives/Button';
export { PageHeader } from './ui/PageHeader';

// Form Components (frequently used)
export { BaseInput } from '@/components/design-system/primitives/BaseInput';
export { CustomInput } from './forms/CustomInput';
export { TextInput } from './forms/TextInput';
export { NumberInput } from './forms/NumberInput';
export { CustomSelect } from './forms/CustomSelect';
export { CustomTextarea } from './forms/CustomTextarea';

// Card Components (frequently used)
export { Card, CardHeader, CardContent, CardFooter } from '@/components/design-system/primitives/Card';
export { BaseCard } from './cards/BaseCard';
export { GymCard } from './cards/GymCard';
export { EventCard } from './cards/EventCard';
export { ProductCard } from './cards/ProductCard';

// === LAYOUT COMPONENTS ===
// Application Layouts
export { DashboardLayout, AuthLayout, LayoutWrapper, Header, Footer, SidebarContent } from '@/components/compositions/layouts';

// Primitive Layout Components (from design system)
export { Container, Flex, Grid, Stack } from '@/components/design-system/primitives';
export type { ContainerProps, FlexProps, GridProps, StackProps } from '@/components/design-system/primitives';

// Utility Layout Components
export { default as CenteredLoading } from './layout/CenteredLoading';
export { default as EmptyState } from './layout/EmptyState';

// === FEEDBACK COMPONENTS ===
export { Loading } from '@/components/design-system/primitives/Loading';
export { ErrorDisplay } from './feedback/ErrorDisplay';
export { ErrorBoundary } from './feedback/ErrorBoundary';
export { ErrorBoundary as UIErrorBoundary } from './ui/ErrorBoundary';

// === TYPE EXPORTS ===
// Component Types
export type { ButtonProps } from '@/components/design-system/primitives/Button';
export type { BaseInputProps } from '@/components/design-system/primitives/BaseInput';
export type { CardProps } from '@/components/design-system/primitives/Card';

// Layout Types
export type { MenuItem, AuthLayoutProps } from '@/components/compositions/layouts';

// Re-export commonly used types from design system
export type {
  BaseComponentProps,
  InteractiveProps,
  FormComponentProps,
  LayoutComponentProps,
} from '@/components/design-system/types';
