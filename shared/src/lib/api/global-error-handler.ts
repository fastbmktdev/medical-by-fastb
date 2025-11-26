/**
 * Global Error Handler for 500 Internal Server Errors
 * 
 * Comprehensive error handling for all API routes and server-side operations
 */

import { NextResponse } from 'next/server';
import { logger } from '../utils/logger';
import * as Sentry from '@sentry/nextjs';
import { ApiError, errorResponse, ApiResponse } from './error-handler';

export interface GlobalErrorContext {
  route?: string;
  method?: string;
  userId?: string;
  timestamp?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: unknown;
}

/**
 * Enhanced error handler with logging and monitoring
 */
export function handleGlobalError(
  error: unknown,
  context?: GlobalErrorContext
): NextResponse<ApiResponse> {
  const errorId = generateErrorId();
  const timestamp = new Date().toISOString();

  // Log error details
  const errorDetails = {
    errorId,
    timestamp,
    ...context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    } : { type: typeof error, value: String(error) },
  };

  // Log to application logger
  logger.error('Global error handler caught error', errorDetails, error instanceof Error ? error : undefined);

  // Send to Sentry in production
  if (process.env.NODE_ENV === 'production' && typeof Sentry !== 'undefined') {
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: {
        errorId,
        route: context?.route,
        method: context?.method,
      },
      extra: errorDetails,
      level: 'error',
    });
  }

  // Handle known error types
  if (error instanceof ApiError) {
    return errorResponse(error);
  }

  // Handle database errors
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as { code?: string; message?: string };
    
    // PostgreSQL errors
    if (dbError.code?.startsWith('23')) {
      return errorResponse(
        new ApiError(
          'ข้อมูลที่ส่งมาซ้ำซ้อนหรือไม่ถูกต้อง',
          409,
          'DATABASE_CONSTRAINT_ERROR',
          { originalCode: dbError.code }
        )
      );
    }

    if (dbError.code === '23505') {
      return errorResponse(
        new ApiError(
          'ข้อมูลนี้มีอยู่แล้วในระบบ',
          409,
          'DUPLICATE_ENTRY',
          { originalCode: dbError.code }
        )
      );
    }

    if (dbError.code === '23503') {
      return errorResponse(
        new ApiError(
          'ข้อมูลที่อ้างอิงไม่ถูกต้อง',
          400,
          'FOREIGN_KEY_ERROR',
          { originalCode: dbError.code }
        )
      );
    }
  }

  // Handle network errors
  if (error instanceof Error) {
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return errorResponse(
        new ApiError(
          'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง',
          503,
          'SERVICE_UNAVAILABLE'
        )
      );
    }

    // Handle timeout errors
    if (error.message.includes('timeout') || error.name === 'TimeoutError') {
      return errorResponse(
        new ApiError(
          'การร้องขอใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง',
          504,
          'TIMEOUT_ERROR'
        )
      );
    }
  }

  // Generic 500 error
  return NextResponse.json(
    {
      success: false,
      error: process.env.NODE_ENV === 'development'
        ? error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
        : 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ',
      code: 'INTERNAL_SERVER_ERROR',
      errorId,
      timestamp,
      details: process.env.NODE_ENV === 'development'
        ? {
            error: error instanceof Error ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            } : { type: typeof error, value: String(error) },
            context,
          }
        : undefined,
    },
    { status: 500 }
  );
}

/**
 * Generate unique error ID for tracking
 */
function generateErrorId(): string {
  return `ERR-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

/**
 * Wrapper for API route handlers with global error handling
 */
export function withGlobalErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  context?: Omit<GlobalErrorContext, 'timestamp'>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Extract request context if available
      const request = args[0] as { url?: string; method?: string } | undefined;
      const routeValue = request?.url || (context?.route as string | undefined);
      const methodValue = request?.method || (context?.method as string | undefined);
      const errorContext: GlobalErrorContext = {
        ...context,
        route: routeValue,
        method: methodValue,
        timestamp: new Date().toISOString(),
      };

      return handleGlobalError(error, errorContext);
    }
  };
}

/**
 * Wrapper for async operations with error handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context?: GlobalErrorContext
): Promise<{ data?: T; error?: NextResponse<ApiResponse> }> {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    return {
      error: handleGlobalError(error, context),
    };
  }
}

/**
 * Retry operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError;
}

