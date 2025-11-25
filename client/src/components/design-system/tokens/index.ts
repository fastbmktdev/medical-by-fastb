/**
 * Design System Tokens
 * 
 * Centralized export of all design tokens for the Medical application.
 * This provides a single source of truth for colors, typography, spacing, and animations.
 */

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './animations';

// Re-export commonly used tokens for convenience
export { colors, colorVariables, getColor } from './colors';
export { typography, typographyVariables, getFontSize, getTextStyle } from './typography';
export { spacing, semanticSpacing, spacingVariables, getSpacing, getSemanticSpacing } from './spacing';
export { animations, animationVariables, getDuration, getEasing, getTransition } from './animations';

// Import for internal use
import { colors, colorVariables } from './colors';
import { typography, typographyVariables } from './typography';
import { spacing, spacingVariables } from './spacing';
import { animationVariables, animations } from './animations';

// Combined theme tokens
export const tokens = {
  colors,
  typography,
  spacing,
  animations,
} as const;

// Combined CSS variables
export const cssVariables = {
  ...colorVariables,
  ...typographyVariables,
  ...spacingVariables,
  ...animationVariables,
} as const;

// Type definitions for the complete token system
export type DesignTokens = typeof tokens;
export type CSSVariables = typeof cssVariables;