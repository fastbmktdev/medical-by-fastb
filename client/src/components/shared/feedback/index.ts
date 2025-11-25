/**
 * Feedback Components
 * 
 * Components for providing user feedback including loading states, errors, and empty states.
 */

// Error components
export { default as ErrorDisplay, type ErrorDisplayProps } from './ErrorDisplay';
export { 
  default as ErrorBoundary, 
  type ErrorBoundaryProps, 
  type ErrorFallbackProps,
  useAsyncError,
  withErrorBoundary,
  useErrorBoundary
} from './ErrorBoundary';

// Re-export feedback-related types
export type {
  FeedbackComponentProps,
} from '@/components/design-system/types/component-props';

export type {
  ComponentSize,
} from '@/components/design-system/types/variants';