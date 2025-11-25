import { ReactNode } from 'react';
import { BaseComponentProps } from '@/components/design-system/types';

export interface PageLayoutProps extends BaseComponentProps {
  title?: string;
  description?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
  background?: 'default' | 'gradient' | 'pattern';
}

export interface DashboardPageProps extends BaseComponentProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  loading?: boolean;
  error?: string;
}

export interface AuthPageProps extends BaseComponentProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  showLogo?: boolean;
  backgroundImage?: string;
}