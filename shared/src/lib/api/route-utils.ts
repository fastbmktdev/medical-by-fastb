/**
 * API Route Utilities
 *
 * Shared utilities for API route handlers to reduce code duplication
 * and improve consistency across routes.
 *
 * This file consolidates both general route utilities and Next.js-specific
 * server route utilities.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createServerClient } from '@shared/lib/database/supabase/server';
import { errorResponse, UnauthorizedError, ForbiddenError } from './error-handler';

// ============================================================================
// UUID & Validation Utilities
// ============================================================================

/**
 * Check if a string is a valid UUID
 */
export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// ============================================================================
// Authentication & Authorization
// ============================================================================

/**
 * Check if user is admin
 * Uses user_roles table (consistent with existing routes)
 */
export async function checkIsAdmin(
  supabase: SupabaseClient | Awaited<ReturnType<typeof createServerClient>>,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  return data?.role === 'admin';
}

/**
 * Get authenticated user from request
 * @param supabase - Supabase client
 * @returns User object or null if not authenticated
 */
export async function getAuthenticatedUser(supabase: SupabaseClient): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Require authentication - throws UnauthorizedError if not authenticated
 * @param supabase - Supabase client
 * @returns User object
 */
export async function requireAuth(supabase: SupabaseClient): Promise<User> {
  const user = await getAuthenticatedUser(supabase);

  if (!user) {
    throw new UnauthorizedError('กรุณาเข้าสู่ระบบ');
  }

  return user;
}

/**
 * Require admin role - throws ForbiddenError if not admin
 * @param supabase - Supabase client
 * @param userId - User ID to check
 * @returns true if admin
 */
export async function requireAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const isAdmin = await checkIsAdmin(supabase, userId);

  if (!isAdmin) {
    throw new ForbiddenError('คุณไม่มีสิทธิ์เข้าถึง');
  }

  return true;
}

/**
 * Require authentication and admin role
 * @param supabase - Supabase client
 * @returns User object
 */
export async function requireAuthAndAdmin(supabase: SupabaseClient): Promise<User> {
  const user = await requireAuth(supabase);
  await requireAdmin(supabase, user.id);
  return user;
}

/**
 * Get user and admin status in parallel
 * @param supabase - Supabase client
 * @returns Object with user and isAdmin status
 */
export async function getUserAndAdminStatus(supabase: SupabaseClient): Promise<{
  user: User | null;
  isAdmin: boolean;
}> {
  const user = await getAuthenticatedUser(supabase);

  if (!user) {
    return { user: null, isAdmin: false };
  }

  const isAdmin = await checkIsAdmin(supabase, user.id);

  return { user, isAdmin };
}

// ============================================================================
// Database Utilities
// ============================================================================

/**
 * Increment view count for a resource (fire and forget)
 * Optimized to not block the main response
 */
export function incrementViewCount(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  table: string,
  id: string | number,
  currentCount: number = 0
): void {
  void (async () => {
    try {
      await supabase
        .from(table)
        .update({ views_count: currentCount + 1 })
        .eq('id', id);
    } catch (err: unknown) {
      console.warn(`Failed to increment views count for ${table}:`, err);
    }
  })();
}

/**
 * Build query for finding resource by slug or id
 * Supports both UUID and slug lookup
 */
export function buildSlugOrIdQuery<T>(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  table: string,
  identifier: string
) {
  const isId = isUUID(identifier);
  let query = supabase.from(table).select('*');

  if (isId) {
    query = query.eq('id', identifier);
  } else {
    query = query.eq('slug', identifier);
  }

  return query;
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Wrapper for route handlers with error handling
 * @param handler - Route handler function
 * @returns Wrapped handler with error handling
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('Route handler error:', error);

      // Handle known error types
      if (error instanceof UnauthorizedError) {
        return errorResponse(error);
      }

      if (error instanceof ForbiddenError) {
        return errorResponse(error);
      }

      // Handle other errors
      return errorResponse(
        error instanceof Error ? error : new Error('Internal server error')
      );
    }
  };
}

// ============================================================================
// Query Parameter Parsing
// ============================================================================

/**
 * Parse query parameters with defaults
 * @param request - NextRequest object
 * @param defaults - Default values for parameters
 * @returns Parsed query parameters
 */
export function parseQueryParams<T extends Record<string, any>>(
  request: NextRequest,
  defaults: T
): T {
  const { searchParams } = new URL(request.url);
  const params = { ...defaults } as T;

  for (const key in defaults) {
    const value = searchParams.get(key);
    if (value !== null) {
      const defaultValue = defaults[key];

      // Type conversion based on default value type
      if (typeof defaultValue === 'number') {
        (params as any)[key] = parseInt(value, 10) || defaultValue;
      } else if (typeof defaultValue === 'boolean') {
        (params as any)[key] = value === 'true';
      } else {
        (params as any)[key] = value;
      }
    }
  }

  return params;
}

/**
 * Parse pagination parameters
 * @param request - NextRequest object
 * @param defaultLimit - Default limit (default: 50)
 * @returns Pagination parameters
 */
export function parsePaginationParams(
  request: NextRequest,
  defaultLimit: number = 50
): { limit: number; offset: number } {
  const { searchParams } = new URL(request.url);

  return {
    limit: parseInt(searchParams.get('limit') || String(defaultLimit), 10),
    offset: parseInt(searchParams.get('offset') || '0', 10),
  };
}
