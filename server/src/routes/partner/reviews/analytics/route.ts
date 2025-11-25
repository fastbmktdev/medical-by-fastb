import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

/**
 * GET /api/partner/reviews/analytics
 * Get review analytics for partner's hospital
 * Query params: hospital_id (optional - will use partner's hospital if not provided)
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

    // Check if user is a partner or admin
    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = role?.role === 'admin';
    const isPartner = role?.role === 'partner';

    if (!isPartner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Partner access required' },
        { status: 403 }
      );
    }

    // Get hospital_id from query or from partner's hospital
    const searchParams = request.nextUrl.searchParams;
    let hospitalId = searchParams.get('hospital_id');

    if (!hospitalId) {
      const { data: hospital } = await supabase
        .from('hospitals')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!hospital) {
        return NextResponse.json(
          { success: false, error: 'No hospital found for this partner' },
          { status: 404 }
        );
      }

      hospitalId = hospital.id;
    }

    // Verify hospital ownership (unless admin)
    if (!isAdmin) {
      const { data: hospital } = await supabase
        .from('hospitals')
        .select('user_id')
        .eq('id', hospitalId)
        .single();

      if (!hospital || hospital.user_id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Forbidden - Not your hospital' },
          { status: 403 }
        );
      }
    }

    // Get analytics from review_analytics table
    const { data: analytics, error: analyticsError } = await supabase
      .from('review_analytics')
      .select('*')
      .eq('hospital_id', hospitalId)
      .single();

    if (analyticsError && analyticsError.code !== 'PGRST116') {
      console.error('Error fetching analytics:', analyticsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    // Get top reviews (highest rated with most helpful votes)
    const { data: topReviews } = await supabase
      .from('hospital_reviews')
      .select(`
        id,
        rating,
        title,
        comment,
        helpful_count,
        created_at,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('hospital_id', hospitalId)
      .eq('status', 'approved')
      .gte('rating', 4)
      .order('helpful_count', { ascending: false })
      .order('rating', { ascending: false })
      .limit(5);

    // Get recent reviews (last 10)
    const { data: recentReviews } = await supabase
      .from('hospital_reviews')
      .select(`
        id,
        rating,
        title,
        comment,
        has_response,
        created_at,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('hospital_id', hospitalId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get rating trend (last 6 months, grouped by month)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: ratingTrend } = await supabase
      .from('hospital_reviews')
      .select('rating, created_at')
      .eq('hospital_id', hospitalId)
      .eq('status', 'approved')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true });

    // Group rating trend by month
    const trendByMonth: { [key: string]: { total: number; sum: number; avg: number } } = {};
    ratingTrend?.forEach((review: { rating: number; created_at: string }) => {
      const month = new Date(review.created_at).toISOString().slice(0, 7); // YYYY-MM
      if (!trendByMonth[month]) {
        trendByMonth[month] = { total: 0, sum: 0, avg: 0 };
      }
      trendByMonth[month].total++;
      trendByMonth[month].sum += review.rating;
    });

    // Calculate averages
    Object.keys(trendByMonth).forEach((month) => {
      trendByMonth[month].avg = parseFloat(
        (trendByMonth[month].sum / trendByMonth[month].total).toFixed(2)
      );
    });

    // Get response time statistics
    const { data: responseTimeData } = await supabase
      .from('hospital_reviews')
      .select(`
        id,
        created_at,
        review_replies (
          created_at
        )
      `)
      .eq('hospital_id', hospitalId)
      .eq('status', 'approved')
      .eq('has_response', true)
      .not('review_replies', 'is', null);

    // Calculate average response time
    let totalResponseTimeHours = 0;
    let responseCount = 0;

    responseTimeData?.forEach((review: { created_at: string; review_replies?: Array<{ created_at: string }> }) => {
      if (review.review_replies && review.review_replies.length > 0) {
        const reviewDate = new Date(review.created_at);
        const replyDate = new Date(review.review_replies[0].created_at);
        const diffHours = (replyDate.getTime() - reviewDate.getTime()) / (1000 * 60 * 60);
        totalResponseTimeHours += diffHours;
        responseCount++;
      }
    });

    const avgResponseTimeHours =
      responseCount > 0 ? parseFloat((totalResponseTimeHours / responseCount).toFixed(2)) : null;

    // Format top and recent reviews
    const formatReview = (review: { profiles?: Array<{ full_name?: string; avatar_url?: string }> | { full_name?: string; avatar_url?: string } }) => {
      const profile = Array.isArray(review.profiles) ? review.profiles[0] : review.profiles;
      return {
        ...review,
        user_full_name: profile?.full_name || 'Anonymous',
        user_avatar_url: profile?.avatar_url,
        profiles: undefined,
      };
    };

    const formattedTopReviews = topReviews?.map(formatReview) || [];
    const formattedRecentReviews = recentReviews?.map(formatReview) || [];

    // Build response
    const summary = {
      total_reviews: analytics?.total_reviews || 0,
      average_rating: analytics?.average_rating || 0,
      rating_distribution: {
        5: analytics?.rating_5_count || 0,
        4: analytics?.rating_4_count || 0,
        3: analytics?.rating_3_count || 0,
        2: analytics?.rating_2_count || 0,
        1: analytics?.rating_1_count || 0,
      },
      response_rate: analytics?.response_rate || 0,
      recommend_rate: analytics?.recommend_rate || 0,
      recent_reviews: {
        last_7_days: analytics?.reviews_last_7_days || 0,
        last_30_days: analytics?.reviews_last_30_days || 0,
      },
      avg_response_time_hours: avgResponseTimeHours,
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        top_reviews: formattedTopReviews,
        recent_reviews: formattedRecentReviews,
        rating_trend: trendByMonth,
        last_calculated_at: analytics?.last_calculated_at,
      },
    });
  } catch (error) {
    console.error('Review analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

