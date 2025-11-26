import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

/**
 * GET /api/partner/reviews
 * Get reviews for partner's hospital
 * Query params: status, rating, limit, offset, sort_by, sort_order
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

    // Check if user is a partner
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

    // Get partner's hospital
    const { data: hospital } = await supabase
      .from('hospitals')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!hospital && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'No hospital found for this partner' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const hospitalId = searchParams.get('hospital_id') || hospital?.id;
    const status = searchParams.get('status') as string | null;
    const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : null;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = (searchParams.get('sort_by') || 'created_at') as 'created_at' | 'rating' | 'helpful_count';
    const sortOrder = (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc';

    if (!hospitalId) {
      return NextResponse.json(
        { success: false, error: 'hospital_id is required' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('hospital_reviews')
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        ),
        review_replies (
          id,
          message,
          created_at,
          is_edited
        )
      `, { count: 'exact' })
      .eq('hospital_id', hospitalId);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (rating) {
      query = query.eq('rating', rating);
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: reviews, error: reviewsError, count } = await query;

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    // Format response
    const formattedReviews = reviews?.map((review: { profiles?: { full_name?: string; avatar_url?: string }; review_replies?: Array<Record<string, unknown>> }) => ({
      ...review,
      user_full_name: review.profiles?.full_name,
      user_avatar_url: review.profiles?.avatar_url,
      reply: review.review_replies?.[0] || null,
      profiles: undefined,
      review_replies: undefined,
    }));

    return NextResponse.json({
      success: true,
      data: {
        reviews: formattedReviews || [],
        total: count || 0,
        page: Math.floor(offset / limit) + 1,
        limit,
        has_more: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Reviews API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/partner/reviews
 * Create a new review (for testing or admin purposes)
 * Body: { hospital_id, rating, title, comment, visit_date, recommend, booking_id }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as {
      hospital_id?: string;
      rating?: number;
      title?: string;
      comment?: string;
      visit_date?: string;
      recommend?: boolean;
      booking_id?: string;
    };
    const { hospital_id, rating, title, comment, visit_date, recommend, booking_id } = body;

    // Validate required fields
    if (!hospital_id || !rating || !comment) {
      return NextResponse.json(
        { success: false, error: 'hospital_id, rating, and comment are required' },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if hospital exists
    const { data: hospital, error: hospitalError } = await supabase
      .from('hospitals')
      .select('id')
      .eq('id', hospital_id)
      .single();

    if (hospitalError || !hospital) {
      return NextResponse.json(
        { success: false, error: 'hospital not found' },
        { status: 404 }
      );
    }

    // Check if user already reviewed this hospital
    const { data: existingReview } = await supabase
      .from('hospital_reviews')
      .select('id')
      .eq('hospital_id', hospital_id)
      .eq('user_id', user.id)
      .is('google_review_id', null)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'You have already reviewed this hospital' },
        { status: 400 }
      );
    }

    // Create review
    const { data: review, error: createError } = await supabase
      .from('hospital_reviews')
      .insert({
        hospital_id,
        user_id: user.id,
        rating,
        title: title || null,
        comment,
        visit_date: visit_date || null,
        recommend: recommend !== undefined ? recommend : true,
        booking_id: booking_id || null,
        status: 'approved', // Auto-approve for now
        is_verified_visit: !!booking_id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating review:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to create review' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

