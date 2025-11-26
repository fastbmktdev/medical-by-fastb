import { NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
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
export async function GET() {
  try {
    const supabase = await createClient();

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

    return NextResponse.json({
      success: true,
      data: {
        count: usersWithRoles?.length || 0,
        users: usersWithRoles || [],
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

