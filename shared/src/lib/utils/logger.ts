/**
 * Logger Utility
 * 
 * Environment-based logging utility that replaces console.log/error/warn
 * Supports both client and server environments
 * Integrates with Sentry for error tracking
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

/**
 * Check if logging is enabled for a specific level
 */
function shouldLog(level: LogLevel): boolean {
  const env = process.env.NODE_ENV || 'development';
  const logLevel = process.env.LOG_LEVEL?.toLowerCase();

  // In production, disable debug logs unless explicitly enabled
  if (env === 'production' && level === 'debug') {
    return logLevel === 'debug';
  }

  // In test environment, disable all logs unless explicitly enabled
  if (env === 'test') {
    return logLevel !== undefined;
  }

  // In development, log everything
  return true;
}

/**
 * Sanitize log data to remove sensitive information
 */
function sanitizeData(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'authorization',
    'auth',
    'creditCard',
    'credit_card',
    'ssn',
    'socialSecurityNumber',
  ];

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Format log message with context
 */
function formatMessage(message: string, context?: LogContext): string {
  if (!context || Object.keys(context).length === 0) {
    return message;
  }

  const sanitized = sanitizeData(context);
  return `${message} ${JSON.stringify(sanitized)}`;
}

/**
 * Log to console (only in development or when explicitly enabled)
 */
function logToConsole(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) {
    return;
  }

  const formattedMessage = formatMessage(message, context);
  const sanitizedContext = context ? sanitizeData(context) : undefined;

  switch (level) {
    case 'debug':
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] ${formattedMessage}`, sanitizedContext || '');
      break;
    case 'info':
      // eslint-disable-next-line no-console
      console.info(`[INFO] ${formattedMessage}`, sanitizedContext || '');
      break;
    case 'warn':
      // eslint-disable-next-line no-console
      console.warn(`[WARN] ${formattedMessage}`, sanitizedContext || '');
      break;
    case 'error':
      // eslint-disable-next-line no-console
      console.error(`[ERROR] ${formattedMessage}`, sanitizedContext || '');
      break;
  }
}

/**
 * Track error with Sentry (if available)
 */
function trackWithSentry(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
  // Only track errors and warnings in production
  if (process.env.NODE_ENV !== 'production' || (level !== 'error' && level !== 'warn')) {
    return;
  }

  // Try to import Sentry (it might not be available in all environments)
  try {
    // Dynamic import to avoid issues if Sentry is not installed
    if (typeof (globalThis as { window?: unknown }).window !== 'undefined') {
      // Client-side: Sentry should be available via error-tracking
      // We'll use the error-tracking utility instead
      return;
    }

    // Server-side: Check if Sentry is available
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/nextjs');
    if (Sentry && Sentry.captureException) {
      if (error) {
        Sentry.captureException(error, {
          level,
          tags: context?.tags as Record<string, string> | undefined,
          extra: sanitizeData(context) as Record<string, unknown> | undefined,
        });
      } else {
        Sentry.captureMessage(message, {
          level,
          tags: context?.tags as Record<string, string> | undefined,
          extra: sanitizeData(context) as Record<string, unknown> | undefined,
        });
      }
    }
  } catch {
    // Sentry not available, skip tracking
  }
}

/**
 * Logger interface
 */
export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext, error?: Error): void;
}

/**
 * Create logger instance
 */
function createLogger(): Logger {
  return {
    debug(message: string, context?: LogContext): void {
      logToConsole('debug', message, context);
    },

    info(message: string, context?: LogContext): void {
      logToConsole('info', message, context);
      trackWithSentry('info', message, context);
    },

    warn(message: string, context?: LogContext): void {
      logToConsole('warn', message, context);
      trackWithSentry('warn', message, context);
    },

    error(message: string, context?: LogContext, error?: Error): void {
      logToConsole('error', message, context);
      trackWithSentry('error', message, context, error);
    },
  };
}

/**
 * Default logger instance
 */
export const logger = createLogger();

/**
 * Create a scoped logger with default context
 */
export function createScopedLogger(defaultContext: LogContext): Logger {
  return {
    debug(message: string, context?: LogContext): void {
      logger.debug(message, { ...defaultContext, ...context });
    },
    info(message: string, context?: LogContext): void {
      logger.info(message, { ...defaultContext, ...context });
    },
    warn(message: string, context?: LogContext): void {
      logger.warn(message, { ...defaultContext, ...context });
    },
    error(message: string, context?: LogContext, error?: Error): void {
      logger.error(message, { ...defaultContext, ...context }, error);
    },
  };
}

