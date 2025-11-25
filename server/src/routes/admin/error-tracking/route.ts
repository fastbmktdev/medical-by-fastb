/**
 * Error Tracking API
 * GET /api/admin/error-tracking
 * 
 * Returns error tracking data for the admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const severity = searchParams.get('severity');
    const source = searchParams.get('source');
    const errorType = searchParams.get('errorType');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('error_events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (severity) {
      query = query.eq('severity', severity);
    }
    if (source) {
      query = query.eq('source', source);
    }
    if (errorType) {
      query = query.eq('error_type', errorType);
    }

    const { data: errors, error: queryError, count } = await query;

    if (queryError) {
      console.error('Error fetching errors:', queryError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch errors' },
        { status: 500 }
      );
    }

    // Get error aggregation
    const { data: aggregation } = await supabase
      .from('error_aggregation')
      .select('*')
      .order('error_date', { ascending: false })
      .limit(30);

    // Get error trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: trends } = await supabase
      .from('error_events')
      .select('severity, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    // Calculate stats
    const stats = {
      total: count || 0,
      bySeverity: {
        critical: errors?.filter(e => e.severity === 'critical').length || 0,
        error: errors?.filter(e => e.severity === 'error').length || 0,
        warning: errors?.filter(e => e.severity === 'warning').length || 0,
        info: errors?.filter(e => e.severity === 'info').length || 0,
        debug: errors?.filter(e => e.severity === 'debug').length || 0,
      },
      bySource: {
        client: errors?.filter(e => e.source === 'client').length || 0,
        server: errors?.filter(e => e.source === 'server').length || 0,
        api: errors?.filter(e => e.source === 'api').length || 0,
        database: errors?.filter(e => e.source === 'database').length || 0,
        third_party: errors?.filter(e => e.source === 'third_party').length || 0,
        unknown: errors?.filter(e => e.source === 'unknown').length || 0,
      },
      uniqueUsers: new Set(errors?.map(e => e.user_id).filter(Boolean)).size,
      uniqueSessions: new Set(errors?.map(e => e.session_id).filter(Boolean)).size,
    };

    return NextResponse.json({
      success: true,
      data: {
        errors: errors || [],
        aggregation: aggregation || [],
        trends: trends || [],
        stats,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit,
        },
      },
    });

  } catch (error) {
    console.error('Error tracking API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

