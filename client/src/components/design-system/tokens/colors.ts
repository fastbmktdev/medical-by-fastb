/**
 * Design System Color Tokens
 *
 * Centralized color palette based on the Medical application's brand identity.
 * These tokens ensure consistent color usage across all components.
 */

export const colors = {
  // Background colors - Hospital Theme
  background: {
    primary: "#FFFFFF", // Main background (white)
    secondary: "#E8F5E9", // Secondary background (light green - fresh and clean)
    card: "#FFFFFF", // Card backgrounds (white)
    overlay: "rgba(255, 255, 255, 0.95)", // Modal/overlay backgrounds
    elevated: "#EDE9FE", // Elevated surfaces (violet-100)
  },

  // Text colors
  text: {
    primary: "#000000", // Primary text (black)
    secondary: "#4B5563", // Secondary text (dark gray)
    muted: "#6B7280", // Muted text (gray)
    inverse: "#FFFFFF", // Text on light backgrounds (white)
    placeholder: "#9CA3AF", // Placeholder text (light gray)
  },

  // Brand colors - Hospital Theme
  brand: {
    primary: "#A78BFA", // Primary brand color (violet-400)
    secondary: "#00ACC1", // Secondary brand color (medical teal - clean and modern)
    accent: "#4CAF50", // Accent color (medical green - health and wellness)
    light: "#EDE9FE", // Light brand color (violet-100 - soft backgrounds)
    dark: "#8B5CF6", // Dark brand color (violet-500 - depth and contrast)
  },

  // Semantic colors
  semantic: {
    success: "#10B981", // Success states
    warning: "#F59E0B", // Warning states
    error: "#EF4444", // Error states
    info: "#3B82F6", // Info states
  },

  // Neutral colors
  neutral: {
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#E5E5E5",
    300: "#D4D4D4",
    400: "#A3A3A3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
    950: "#0A0A0A",
  },

  // Border colors - Hospital Theme
  border: {
    default: "#E5E7EB", // Default border (light gray)
    muted: "#F3F4F6", // Muted border (very light gray)
    focus: "#A78BFA", // Focus border (violet-400)
    error: "#EF4444", // Error border
    success: "#4CAF50", // Success border (medical green)
  },

  // Interactive states - Hospital Theme
  interactive: {
    hover: "rgba(167, 139, 250, 0.1)", // Hover overlay (violet-400)
    active: "rgba(167, 139, 250, 0.2)", // Active overlay (violet-400)
    focus: "rgba(167, 139, 250, 0.5)", // Focus ring (violet-400)
    disabled: "rgba(156, 163, 175, 0.5)", // Disabled overlay (gray)
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
  "--color-background-primary": colors.background.primary,
  "--color-background-secondary": colors.background.secondary,
  "--color-background-card": colors.background.card,
  "--color-background-overlay": colors.background.overlay,
  "--color-background-elevated": colors.background.elevated,

  "--color-text-primary": colors.text.primary,
  "--color-text-secondary": colors.text.secondary,
  "--color-text-muted": colors.text.muted,
  "--color-text-inverse": colors.text.inverse,
  "--color-text-placeholder": colors.text.placeholder,

  "--color-brand-primary": colors.brand.primary,
  "--color-brand-secondary": colors.brand.secondary,
  "--color-brand-accent": colors.brand.accent,
  "--color-brand-light": colors.brand.light,
  "--color-brand-dark": colors.brand.dark,

  "--color-semantic-success": colors.semantic.success,
  "--color-semantic-warning": colors.semantic.warning,
  "--color-semantic-error": colors.semantic.error,
  "--color-semantic-info": colors.semantic.info,

  "--color-border-default": colors.border.default,
  "--color-border-muted": colors.border.muted,
  "--color-border-focus": colors.border.focus,
  "--color-border-error": colors.border.error,
  "--color-border-success": colors.border.success,
} as const;
