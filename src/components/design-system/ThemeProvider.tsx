"use client";

import React, { createContext, useContext, useEffect } from 'react';
import { tokens, cssVariables, type DesignTokens } from './tokens';

/**
 * Theme Context Value Interface
 * 
 * Provides access to all design tokens and theme utilities.
 */
interface ThemeContextValue {
  tokens: DesignTokens;
  colors: typeof tokens.colors;
  typography: typeof tokens.typography;
  spacing: typeof tokens.spacing;
  animations: typeof tokens.animations;
  cssVariables: typeof cssVariables;
}

/**
 * Theme Context
 * 
 * React context for providing design tokens throughout the component tree.
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Theme Provider Props
 */
interface ThemeProviderProps {
  children: React.ReactNode;
  /**
   * Whether to inject CSS variables into the document root
   * @default true
   */
  injectCSSVariables?: boolean;
  /**
   * Custom CSS variables to inject (will be merged with default variables)
   */
  customVariables?: Record<string, string>;
}

/**
 * Theme Provider Component
 * 
 * Provides design tokens and theme utilities to all child components.
 * Optionally injects CSS custom properties into the document root.
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <ThemeProvider>
 *       <MyComponent />
 *     </ThemeProvider>
 *   );
 * }
 * ```
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  injectCSSVariables = true,
  customVariables = {},
}) => {
  const contextValue: ThemeContextValue = {
    tokens,
    colors: tokens.colors,
    typography: tokens.typography,
    spacing: tokens.spacing,
    animations: tokens.animations,
    cssVariables,
  };

  // Inject CSS variables into document root
  useEffect(() => {
    if (!injectCSSVariables || typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const allVariables: Record<string, string> = { ...cssVariables, ...customVariables };

    // Set CSS custom properties
    Object.entries(allVariables).forEach(([property, value]) => {
      root.style.setProperty(property, String(value));
    });

    // Cleanup function to remove variables on unmount
    return () => {
      Object.keys(allVariables).forEach((property) => {
        root.style.removeProperty(property);
      });
    };
  }, [injectCSSVariables, customVariables]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * useTheme Hook
 * 
 * Custom hook to access design tokens and theme utilities.
 * Must be used within a ThemeProvider.
 * 
 * @returns Theme context value with all design tokens
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { colors, spacing, typography } = useTheme();
 *   
 *   return (
 *     <div style={{ 
 *       color: colors.text.primary,
 *       padding: spacing[4],
 *       fontSize: typography.fontSize.lg.size 
 *     }}>
 *       Themed content
 *     </div>
 *   );
 * }
 * ```
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error(
      'useTheme must be used within a ThemeProvider. ' +
      'Make sure to wrap your component tree with <ThemeProvider>.'
    );
  }
  
  return context;
};

/**
 * withTheme Higher-Order Component
 * 
 * HOC that injects theme props into a component.
 * Useful for class components or when you need theme access in props.
 * 
 * @param Component - Component to wrap with theme access
 * @returns Component with theme props injected
 * 
 * @example
 * ```tsx
 * interface MyComponentProps {
 *   theme: ThemeContextValue;
 *   otherProp: string;
 * }
 * 
 * const MyComponent: React.FC<MyComponentProps> = ({ theme, otherProp }) => {
 *   return <div style={{ color: theme.colors.text.primary }}>{otherProp}</div>;
 * };
 * 
 * export default withTheme(MyComponent);
 * ```
 */
export const withTheme = <P extends { theme: ThemeContextValue }>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: Omit<P, 'theme'>) => {
    const theme = useTheme();
    return <Component {...(props as P)} theme={theme} />;
  };
  
  WrappedComponent.displayName = `withTheme(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Theme Consumer Component
 * 
 * Render prop component for accessing theme in render functions.
 * Alternative to useTheme hook for render prop patterns.
 * 
 * @example
 * ```tsx
 * <ThemeConsumer>
 *   {({ colors, spacing }) => (
 *     <div style={{ 
 *       color: colors.text.primary,
 *       padding: spacing[4] 
 *     }}>
 *       Themed content
 *     </div>
 *   )}
 * </ThemeConsumer>
 * ```
 */
export const ThemeConsumer: React.FC<{
  children: (theme: ThemeContextValue) => React.ReactNode;
}> = ({ children }) => {
  const theme = useTheme();
  return <>{children(theme)}</>;
};

// Export context for advanced use cases
export { ThemeContext };

// Export types
export type { ThemeContextValue, ThemeProviderProps };