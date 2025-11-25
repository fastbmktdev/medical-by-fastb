/**
 * Design System Spacing Tokens
 * 
 * Centralized spacing scale for consistent layout and component spacing.
 * Based on a 4px base unit with logical scaling.
 */

export const spacing = {
  // Base spacing units (4px base)
  0: '0',
  px: '1px',
  0.5: '0.125rem',    // 2px
  1: '0.25rem',       // 4px
  1.5: '0.375rem',    // 6px
  2: '0.5rem',        // 8px
  2.5: '0.625rem',    // 10px
  3: '0.75rem',       // 12px
  3.5: '0.875rem',    // 14px
  4: '1rem',          // 16px
  5: '1.25rem',       // 20px
  6: '1.5rem',        // 24px
  7: '1.75rem',       // 28px
  8: '2rem',          // 32px
  9: '2.25rem',       // 36px
  10: '2.5rem',       // 40px
  11: '2.75rem',      // 44px
  12: '3rem',         // 48px
  14: '3.5rem',       // 56px
  16: '4rem',         // 64px
  20: '5rem',         // 80px
  24: '6rem',         // 96px
  28: '7rem',         // 112px
  32: '8rem',         // 128px
  36: '9rem',         // 144px
  40: '10rem',        // 160px
  44: '11rem',        // 176px
  48: '12rem',        // 192px
  52: '13rem',        // 208px
  56: '14rem',        // 224px
  60: '15rem',        // 240px
  64: '16rem',        // 256px
  72: '18rem',        // 288px
  80: '20rem',        // 320px
  96: '24rem',        // 384px
} as const;

// Semantic spacing for specific use cases
export const semanticSpacing = {
  // Component internal spacing
  component: {
    xs: spacing[1],      // 4px - minimal internal spacing
    sm: spacing[2],      // 8px - small internal spacing
    md: spacing[4],      // 16px - medium internal spacing
    lg: spacing[6],      // 24px - large internal spacing
    xl: spacing[8],      // 32px - extra large internal spacing
  },
  
  // Layout spacing
  layout: {
    xs: spacing[4],      // 16px - minimal layout spacing
    sm: spacing[6],      // 24px - small layout spacing
    md: spacing[8],      // 32px - medium layout spacing
    lg: spacing[12],     // 48px - large layout spacing
    xl: spacing[16],     // 64px - extra large layout spacing
    '2xl': spacing[24],  // 96px - 2x extra large layout spacing
    '3xl': spacing[32],  // 128px - 3x extra large layout spacing
  },
  
  // Container spacing
  container: {
    xs: spacing[4],      // 16px - mobile container padding
    sm: spacing[6],      // 24px - small screen container padding
    md: spacing[8],      // 32px - medium screen container padding
    lg: spacing[12],     // 48px - large screen container padding
    xl: spacing[16],     // 64px - extra large screen container padding
  },
  
  // Form spacing
  form: {
    fieldGap: spacing[4],     // 16px - gap between form fields
    sectionGap: spacing[8],   // 32px - gap between form sections
    labelGap: spacing[2],     // 8px - gap between label and input
    helperGap: spacing[1],    // 4px - gap between input and helper text
  },
  
  // Card spacing
  card: {
    padding: {
      sm: spacing[4],    // 16px - small card padding
      md: spacing[6],    // 24px - medium card padding
      lg: spacing[8],    // 32px - large card padding
    },
    gap: spacing[4],     // 16px - gap between card elements
  },
  
  // Button spacing
  button: {
    padding: {
      sm: `${spacing[2]} ${spacing[3]}`,    // 8px 12px - small button
      md: `${spacing[2.5]} ${spacing[4]}`,  // 10px 16px - medium button
      lg: `${spacing[3]} ${spacing[6]}`,    // 12px 24px - large button
      xl: `${spacing[4]} ${spacing[8]}`,    // 16px 32px - extra large button
    },
    gap: spacing[2],     // 8px - gap between button elements
  },
  
  // Navigation spacing
  navigation: {
    itemGap: spacing[1],      // 4px - gap between nav items
    sectionGap: spacing[6],   // 24px - gap between nav sections
    padding: spacing[4],      // 16px - navigation padding
  },
} as const;

// Responsive spacing breakpoints
export const responsiveSpacing = {
  mobile: {
    container: semanticSpacing.container.xs,
    layout: semanticSpacing.layout.xs,
    component: semanticSpacing.component.sm,
  },
  tablet: {
    container: semanticSpacing.container.sm,
    layout: semanticSpacing.layout.sm,
    component: semanticSpacing.component.md,
  },
  desktop: {
    container: semanticSpacing.container.md,
    layout: semanticSpacing.layout.md,
    component: semanticSpacing.component.lg,
  },
  wide: {
    container: semanticSpacing.container.lg,
    layout: semanticSpacing.layout.lg,
    component: semanticSpacing.component.xl,
  },
} as const;

// Type definitions
export type SpacingTokens = typeof spacing;
export type SpacingValue = keyof SpacingTokens;
export type SemanticSpacing = typeof semanticSpacing;
export type ResponsiveSpacing = typeof responsiveSpacing;

// Helper function to get spacing value
export const getSpacing = (value: SpacingValue): string => {
  return spacing[value];
};

// Helper function to get semantic spacing
export const getSemanticSpacing = (category: keyof SemanticSpacing, size?: string): string => {
  const spacingCategory = semanticSpacing[category];
  if (typeof spacingCategory === 'string') {
    return spacingCategory;
  }
  if (size && typeof spacingCategory === 'object' && size in spacingCategory) {
    return (spacingCategory as Record<string, string>)[size];
  }
  return spacing[4]; // fallback to medium spacing
};

// CSS custom properties mapping
export const spacingVariables = {
  // Base spacing
  '--spacing-0': spacing[0],
  '--spacing-px': spacing.px,
  '--spacing-0-5': spacing[0.5],
  '--spacing-1': spacing[1],
  '--spacing-1-5': spacing[1.5],
  '--spacing-2': spacing[2],
  '--spacing-2-5': spacing[2.5],
  '--spacing-3': spacing[3],
  '--spacing-3-5': spacing[3.5],
  '--spacing-4': spacing[4],
  '--spacing-5': spacing[5],
  '--spacing-6': spacing[6],
  '--spacing-8': spacing[8],
  '--spacing-10': spacing[10],
  '--spacing-12': spacing[12],
  '--spacing-16': spacing[16],
  '--spacing-20': spacing[20],
  '--spacing-24': spacing[24],
  '--spacing-32': spacing[32],
  
  // Semantic spacing
  '--spacing-component-xs': semanticSpacing.component.xs,
  '--spacing-component-sm': semanticSpacing.component.sm,
  '--spacing-component-md': semanticSpacing.component.md,
  '--spacing-component-lg': semanticSpacing.component.lg,
  '--spacing-component-xl': semanticSpacing.component.xl,
  
  '--spacing-layout-xs': semanticSpacing.layout.xs,
  '--spacing-layout-sm': semanticSpacing.layout.sm,
  '--spacing-layout-md': semanticSpacing.layout.md,
  '--spacing-layout-lg': semanticSpacing.layout.lg,
  '--spacing-layout-xl': semanticSpacing.layout.xl,
  '--spacing-layout-2xl': semanticSpacing.layout['2xl'],
  '--spacing-layout-3xl': semanticSpacing.layout['3xl'],
} as const;