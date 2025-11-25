/**
 * Centralized icon management for optimized imports and tree-shaking
 * This module provides dynamic imports and consolidated icon access
 */

import { ComponentType, SVGProps } from 'react';

// Type for icon components
export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

// Commonly used icons - these will be statically imported for better performance
export {
  // Navigation and UI
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronRightIcon,
  XMarkIcon,
  HomeIcon,
  
  // Actions
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  
  // Status and feedback
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  XCircleIcon,
  
  // User and profile
  UserGroupIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
  
  // Commerce and payments
  CreditCardIcon,
  ShoppingCartIcon,
  
  // Location and maps
  MapPinIcon,
  
  // Communication
  EnvelopeIcon,
  PhoneIcon,
  PaperAirplaneIcon,
  
  // Media and content
  ShareIcon,
  BookmarkIcon,
  StarIcon,
  HeartIcon,
  
  // Business and analytics
  ChartBarIcon,
  DocumentTextIcon,
  DocumentChartBarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowDownTrayIcon,
  
  // Security and verification
  EyeSlashIcon,
  LockClosedIcon,
  
  // Miscellaneous
  SparklesIcon,
  TrophyIcon,
  GiftIcon,
  TruckIcon,
  BellIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  ListBulletIcon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline';

// Solid icons (used less frequently)
export {
  StarIcon as StarSolidIcon,
  HeartIcon as HeartSolidIcon,
} from '@heroicons/react/24/solid';

// Dynamic import functions for heavy or rarely used icon sets
export const loadHeroIconsOutline = async (iconName: string): Promise<IconComponent | undefined> => {
  const icons = await import('@heroicons/react/24/outline');
  return (icons as unknown as Record<string, IconComponent>)[iconName];
};

export const loadHeroIconsSolid = async (iconName: string): Promise<IconComponent | undefined> => {
  const icons = await import('@heroicons/react/24/solid');
  return (icons as unknown as Record<string, IconComponent>)[iconName];
};

// Lucide icons removed - using @heroicons only
// export const loadLucideIcon = async (iconName: string): Promise<IconComponent | undefined> => {
//   const icons = await import('lucide-react');
//   return (icons as unknown as Record<string, IconComponent>)[iconName];
// };

// Icon registry for dynamic loading
export const IconRegistry = {
  heroicons: {
    outline: loadHeroIconsOutline,
    solid: loadHeroIconsSolid,
  },
  // lucide: loadLucideIcon, // Removed
};

// Utility function to get icon with fallback
export const getIcon = async (
  library: 'heroicons',
  variant: 'outline' | 'solid' = 'outline',
  iconName: string
): Promise<IconComponent | null> => {
  try {
    if (library === 'heroicons') {
      const icon = await IconRegistry.heroicons[variant](iconName);
      return icon || null;
    }
    return null;
  } catch (error) {
    console.warn(`Failed to load icon: ${library}/${variant}/${iconName}`, error);
    return null;
  }
};

// Common icon combinations for specific use cases
export const IconSets = {
  navigation: [
    'ArrowLeftIcon',
    'ArrowRightIcon',
    'ChevronDownIcon',
    'ChevronUpIcon',
    'ChevronRightIcon',
    'HomeIcon',
  ],
  forms: [
    'EyeIcon',
    'EyeSlashIcon',
    'MagnifyingGlassIcon',
    'XMarkIcon',
    'CheckCircleIcon',
  ],
  status: [
    'CheckCircleIcon',
    'ExclamationTriangleIcon',
    'InformationCircleIcon',
    'ClockIcon',
    'XCircleIcon',
  ],
  actions: [
    'PlusCircleIcon',
    'MinusCircleIcon',
    'TrashIcon',
    'PencilIcon',
    'EyeIcon',
  ],
} as const;