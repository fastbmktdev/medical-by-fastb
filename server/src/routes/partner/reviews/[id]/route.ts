import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";

/**
 * GET /api/partner/reviews/[id]
 * Get a specific review by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const reviewId = id;

    // Get review with user and reply details
    const { data: review, error: reviewError } = await supabase
      .from('hospital_reviews')
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        ),
        hospitals:hospital_id (
          id,
          hospital_name,
          slug,
          user_id
        ),
        review_replies (
          id,
          user_id,
          message,
          created_at,
          is_edited,
          edited_at
        )
      `)
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = role?.role === 'admin';
    const reviewData = review as {
      hospitals?: { user_id: string; hospital_name?: string; slug?: string };
      profiles?: { full_name?: string; avatar_url?: string };
      review_replies?: Array<Record<string, unknown>>;
      user_id: string;
    };
    const isHospitalOwner = reviewData.hospitals?.user_id === user.id;
    const isReviewer = reviewData.user_id === user.id;

    // Partners can only see reviews for their hospital
    // Reviewers can see their own reviews
    // Admins can see all reviews
    if (!isAdmin && !isHospitalOwner && !isReviewer) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Format response
    const formattedReview = {
      ...review,
      user_full_name: reviewData.profiles?.full_name,
      user_avatar_url: reviewData.profiles?.avatar_url,
      hospital_name: reviewData.hospitals?.hospital_name,
      hospital_slug: reviewData.hospitals?.slug,
      reply: reviewData.review_replies?.[0] || null,
      profiles: undefined,
      hospitals: undefined,
      review_replies: undefined,
    };

    return NextResponse.json({
      success: true,
      data: formattedReview,
    });
  } catch (error) {
    console.error('Get review error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/partner/reviews/[id]
 * Update review status (for moderation)
 * Body: { status, moderation_reason }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const reviewId = id;
    const body = await request.json() as {
      status?: string;
      moderation_reason?: string;
    };
    const { status, moderation_reason } = body;

    // Get review
    const { data: review, error: reviewError } = await supabase
      .from('hospital_reviews')
      .select('*, hospitals!inner(user_id)')
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check permissions - only hospital owner or admin can moderate
    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = role?.role === 'admin';
    const isHospitalOwner = (review as { hospitals?: { user_id: string } }).hospitals?.user_id === user.id;

    if (!isAdmin && !isHospitalOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only hospital owner or admin can moderate reviews' },
        { status: 403 }
      );
    }

    // Update review
    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;
      updateData.moderated_by = user.id;
      updateData.moderated_at = new Date().toISOString();
    }

    if (moderation_reason) {
      updateData.moderation_reason = moderation_reason;
    }

    const { data: updatedReview, error: updateError } = await supabase
      .from('hospital_reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating review:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update review' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedReview,
    });
  } catch (error) {
    console.error('Update review error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/partner/reviews/[id]
 * Delete a review (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (role?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const reviewId = id;

    // Delete review
    const { error: deleteError } = await supabase
      .from('hospital_reviews')
      .delete()
      .eq('id', reviewId);

    if (deleteError) {
      console.error('Error deleting review:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete review' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

