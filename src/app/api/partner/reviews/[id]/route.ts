import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

/**
 * GET /api/partner/reviews/[id]
 * Get a specific review by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
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
      .from('gym_reviews')
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        ),
        gyms:gym_id (
          id,
          gym_name,
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
      gyms?: { user_id: string; gym_name?: string; slug?: string };
      profiles?: { full_name?: string; avatar_url?: string };
      review_replies?: Array<Record<string, unknown>>;
      user_id: string;
    };
    const isGymOwner = reviewData.gyms?.user_id === user.id;
    const isReviewer = reviewData.user_id === user.id;

    // Partners can only see reviews for their gym
    // Reviewers can see their own reviews
    // Admins can see all reviews
    if (!isAdmin && !isGymOwner && !isReviewer) {
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
      gym_name: reviewData.gyms?.gym_name,
      gym_slug: reviewData.gyms?.slug,
      reply: reviewData.review_replies?.[0] || null,
      profiles: undefined,
      gyms: undefined,
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
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const reviewId = id;
    const body = await request.json();
    const { status, moderation_reason } = body;

    // Get review
    const { data: review, error: reviewError } = await supabase
      .from('gym_reviews')
      .select('*, gyms!inner(user_id)')
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check permissions - only gym owner or admin can moderate
    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = role?.role === 'admin';
    const isGymOwner = (review as { gyms?: { user_id: string } }).gyms?.user_id === user.id;

    if (!isAdmin && !isGymOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only gym owner or admin can moderate reviews' },
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
      .from('gym_reviews')
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
    const supabase = await createClient();
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
      .from('gym_reviews')
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

