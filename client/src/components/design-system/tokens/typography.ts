/**
 * Design System Typography Tokens
 * 
 * Centralized typography scale and font configuration.
 * Based on the Bai Jamjuree font family used in the application.
 */

export const typography = {
  // Font families
  fontFamily: {
    primary: 'var(--font-bai-jamjuree), system-ui, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  
  // Font sizes with line heights
  fontSize: {
    xs: {
      size: '0.75rem',      // 12px
      lineHeight: '1rem',   // 16px
    },
    sm: {
      size: '0.875rem',     // 14px
      lineHeight: '1.25rem', // 20px
    },
    base: {
      size: '1rem',         // 16px
      lineHeight: '1.5rem', // 24px
    },
    lg: {
      size: '1.125rem',     // 18px
      lineHeight: '1.75rem', // 28px
    },
    xl: {
      size: '1.25rem',      // 20px
      lineHeight: '1.75rem', // 28px
    },
    '2xl': {
      size: '1.5rem',       // 24px
      lineHeight: '2rem',   // 32px
    },
    '3xl': {
      size: '1.875rem',     // 30px
      lineHeight: '2.25rem', // 36px
    },
    '4xl': {
      size: '2.25rem',      // 36px
      lineHeight: '2.5rem', // 40px
    },
    '5xl': {
      size: '3rem',         // 48px
      lineHeight: '1',      // 48px
    },
    '6xl': {
      size: '3.75rem',      // 60px
      lineHeight: '1',      // 60px
    },
  },
  
  // Font weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  
  // Text styles for common use cases
  textStyles: {
    // Headings
    h1: {
      fontSize: '3rem',
      lineHeight: '1',
      fontWeight: '700',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '2.25rem',
      lineHeight: '2.5rem',
      fontWeight: '600',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.875rem',
      lineHeight: '2.25rem',
      fontWeight: '600',
    },
    h4: {
      fontSize: '1.5rem',
      lineHeight: '2rem',
      fontWeight: '600',
    },
    h5: {
      fontSize: '1.25rem',
      lineHeight: '1.75rem',
      fontWeight: '600',
    },
    h6: {
      fontSize: '1.125rem',
      lineHeight: '1.75rem',
      fontWeight: '600',
    },
    
    // Body text
    body: {
      fontSize: '1rem',
      lineHeight: '1.5rem',
      fontWeight: '400',
    },
    bodyLarge: {
      fontSize: '1.125rem',
      lineHeight: '1.75rem',
      fontWeight: '400',
    },
    bodySmall: {
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      fontWeight: '400',
    },
    
    // UI text
    button: {
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      fontWeight: '600',
      letterSpacing: '0.025em',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: '1rem',
      fontWeight: '400',
    },
    label: {
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      fontWeight: '500',
    },
    overline: {
      fontSize: '0.75rem',
      lineHeight: '1rem',
      fontWeight: '600',
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
    },
  },
} as const;

// Type definitions
export type TypographyTokens = typeof typography;
export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type TextStyle = keyof typeof typography.textStyles;

// Helper function to get font size with line height
export const getFontSize = (size: FontSize) => {
  const { size: fontSize, lineHeight } = typography.fontSize[size];
  return { fontSize, lineHeight };
};

// Helper function to get text style
export const getTextStyle = (style: TextStyle) => {
  return typography.textStyles[style];
};

// CSS custom properties mapping
export const typographyVariables = {
  '--font-family-primary': typography.fontFamily.primary,
  '--font-family-mono': typography.fontFamily.mono,
  '--font-family-system': typography.fontFamily.system,
  
  // Font sizes
  '--font-size-xs': typography.fontSize.xs.size,
  '--font-size-sm': typography.fontSize.sm.size,
  '--font-size-base': typography.fontSize.base.size,
  '--font-size-lg': typography.fontSize.lg.size,
  '--font-size-xl': typography.fontSize.xl.size,
  '--font-size-2xl': typography.fontSize['2xl'].size,
  '--font-size-3xl': typography.fontSize['3xl'].size,
  '--font-size-4xl': typography.fontSize['4xl'].size,
  '--font-size-5xl': typography.fontSize['5xl'].size,
  '--font-size-6xl': typography.fontSize['6xl'].size,
  
  // Line heights
  '--line-height-xs': typography.fontSize.xs.lineHeight,
  '--line-height-sm': typography.fontSize.sm.lineHeight,
  '--line-height-base': typography.fontSize.base.lineHeight,
  '--line-height-lg': typography.fontSize.lg.lineHeight,
  '--line-height-xl': typography.fontSize.xl.lineHeight,
  '--line-height-2xl': typography.fontSize['2xl'].lineHeight,
  '--line-height-3xl': typography.fontSize['3xl'].lineHeight,
  '--line-height-4xl': typography.fontSize['4xl'].lineHeight,
  '--line-height-5xl': typography.fontSize['5xl'].lineHeight,
  '--line-height-6xl': typography.fontSize['6xl'].lineHeight,
} as const;