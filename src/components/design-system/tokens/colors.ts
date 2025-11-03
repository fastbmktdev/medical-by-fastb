/**
 * Design System Color Tokens
 * 
 * Centralized color palette based on the Muay Thai application's brand identity.
 * These tokens ensure consistent color usage across all components.
 */

export const colors = {
  // Background colors
  background: {
    primary: '#0F0F0F',      // Main background
    secondary: '#3E3636',    // Secondary background
    card: '#1A1A1A',         // Card backgrounds
    overlay: 'rgba(15, 15, 15, 0.8)', // Modal/overlay backgrounds
    elevated: '#262626',     // Elevated surfaces
  },
  
  // Text colors
  text: {
    primary: '#F5EDED',      // Primary text
    secondary: '#A1A1AA',    // Secondary text
    muted: '#71717A',        // Muted text
    inverse: '#0F0F0F',      // Text on light backgrounds
    placeholder: '#6B7280',  // Placeholder text
  },
  
  // Brand colors
  brand: {
    primary: '#D72323',      // Primary brand color (red)
    secondary: '#B91C1C',    // Secondary brand color (darker red)
    accent: '#EF4444',       // Accent color (lighter red)
    light: '#FCA5A5',        // Light brand color
    dark: '#991B1B',         // Dark brand color
  },
  
  // Semantic colors
  semantic: {
    success: '#10B981',      // Success states
    warning: '#F59E0B',      // Warning states
    error: '#EF4444',        // Error states
    info: '#3B82F6',         // Info states
  },
  
  // Neutral colors
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },
  
  // Border colors
  border: {
    default: '#404040',      // Default border
    muted: '#262626',        // Muted border
    focus: '#D72323',        // Focus border
    error: '#EF4444',        // Error border
    success: '#10B981',      // Success border
  },
  
  // Interactive states
  interactive: {
    hover: 'rgba(215, 35, 35, 0.1)',     // Hover overlay
    active: 'rgba(215, 35, 35, 0.2)',    // Active overlay
    focus: 'rgba(215, 35, 35, 0.5)',     // Focus ring
    disabled: 'rgba(113, 113, 122, 0.5)', // Disabled overlay
  },
} as const;

// Type for color tokens
export type ColorTokens = typeof colors;
export type ColorPath = keyof ColorTokens;
export type ColorValue<T extends ColorPath> = ColorTokens[T];

// Helper function to get color value by path
export const getColor = <T extends ColorPath>(path: T): ColorTokens[T] => {
  return colors[path];
};

// CSS custom properties mapping
export const colorVariables = {
  '--color-background-primary': colors.background.primary,
  '--color-background-secondary': colors.background.secondary,
  '--color-background-card': colors.background.card,
  '--color-background-overlay': colors.background.overlay,
  '--color-background-elevated': colors.background.elevated,
  
  '--color-text-primary': colors.text.primary,
  '--color-text-secondary': colors.text.secondary,
  '--color-text-muted': colors.text.muted,
  '--color-text-inverse': colors.text.inverse,
  '--color-text-placeholder': colors.text.placeholder,
  
  '--color-brand-primary': colors.brand.primary,
  '--color-brand-secondary': colors.brand.secondary,
  '--color-brand-accent': colors.brand.accent,
  '--color-brand-light': colors.brand.light,
  '--color-brand-dark': colors.brand.dark,
  
  '--color-semantic-success': colors.semantic.success,
  '--color-semantic-warning': colors.semantic.warning,
  '--color-semantic-error': colors.semantic.error,
  '--color-semantic-info': colors.semantic.info,
  
  '--color-border-default': colors.border.default,
  '--color-border-muted': colors.border.muted,
  '--color-border-focus': colors.border.focus,
  '--color-border-error': colors.border.error,
  '--color-border-success': colors.border.success,
} as const;