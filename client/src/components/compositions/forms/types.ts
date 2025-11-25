import { ReactNode } from 'react';
import { BaseComponentProps } from '@/components/design-system/types';

export interface FormLayoutProps extends BaseComponentProps {
  title?: string;
  description?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  spacing?: 'sm' | 'md' | 'lg';
}

export interface FormSectionProps extends BaseComponentProps {
  title?: string;
  description?: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface FormFieldProps extends BaseComponentProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  layout?: 'vertical' | 'horizontal';
}

export interface FormActionsProps extends BaseComponentProps {
  children: ReactNode;
  align?: 'left' | 'center' | 'right' | 'between';
  sticky?: boolean;
  spacing?: 'sm' | 'md' | 'lg';
}