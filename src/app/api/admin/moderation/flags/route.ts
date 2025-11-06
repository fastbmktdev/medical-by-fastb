import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { withAdminAuth } from '@/lib/api/withAdminAuth';

/**
 * GET /api/admin/moderation/flags
 * Get all content flags (Admin only)
 * Query params:
 * - status: filter by status (pending, reviewed, approved, rejected, resolved)
 * - contentType: filter by content type
 * - limit: number of flags to return
 * - offset: offset for pagination
 */
export const GET = withAdminAuth(async (
  request: NextRequest,
) => {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const contentType = searchParams.get('contentType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('content_flags')
      .select(`
        *,
        reported_by_user:auth.users!content_flags_reported_by_fkey(id, email),
        reviewed_by_user:auth.users!content_flags_reviewed_by_fkey(id, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data: flags, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: flags || [],
      count: flags?.length || 0,
    });
  } catch (error) {
    console.error('Get content flags error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch flags' },
      { status: 500 }
    );
  }
});

