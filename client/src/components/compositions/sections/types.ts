import { ReactNode } from 'react';
import { BaseComponentProps } from '@/components/design-system/types';

export interface HeroSectionProps extends BaseComponentProps {
  title: string;
  subtitle?: string;
  description?: string;
  actions?: ReactNode;
  backgroundImage?: string;
  overlay?: boolean;
  centered?: boolean;
}

export interface StatItem {
  label: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: ReactNode;
}

export interface StatsSectionProps extends BaseComponentProps {
  title?: string;
  stats: StatItem[];
  columns?: 2 | 3 | 4;
}

export interface FeatureItem {
  title: string;
  description: string;
  icon?: ReactNode;
  image?: string;
}

export interface FeatureSectionProps extends BaseComponentProps {
  title?: string;
  description?: string;
  features: FeatureItem[];
  layout?: 'grid' | 'list';
  columns?: 2 | 3;
}

export interface CTASectionProps extends BaseComponentProps {
  title: string;
  description?: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  backgroundVariant?: 'default' | 'gradient' | 'pattern';
}