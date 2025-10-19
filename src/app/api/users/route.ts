import { NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

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

    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError || roleData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - คุณไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

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
      throw queryError;
    }

    return NextResponse.json({
      success: true,
      count: usersWithRoles?.length || 0,
      users: usersWithRoles || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

