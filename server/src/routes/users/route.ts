import { NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { requireAuthAndAdmin, withErrorHandling, errorResponse, successResponse } from '@shared/lib/api/server-route-utils';
import { ServiceError } from '@shared/services/service-utils';

/**
 * API endpoint to list users (for testing/admin purposes)
 * GET /api/users
 *
 * Returns list of registered users with their details
 *
 * ⚠️ Warning: This is for development only!
 * In production, add authentication and authorization checks
 */
export const GET = withErrorHandling(async () => {
  const supabase = await createClient();

  // Require authentication and admin role
  await requireAuthAndAdmin(supabase);

  // Get users with their roles
  const { data: usersWithRoles, error: queryError } = await supabase
    .from('user_roles')
    .select(`
      user_id,
      role,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  if (queryError) {
    throw new ServiceError(
      queryError.message || 'Failed to fetch users',
      'QUERY_ERROR',
      500,
      queryError
    );
  }

  return successResponse({
    count: usersWithRoles?.length || 0,
    users: usersWithRoles || [],
  });
});

