import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";

interface ReplyBody {
  message?: string;
}

/**
 * POST /api/partner/reviews/[id]/reply
 * Reply to a review
 * Body: { message }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;
    const reviewId = id;
    const { message } = (await request.json()) as ReplyBody;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Run queries in parallel for performance
    const [reviewResult, roleResult] = await Promise.all([
      supabase
        .from('hospital_reviews')
        .select('hospitals!inner(user_id)')
        .eq('id', reviewId)
        .single(),
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
    ]);

    const { data: review, error: reviewError } = reviewResult;
    if (reviewError || !review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }
    const { data: role } = roleResult;
    const hospitals = Array.isArray(review.hospitals) ? review.hospitals[0] : review.hospitals;
    const isHospitalOwner = hospitals?.user_id === user.id;
    const isAdmin = role?.role === 'admin';

    if (!isHospitalOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only hospital owner can reply to reviews' },
        { status: 403 }
      );
    }

    // Check if review already has a reply
    const { data: existingReply } = await supabase
      .from('review_replies')
      .select('id')
      .eq('review_id', reviewId)
      .single();

    if (existingReply) {
      return NextResponse.json(
        { success: false, error: 'Review already has a reply. Use PATCH to update it.' },
        { status: 400 }
      );
    }

    // Create reply
    const { data: reply, error: createError } = await supabase
      .from('review_replies')
      .insert({
        review_id: reviewId,
        user_id: user.id,
        message: message.trim(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating reply:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to create reply' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reply,
    });
  } catch (error) {
    console.error('Create reply error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/partner/reviews/[id]/reply
 * Update reply to a review
 * Body: { message }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;
    const reviewId = id;
    const body = (await request.json()) as ReplyBody;
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Run queries in parallel for performance
    const [replyResult, roleResult] = await Promise.all([
      supabase
        .from('review_replies')
        .select('*')
        .eq('review_id', reviewId)
        .single(),
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single(),
    ]);

    const { data: reply, error: replyError } = replyResult;

    if (replyError || !reply) {
      return NextResponse.json(
        { success: false, error: 'Reply not found' },
        { status: 404 }
      );
    }

    const { data: role } = roleResult;

    const isAdmin = role?.role === 'admin';
    const isOwner = reply.user_id === user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Can only update your own reply' },
        { status: 403 }
      );
    }

    // Update reply
    const { data: updatedReply, error: updateError } = await supabase
      .from('review_replies')
      .update({
        message: message.trim(),
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq('id', reply.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating reply:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update reply' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedReply,
    });
  } catch (error) {
    console.error('Update reply error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/partner/reviews/[id]/reply
 * Delete reply to a review
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;
    const reviewId = id;

    // Run queries in parallel for performance
    const [replyResult, roleResult] = await Promise.all([
      supabase
        .from('review_replies')
        .select('*')
        .eq('review_id', reviewId)
        .single(),
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single(),
    ]);

    const { data: reply, error: replyError } = replyResult;

    if (replyError || !reply) {
      return NextResponse.json(
        { success: false, error: 'Reply not found' },
        { status: 404 }
      );
    }

    const { data: role } = roleResult;

    const isAdmin = role?.role === 'admin';
    const isOwner = reply.user_id === user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Can only delete your own reply' },
        { status: 403 }
      );
    }

    // Delete reply
    const { error: deleteError } = await supabase
      .from('review_replies')
      .delete()
      .eq('id', reply.id);

    if (deleteError) {
      console.error('Error deleting reply:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete reply' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reply deleted successfully',
    });
  } catch (error) {
    console.error('Delete reply error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}