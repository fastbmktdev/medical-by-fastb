import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

/**
 * GET /api/partner/reviews/stats
 * Get review statistics for partner's hospital
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

    // Get review counts by status
    const { data: reviews } = await supabase
      .from('hospital_reviews')
      .select('status, rating, has_response')
      .eq('hospital_id', hospitalId);

    // Calculate statistics
    const stats = {
      total: reviews?.length || 0,
      pending: reviews?.filter((r) => r.status === 'pending').length || 0,
      approved: reviews?.filter((r) => r.status === 'approved').length || 0,
      rejected: reviews?.filter((r) => r.status === 'rejected').length || 0,
      hidden: reviews?.filter((r) => r.status === 'hidden').length || 0,
      flagged: reviews?.filter((r) => r.status === 'flagged').length || 0,
      with_response: reviews?.filter((r) => r.has_response).length || 0,
      without_response: reviews?.filter((r) => !r.has_response).length || 0,
      average_rating: 0,
    };

    // Calculate average rating (approved reviews only)
    const approvedReviews = reviews?.filter((r) => r.status === 'approved') || [];
    if (approvedReviews.length > 0) {
      const totalRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0);
      stats.average_rating = parseFloat((totalRating / approvedReviews.length).toFixed(2));
    }

    // Get pending reviews that need attention
    const { data: pendingReviews, count: pendingCount } = await supabase
      .from('hospital_reviews')
      .select('id, rating, created_at', { count: 'exact' })
      .eq('hospital_id', hospitalId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    // Get reviews without responses
    const { data: unansweredReviews, count: unansweredCount } = await supabase
      .from('hospital_reviews')
      .select('id, rating, created_at', { count: 'exact' })
      .eq('hospital_id', hospitalId)
      .eq('status', 'approved')
      .eq('has_response', false)
      .order('created_at', { ascending: true })
      .limit(10);

    // Get flagged reviews
    const { data: flaggedReviews, count: flaggedCount } = await supabase
      .from('hospital_reviews')
      .select('id, rating, flag_count, created_at', { count: 'exact' })
      .eq('hospital_id', hospitalId)
      .gt('flag_count', 0)
      .order('flag_count', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        needs_attention: {
          pending: {
            count: pendingCount || 0,
            reviews: pendingReviews || [],
          },
          unanswered: {
            count: unansweredCount || 0,
            reviews: unansweredReviews || [],
          },
          flagged: {
            count: flaggedCount || 0,
            reviews: flaggedReviews || [],
          },
        },
      },
    });
  } catch (error) {
    console.error('Review stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

