/**
 * API Error Handler Utilities
 * 
 * Provides standardized error handling for API routes
 */

import { NextResponse } from 'next/server';

/**
 * Custom API Error Classes
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public errors?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'ไม่พบข้อมูลที่ต้องการ') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'ไม่ได้รับอนุญาต') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'ไม่มีสิทธิ์เข้าถึง') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'ข้อมูลซ้ำซ้อน') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'เกินจำนวนการร้องขอที่อนุญาต') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

/**
 * Standard API Response Format
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  errors?: Record<string, string[]>;
  details?: unknown;
  timestamp?: string;
}

/**
 * Create success response
 */
export function successResponse<T>(
  data: T,
  statusCode: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

/**
 * Create error response
 */
export function errorResponse(
  error: unknown,
  defaultMessage: string = 'เกิดข้อผิดพลาดในการประมวลผล'
): NextResponse<ApiResponse> {
  // Handle custom API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        errors: error instanceof ValidationError ? error.errors : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode }
    );
  }

  // Handle validation errors with errors object
  if (error instanceof Error && 'errors' in error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: 'VALIDATION_ERROR',
        errors: (error as Error & { errors: Record<string, string[]> }).errors,
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Log error for debugging (but don't expose sensitive info to client)
    console.error('API Error:', {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });

    // Check for common error patterns
    if (error.message.includes('not found') || error.message.includes('ไม่พบ')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'NOT_FOUND',
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (error.message.includes('unauthorized') || error.message.includes('ไม่ได้รับอนุญาต')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'UNAUTHORIZED',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    if (error.message.includes('forbidden') || error.message.includes('ไม่มีสิทธิ์')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'FORBIDDEN',
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'development' 
          ? error.message 
          : defaultMessage,
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack } 
          : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }

  // Handle unknown error types
  console.error('Unknown error type:', error);
  return NextResponse.json(
    {
      success: false,
      error: defaultMessage,
      code: 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  );
}

/**
 * Async error handler wrapper
 * Wraps an async handler function with automatic error handling
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

/**
 * Validate request body
 */
export function validateRequestBody<T>(
  body: unknown,
  validator: (data: unknown) => data is T
): T {
  if (!validator(body)) {
    throw new ValidationError('ข้อมูลที่ส่งมาไม่ถูกต้อง');
  }
  return body;
}

/**
 * Check authentication
 */
export async function requireAuth(supabase: any) {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new UnauthorizedError('กรุณาเข้าสู่ระบบก่อน');
  }
  
  return user;
}

/**
 * Check admin role
 */
export async function requireAdmin(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new ForbiddenError('ต้องเป็นผู้ดูแลระบบเท่านั้น');
  }

  return profile;
}

/**
 * Check partner role
 */
export async function requirePartner(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (profile?.role !== 'partner' && profile?.role !== 'admin') {
    throw new ForbiddenError('ต้องเป็นพาร์ทเนอร์หรือผู้ดูแลระบบเท่านั้น');
  }

  return profile;
}

