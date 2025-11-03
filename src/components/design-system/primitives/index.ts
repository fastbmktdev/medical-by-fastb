/**
 * Design System Primitives
 * 
 * Base UI primitives that form the foundation of the design system.
 * These components are built with design tokens and provide consistent
 * styling, behavior, and accessibility features.
 */

// Button Primitives
export { Button, buttonVariants } from './Button';
export type { ButtonProps } from './Button';

// Input Primitives
export { BaseInput } from './BaseInput';
export type { BaseInputProps } from './BaseInput';

// Card Primitives
export { Card, CardHeader, CardContent, CardFooter } from './Card';
export type { CardProps, CardHeaderProps, CardContentProps, CardFooterProps } from './Card';

// Layout Primitives
export { Container } from './Container';
export type { ContainerProps } from './Container';
export { Flex } from './Flex';
export type { FlexProps } from './Flex';
export { Grid } from './Grid';
export type { GridProps } from './Grid';
export { Stack } from './Stack';
export type { StackProps } from './Stack';

// Feedback Primitives
export { Loading } from './Loading';
export type { LoadingProps } from './Loading';

// Re-export design system types for primitives
export type {
  BaseComponentProps,
  InteractiveProps,
  FormComponentProps,
  LayoutComponentProps,
  FeedbackComponentProps,
} from '../types';