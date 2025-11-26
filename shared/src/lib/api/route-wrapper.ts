/**
 * API Route Wrapper with Global Error Handling
 * 
 * Wrapper utilities for Next.js API routes with comprehensive error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { withGlobalErrorHandler, GlobalErrorContext } from './global-error-handler';
import { ApiResponse } from './error-handler';

/**
 * Extract request context for error handling
 */
function extractRequestContext(request: NextRequest): GlobalErrorContext {
  return {
    route: request.nextUrl.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        undefined,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Wrapper for GET handlers
 */
export function GET(
  handler: (request: NextRequest) => Promise<NextResponse<ApiResponse>>
) {
  return withGlobalErrorHandler(
    async (request: NextRequest) => {
      const context = extractRequestContext(request);
      return handler(request);
    },
    { method: 'GET' }
  );
}

/**
 * Wrapper for POST handlers
 */
export function POST(
  handler: (request: NextRequest) => Promise<NextResponse<ApiResponse>>
) {
  return withGlobalErrorHandler(
    async (request: NextRequest) => {
      const context = extractRequestContext(request);
      return handler(request);
    },
    { method: 'POST' }
  );
}

/**
 * Wrapper for PUT handlers
 */
export function PUT(
  handler: (request: NextRequest) => Promise<NextResponse<ApiResponse>>
) {
  return withGlobalErrorHandler(
    async (request: NextRequest) => {
      const context = extractRequestContext(request);
      return handler(request);
    },
    { method: 'PUT' }
  );
}

/**
 * Wrapper for PATCH handlers
 */
export function PATCH(
  handler: (request: NextRequest) => Promise<NextResponse<ApiResponse>>
) {
  return withGlobalErrorHandler(
    async (request: NextRequest) => {
      const context = extractRequestContext(request);
      return handler(request);
    },
    { method: 'PATCH' }
  );
}

/**
 * Wrapper for DELETE handlers
 */
export function DELETE(
  handler: (request: NextRequest) => Promise<NextResponse<ApiResponse>>
) {
  return withGlobalErrorHandler(
    async (request: NextRequest) => {
      const context = extractRequestContext(request);
      return handler(request);
    },
    { method: 'DELETE' }
  );
}

/**
 * Generic route handler wrapper
 */
export function createRouteHandler(
  handler: (request: NextRequest) => Promise<NextResponse<ApiResponse>>,
  method?: string
) {
  return withGlobalErrorHandler(handler, method ? { method } : undefined);
}

