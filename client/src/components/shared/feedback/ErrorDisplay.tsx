"use client";

import React from 'react';
import { cn } from '@shared/lib/utils/cn';
import { FeedbackComponentProps } from '@/components/design-system/types/component-props';
import { ComponentSize } from '@/components/design-system/types/variants';

/**
 * Error Display Props
 * 
 * Props for the ErrorDisplay component with different variants and customization.
 */
export interface ErrorDisplayProps extends Omit<FeedbackComponentProps, 'variant'> {
  /**
   * Error display variant
   */
  variant?: 'inline' | 'card' | 'page' | 'banner';
  
  /**
   * Error object or message
   */
  error: Error | string;
  
  /**
   * Retry function
   */
  onRetry?: () => void;
  
  /**
   * Retry button text
   */
  retryText?: string;
  
  /**
   * Whether to show error details
   */
  showDetails?: boolean;
  
  /**
   * Custom error icon
   */
  errorIcon?: React.ReactNode;
  
  /**
   * Whether the error is dismissible
   */
  dismissible?: boolean;
  
  /**
   * Dismiss handler
   */
  onDismiss?: () => void;
}

/**
 * Get variant classes
 */
const getVariantClasses = (variant: string): string => {
  const variantMap: Record<string, string> = {
    inline: 'text-sm text-red-600 dark:text-red-400',
    card: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4',
    page: 'min-h-[400px] flex flex-col items-center justify-center text-center p-8',
    banner: 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4',
  };
  
  return variantMap[variant] || variantMap.inline;
};

/**
 * Get size classes
 */
const getSizeClasses = (size: ComponentSize): string => {
  const sizeMap: Record<ComponentSize, string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };
  
  return sizeMap[size] || sizeMap.md;
};

/**
 * Default Error Icon
 */
const DefaultErrorIcon: React.FC<{ size: ComponentSize }> = ({ size }) => {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  }[size];

  return (
    <svg
      className={cn('text-red-500', sizeClasses)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  );
};

/**
 * Dismiss Button
 */
const DismissButton: React.FC<{ onDismiss: () => void; size: ComponentSize }> = ({ 
  onDismiss, 
  size 
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  }[size];

  return (
    <button
      onClick={onDismiss}
      className={cn(
        'text-red-400 hover:text-red-600 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ',
        'ml-auto shrink-0'
      )}
      aria-label="Dismiss error"
    >
      <svg
        className={sizeClasses}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
};

/**
 * Retry Button
 */
const RetryButton: React.FC<{ 
  onRetry: () => void; 
  text: string; 
  size: ComponentSize;
  variant: string;
}> = ({ onRetry, text, size, variant }) => {
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
    xl: 'px-6 py-3 text-base',
  }[size];

  const variantClasses = variant === 'page' 
    ? 'bg-brand-primary hover:bg-red-600 text-white' 
    : 'bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-800 dark:hover:bg-red-600 dark:text-red-100';

  return (
    <button
      onClick={onRetry}
      className={cn(
        'inline-flex items-center font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
        sizeClasses,
        variantClasses
      )}
      aria-label="ลองใหม่อีกครั้ง"
    >
      <svg
        className="w-4 h-4 mr-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {text}
    </button>
  );
};

/**
 * Error Display Component
 * 
 * A comprehensive error display component with multiple variants and customization options.
 * Supports inline, card, page, and banner error presentations.
 * 
 * @example
 * ```tsx
 * // Inline error
 * <ErrorDisplay variant="inline" error="Something went wrong" />
 * 
 * // Card error with retry
 * <ErrorDisplay 
 *   variant="card" 
 *   error={new Error("Failed to load data")} 
 *   onRetry={() => refetch()}
 *   retryText="Try Again"
 * />
 * 
 * // Page error
 * <ErrorDisplay 
 *   variant="page" 
 *   error="Page not found" 
 *   title="404 Error"
 *   description="The page you're looking for doesn't exist."
 * />
 * 
 * // Dismissible banner
 * <ErrorDisplay 
 *   variant="banner" 
 *   error="Connection failed" 
 *   dismissible
 *   onDismiss={() => setError(null)}
 * />
 * ```
 */
export const ErrorDisplay = React.forwardRef<HTMLDivElement, ErrorDisplayProps>(
  (
    {
      variant = 'inline',
      error,
      onRetry,
      retryText = 'Try Again',
      showDetails = false,
      errorIcon,
      dismissible = false,
      onDismiss,
      title,
      description,
      size = 'md',
      className,
      testId,
      ...props
    },
    ref
  ) => {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    const variantClasses = getVariantClasses(variant);
    const sizeClasses = getSizeClasses(size);
    
    const renderIcon = () => {
      if (variant === 'inline') return null;
      return errorIcon || <DefaultErrorIcon size={size} />;
    };
    
    const renderContent = () => {
      switch (variant) {
        case 'page':
          return (
            <div className="max-w-md mx-auto">
              {renderIcon()}
              <div className="mt-4">
                {title && (
                  <h1
                    className={cn(
                      'font-semibold text-gray-900 dark:text-gray-100 mb-2',
                      size === 'sm'
                        ? 'text-lg'
                        : size === 'md'
                        ? 'text-xl'
                        : size === 'lg'
                        ? 'text-2xl'
                        : size === 'xl'
                        ? 'text-3xl'
                        : ''
                    )}
                  >
                    {title}
                  </h1>
                )}
                <p className={cn('text-gray-600 dark:text-gray-400 mb-4', sizeClasses)}>
                  {description || errorMessage}
                </p>
                {showDetails && errorStack && (
                  <details className="mt-4 text-left">
                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                      Show Details
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-3 overflow-auto">
                      {errorStack}
                    </pre>
                  </details>
                )}
                {onRetry && (
                  <div className="mt-6">
                    <RetryButton 
                      onRetry={onRetry} 
                      text={retryText} 
                      size={size}
                      variant={variant}
                    />
                  </div>
                )}
              </div>
            </div>
          );
          
        case 'card':
        case 'banner':
          return (
            <div className="flex items-start gap-3">
              {renderIcon()}
              <div className="flex-1 min-w-0">
                {title && (
                  <h3 className={cn('font-medium text-red-800 dark:text-red-200 mb-1', sizeClasses)}>
                    {title}
                  </h3>
                )}
                <p className={cn('text-red-700 dark:text-red-300', sizeClasses)}>
                  {description || errorMessage}
                </p>
                {showDetails && errorStack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                      Show Details
                    </summary>
                    <pre className="mt-2 text-xs bg-red-100 dark:bg-red-800 p-2 overflow-auto">
                      {errorStack}
                    </pre>
                  </details>
                )}
                {onRetry && (
                  <div className="mt-3">
                    <RetryButton 
                      onRetry={onRetry} 
                      text={retryText} 
                      size={size}
                      variant={variant}
                    />
                  </div>
                )}
              </div>
              {dismissible && onDismiss && (
                <DismissButton onDismiss={onDismiss} size={size} />
              )}
            </div>
          );
          
        case 'inline':
        default:
          return (
            <div className="flex items-center gap-2">
              <span className={sizeClasses}>{errorMessage}</span>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="text-red-600 hover:text-red-800 underline text-sm"
                  aria-label="ลองทำซ้ำอีกครั้ง"
                >
                  {retryText}
                </button>
              )}
              {dismissible && onDismiss && (
                <DismissButton onDismiss={onDismiss} size={size} />
              )}
            </div>
          );
      }
    };

    return (
      <div
        ref={ref}
        className={cn(variantClasses, className)}
        role="alert"
        data-testid={testId}
        {...props}
      >
        {renderContent()}
      </div>
    );
  }
);

ErrorDisplay.displayName = 'ErrorDisplay';

export default ErrorDisplay;