/**
 * Design System Patterns
 * 
 * Common patterns and compositions built from primitive components.
 * These provide higher-level abstractions for common UI patterns.
 */

// Re-export compositions for convenience
export * from '../../compositions';

// Pattern utilities and helpers
export const patterns = {
  // Modal patterns
  modal: {
    sizes: ['sm', 'md', 'lg', 'xl', 'full'] as const,
    variants: ['default', 'confirmation', 'form', 'info'] as const,
  },
  
  // Form patterns
  form: {
    layouts: ['vertical', 'horizontal'] as const,
    spacings: ['sm', 'md', 'lg'] as const,
    maxWidths: ['sm', 'md', 'lg', 'xl', 'full'] as const,
  },
  
  // Data display patterns
  data: {
    tableColumns: ['left', 'center', 'right'] as const,
    gridColumns: [1, 2, 3, 4, 5, 6] as const,
    gaps: ['sm', 'md', 'lg'] as const,
  },
  
  // Page patterns
  page: {
    maxWidths: ['sm', 'md', 'lg', 'xl', 'full'] as const,
    backgrounds: ['default', 'gradient', 'pattern'] as const,
  },
  
  // Section patterns
  section: {
    heroLayouts: ['centered', 'left-aligned'] as const,
    featureLayouts: ['grid', 'list'] as const,
    ctaBackgrounds: ['default', 'gradient', 'pattern'] as const,
  },
} as const;