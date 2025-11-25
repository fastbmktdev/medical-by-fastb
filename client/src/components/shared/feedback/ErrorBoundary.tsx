"use client";

import React, { Component, ReactNode, ErrorInfo } from 'react';
import * as Sentry from '@sentry/nextjs';
import ErrorDisplay from './ErrorDisplay';

/**
 * Error Boundary Props
 */
export interface ErrorBoundaryProps {
  /**
   * Child components to wrap
   */
  children: ReactNode;
  
  /**
   * Custom fallback component
   */
  fallback?: React.ComponentType<ErrorFallbackProps>;
  
  /**
   * Error handler callback
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  
  /**
   * Whether to show error details in development
   */
  showDetails?: boolean;
  
  /**
   * Custom error message
   */
  errorMessage?: string;
  
  /**
   * Whether the error boundary can be reset
   */
  resetable?: boolean;
  
  /**
   * Reset keys - when these change, the error boundary resets
   */
  resetKeys?: Array<string | number | boolean | null | undefined>;
  
  /**
   * Fallback variant to use
   */
  fallbackVariant?: 'inline' | 'card' | 'page' | 'banner';
}

/**
 * Error Fallback Props
 */
export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  resetKeys?: Array<string | number | boolean | null | undefined>;
}

/**
 * Error Boundary State
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  resetKeys?: Array<string | number | boolean | null | undefined>;
}

/**
 * Default Error Fallback Component
 */
const DefaultErrorFallback: React.FC<ErrorFallbackProps & { 
  variant?: 'inline' | 'card' | 'page' | 'banner';
  showDetails?: boolean;
  errorMessage?: string;
}> = ({ 
  error, 
  resetError, 
  variant = 'card',
  showDetails = false,
  errorMessage
}) => {
  return (
    <ErrorDisplay
      variant={variant}
      error={error}
      title="Something went wrong"
      description={errorMessage || "An unexpected error occurred. Please try again."}
      onRetry={resetError}
      retryText="Try Again"
      showDetails={showDetails}
      size="md"
    />
  );
};

/**
 * Enhanced Error Boundary Component
 * 
 * A comprehensive error boundary with proper fallback components and error reporting.
 * Supports custom fallbacks, error logging, and automatic reset functionality.
 * 
 * @example
 * ```tsx
 * // Basic error boundary
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * 
 * // With custom fallback
 * <ErrorBoundary fallback={CustomErrorFallback}>
 *   <MyComponent />
 * </ErrorBoundary>
 * 
 * // With error logging
 * <ErrorBoundary 
 *   onError={(error, errorInfo) => {
 *     console.error('Error caught by boundary:', error, errorInfo);
 *     // Send to error reporting service
 *   }}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * 
 * // With reset keys
 * <ErrorBoundary resetKeys={[userId, dataVersion]}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      resetKeys: props.resetKeys
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { 
      hasError: true, 
      error 
    };
  }

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps, 
    state: ErrorBoundaryState
  ): Partial<ErrorBoundaryState> | null {
    const { resetKeys } = props;
    const { resetKeys: prevResetKeys, hasError } = state;
    
    // If resetKeys have changed and we have an error, reset the boundary
    if (hasError && resetKeys !== prevResetKeys) {
      if (resetKeys && prevResetKeys) {
        const hasResetKeyChanged = resetKeys.some((key, index) => key !== prevResetKeys[index]);
        if (hasResetKeyChanged) {
          return {
            hasError: false,
            error: undefined,
            errorInfo: undefined,
            resetKeys
          };
        }
      }
      return { resetKeys };
    }
    
    return null;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Report to Sentry
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          errorBoundary: true,
        },
      });
    }
    
    // Call error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { 
      children, 
      fallback: CustomFallback, 
      showDetails = process.env.NODE_ENV === 'development',
      errorMessage,
      resetable = true,
      fallbackVariant = 'card'
    } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (CustomFallback) {
        return (
          <CustomFallback 
            error={error} 
            resetError={this.resetError}
            resetKeys={this.props.resetKeys}
          />
        );
      }

      // Use default fallback
      return (
        <DefaultErrorFallback
          error={error}
          resetError={resetable ? this.resetError : () => {}}
          variant={fallbackVariant}
          showDetails={showDetails}
          errorMessage={errorMessage}
        />
      );
    }

    return children;
  }
}

/**
 * Hook for handling async errors in functional components
 * 
 * Allows functional components to throw errors that will be caught by ErrorBoundary.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const throwError = useAsyncError();
 *   
 *   const handleAsyncError = async () => {
 *     try {
 *       await riskyAsyncOperation();
 *     } catch (error) {
 *       throwError(error);
 *     }
 *   };
 *   
 *   return <button onClick={handleAsyncError} aria-label="Button">Do Something Risky</button>;
 * }
 * ```
 */
export function useAsyncError() {
  const [error, setError] = React.useState<Error | null>(null);

  const throwError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return throwError;
}

/**
 * Higher-order component for wrapping components with error boundary
 * 
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   fallbackVariant: 'card',
 *   onError: (error) => console.error(error)
 * });
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Error Boundary Hook for functional components
 * 
 * Provides error boundary functionality as a hook.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { ErrorBoundary, resetError } = useErrorBoundary({
 *     onError: (error) => console.error(error)
 *   });
 *   
 *   return (
 *     <ErrorBoundary>
 *       <RiskyComponent />
 *     </ErrorBoundary>
 *   );
 * }
 * ```
 */
export function useErrorBoundary(props?: Omit<ErrorBoundaryProps, 'children'>) {
  const [key, setKey] = React.useState(0);
  
  const resetError = React.useCallback(() => {
    setKey(prev => prev + 1);
  }, []);
  
  const BoundaryComponent = React.useCallback(
    ({ children }: { children: ReactNode }) => (
      <ErrorBoundary key={key} {...props}>
        {children}
      </ErrorBoundary>
    ),
    [key, props]
  );
  
  return {
    ErrorBoundary: BoundaryComponent,
    resetError
  };
}

export default ErrorBoundary;