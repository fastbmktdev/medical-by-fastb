/**
 * Design System
 * 
 * Main entry point for the Medical application design system.
 * Exports all design tokens, components, types, and utilities.
 */

// Design Tokens - Import for internal use
import { tokens, cssVariables } from './tokens';

// Design Tokens - Specific exports for better tree-shaking
export { 
  tokens, 
  colors, 
  typography, 
  spacing, 
  animations,
  cssVariables,
  colorVariables,
  typographyVariables,
  spacingVariables,
  animationVariables,
} from './tokens';

export type {
  DesignTokens,
  CSSVariables,
} from './tokens';

// Theme Provider and Context - Specific exports
export {
  ThemeProvider,
  useTheme,
  withTheme,
  ThemeConsumer,
  ThemeContext,
} from './ThemeProvider';

export type {
  ThemeContextValue,
  ThemeProviderProps,
} from './ThemeProvider';

// Types and Interfaces - Specific exports
export type {
  BaseComponentProps,
  InteractiveProps,
  FormComponentProps,
  LayoutComponentProps,
  FeedbackComponentProps,
  ComponentSize,
  ComponentColor,
  ComponentVariant,
  ResponsiveValue,
  ValidationResult,
  ValidationSchema,
} from './types';

export {
  validateComponentProps,
  validators,
} from './types';

// Primitive Components - Specific exports
export {
  Button,
  buttonVariants,
  BaseInput,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Container,
  Loading,
} from './primitives';

// Patterns and Compositions - Specific exports
export {
  createLazyComponent,
  createPreloadableLazyComponent,
  LazyCompositions,
  PreloadableCompositions,
  createMemoComponent,
  performance,
  migrationUtils,
  createOptimizedExports,
  bundleAnalysis,
} from './utils';



// Design System Version
export const DESIGN_SYSTEM_VERSION = '1.0.0';

// Design System Configuration
export const designSystemConfig = {
  version: DESIGN_SYSTEM_VERSION,
  name: 'Medical Design System',
  description: 'Comprehensive design system for the Medical application',
  tokens: {
    colors: Object.keys(tokens.colors).length,
    typography: Object.keys(tokens.typography.fontSize).length,
    spacing: Object.keys(tokens.spacing).length,
    animations: Object.keys(tokens.animations.duration).length,
  },
} as const;

// Development utilities
export const devUtils = {
  /**
   * Log design system information to console
   */
  logInfo: () => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🎨 Design System Info');
      console.log('Version:', designSystemConfig.version);
      console.log('Name:', designSystemConfig.name);
      console.log('Tokens:', designSystemConfig.tokens);
      console.groupEnd();
    }
  },
  
  /**
   * Validate design system setup
   */
  validateSetup: () => {
    if (process.env.NODE_ENV === 'development') {
      const issues: string[] = [];
      
      // Check if CSS variables are available
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        const primaryColor = getComputedStyle(root).getPropertyValue('--color-brand-primary');
        
        if (!primaryColor) {
          issues.push('CSS variables not found. Make sure ThemeProvider is wrapping your app.');
        }
      }
      
      if (issues.length > 0) {
        console.warn('🚨 Design System Setup Issues:');
        issues.forEach(issue => console.warn(`- ${issue}`));
      } else {
        console.log('✅ Design System setup looks good!');
      }
    }
  },
  
  /**
   * Get available design tokens
   */
  getTokens: () => tokens,
  
  /**
   * Get CSS variables
   */
  getCSSVariables: () => cssVariables,
} as const;

// Export development utilities only in development
export const dev = process.env.NODE_ENV === 'development' ? devUtils : undefined;