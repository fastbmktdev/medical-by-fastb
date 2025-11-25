/**
 * Error Tracking Utilities
 * 
 * Provides utilities for tracking errors, performance, and user interactions
 * using Sentry and custom analytics.
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Track an error with Sentry
 */
export function trackError(
  error: Error | string,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: 'error' | 'warning' | 'info' | 'debug';
    user?: {
      id?: string;
      email?: string;
      username?: string;
    };
  }
): void {
  if (typeof error === 'string') {
    error = new Error(error);
  }

  Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level || 'error',
    user: context?.user,
  });
}

/**
 * Track a message (non-error event)
 */
export function trackMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
): void {
  Sentry.captureMessage(message, {
    level,
    tags: context?.tags,
    extra: context?.extra,
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}): void {
  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    category: category || 'default',
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  op: string = 'navigation',
  data?: Record<string, string | number | boolean>
): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Filter out null/undefined values and convert to valid SpanAttributeValue
  const attributes = data
    ? Object.fromEntries(
        Object.entries(data).filter(
          ([_, value]) => value !== null && value !== undefined
        )
      )
    : undefined;

  Sentry.startSpan(
    {
      name,
      op,
      ...(attributes && { attributes }),
    },
    () => {
      // Transaction is handled by Sentry automatically
    }
  );
}

/**
 * Track performance metric
 */
export function trackPerformance(
  name: string,
  duration: number,
  unit: 'millisecond' | 'second' = 'millisecond',
  tags?: Record<string, string>
): void {
  const options: { unit: string; tags?: Record<string, string> } = { unit };
  if (tags) {
    options.tags = tags;
  }
  Sentry.metrics.distribution(name, duration, options);
}

/**
 * Track API error
 */
export function trackApiError(
  endpoint: string,
  method: string,
  statusCode: number,
  error: Error | string,
  requestData?: Record<string, unknown>
): void {
  trackError(typeof error === 'string' ? new Error(error) : error, {
    tags: {
      error_type: 'api_error',
      endpoint,
      method,
      status_code: statusCode.toString(),
    },
    extra: {
      endpoint,
      method,
      statusCode,
      requestData,
    },
  });
}

/**
 * Track client-side error with context
 */
export function trackClientError(
  error: Error,
  componentName?: string,
  props?: Record<string, unknown>
): void {
  trackError(error, {
    tags: {
      error_type: 'client_error',
      ...(componentName && { component: componentName }),
    },
    extra: {
      componentName,
      props,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    },
  });
}

/**
 * Track database error
 */
export function trackDatabaseError(
  operation: string,
  table: string,
  error: Error | string,
  query?: string
): void {
  trackError(typeof error === 'string' ? new Error(error) : error, {
    tags: {
      error_type: 'database_error',
      operation,
      table,
    },
    extra: {
      operation,
      table,
      query: query ? query.substring(0, 500) : undefined, // Limit query length
    },
  });
}

