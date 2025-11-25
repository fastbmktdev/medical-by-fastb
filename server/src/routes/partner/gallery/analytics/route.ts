import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

/**
 * GET /api/partner/gallery/analytics
 * Get analytics data for hospital gallery
 * Query params: hospital_id (required), limit (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const hospitalId = searchParams.get('hospital_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!hospitalId) {
      return NextResponse.json(
        { success: false, error: 'hospital_id is required' },
        { status: 400 }
      );
    }

    // Verify hospital ownership
    const { data: hospital } = await supabase
      .from('hospitals')
      .select('id, user_id')
      .eq('id', hospitalId)
      .single();

    if (!hospital) {
      return NextResponse.json(
        { success: false, error: 'hospital not found' },
        { status: 404 }
      );
    }

    // Check permission
    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = role?.role === 'admin';
    const isOwner = hospital.user_id === user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get analytics summary
    const { data: analytics } = await supabase
      .from('gallery_analytics')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('view_count', { ascending: false });

    // Get top viewed images
    const { data: topImages } = await supabase.rpc('get_top_viewed_images', {
      p_hospital_id: hospitalId,
      p_limit: limit,
    });

    // Calculate totals
    const totalViews = analytics?.reduce((sum, item) => sum + (item.view_count || 0), 0) || 0;
    const totalUniqueViews = analytics?.reduce((sum, item) => sum + (item.unique_view_count || 0), 0) || 0;
    const totalImages = analytics?.length || 0;

    // Get recent views (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentViews } = await supabase
      .from('gallery_views')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)
      .gte('viewed_at', sevenDaysAgo.toISOString());

    // Get views by day (last 30 days)
    const { data: viewsByDay } = await supabase
      .from('gallery_views')
      .select('viewed_at')
      .eq('hospital_id', hospitalId)
      .gte('viewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('viewed_at', { ascending: true });

    // Group views by day
    const viewsGroupedByDay: { [key: string]: number } = {};
    viewsByDay?.forEach((view) => {
      const date = new Date(view.viewed_at).toISOString().split('T')[0];
      viewsGroupedByDay[date] = (viewsGroupedByDay[date] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total_views: totalViews,
          total_unique_views: totalUniqueViews,
          total_images: totalImages,
          recent_views_7d: recentViews || 0,
          average_views_per_image: totalImages > 0 ? Math.round(totalViews / totalImages) : 0,
        },
        top_images: topImages || [],
        analytics: analytics || [],
        views_by_day: viewsGroupedByDay,
      },
    });
  } catch (error) {
    console.error('Gallery analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

