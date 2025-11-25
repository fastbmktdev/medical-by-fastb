/**
 * Design System Primitive Types
 * 
 * Type definitions specific to primitive components.
 * These extend the base design system types with component-specific properties.
 */

import type { BaseInputProps } from './BaseInput';
import type { CardProps, CardHeaderProps, CardContentProps, CardFooterProps } from './Card';

// Input Types
export type { BaseInputProps };

export interface TextInputProps extends Omit<BaseInputProps, 'type'> {
  type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'search';
  showPasswordToggle?: boolean;
}

export interface NumberInputProps extends Omit<BaseInputProps, 'type'> {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
}

export interface SelectInputProps extends Omit<BaseInputProps, 'type'> {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  multiple?: boolean;
}

export interface TextareaInputProps extends Omit<BaseInputProps, 'type'> {
  rows?: number;
  cols?: number;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}

// Card Types
export type { CardProps, CardHeaderProps, CardContentProps, CardFooterProps };

// Layout Types
export interface ContainerProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
  centered?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export interface GridProps {
  cols?: number | 'auto';
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export interface StackProps {
  direction?: 'vertical' | 'horizontal';
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  children?: React.ReactNode;
  className?: string;
}

export interface FlexProps {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  children?: React.ReactNode;
  className?: string;
}

// Feedback Types
export interface LoadingProps {
  variant?: 'spinner' | 'skeleton' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export interface ErrorDisplayProps {
  error: Error | string;
  retry?: () => void;
  variant?: 'inline' | 'card' | 'page';
  className?: string;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}