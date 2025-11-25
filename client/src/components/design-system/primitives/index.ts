/**
 * Design System Primitives
 *
 * Central export for design system base UI primitives.
 */

// Button
export { Button, buttonVariants } from './Button';
export type { ButtonProps } from './Button';

// Input
export { BaseInput } from './BaseInput';
export type { BaseInputProps } from './BaseInput';

// Card
export {
  Card,
  CardHeader,
  CardContent,
  CardFooter
} from './Card';
export type {
  CardProps,
  CardHeaderProps,
  CardContentProps,
  CardFooterProps
} from './Card';

// Layout
export { Container } from './Container';
export type { ContainerProps } from './Container';
export { Flex } from './Flex';
export type { FlexProps } from './Flex';
export { Grid } from './Grid';
export type { GridProps } from './Grid';
export { Stack } from './Stack';
export type { StackProps } from './Stack';

// Feedback
export { Loading } from './Loading';
export type { LoadingProps } from './Loading';

// Skeleton
export {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonForm,
  SkeletonDashboard
} from './Skeleton';
export type { SkeletonProps } from './Skeleton';

// Types
export type {
  BaseComponentProps,
  InteractiveProps,
  FormComponentProps,
  LayoutComponentProps,
  FeedbackComponentProps
} from '../types';