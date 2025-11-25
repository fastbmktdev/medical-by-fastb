/**
 * UI Components
 * 
 * Basic user interface components with design system integration.
 * These components provide the foundation for building more complex interfaces.
 */

// Primary UI Components
export { Button, buttonVariants } from '@/components/design-system/primitives/Button';
export { PageHeader } from './PageHeader';
export { ErrorBoundary, useAsyncError } from './ErrorBoundary';
export { default as FixedBackground } from './FixedBackground';
export { default as Marquee } from './Marquee';

// Type Exports
export type { ButtonProps } from '@/components/design-system/primitives/Button';

// Re-export design system types for convenience
export type {
  BaseComponentProps,
  InteractiveProps,
} from '@/components/design-system/types';