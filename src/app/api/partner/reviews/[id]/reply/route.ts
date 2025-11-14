import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

/**
 * POST /api/partner/reviews/[id]/reply
 * Reply to a review
 * Body: { message }
 */
export async function POST(
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
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get review and verify it exists
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

    // Check if user is the gym owner
    const isGymOwner = (review as any).gyms?.user_id === user.id;

    // Check if user is admin
    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = role?.role === 'admin';

    if (!isGymOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only gym owner can reply to reviews' },
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
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get existing reply
    const { data: reply, error: replyError } = await supabase
      .from('review_replies')
      .select('*')
      .eq('review_id', reviewId)
      .single();

    if (replyError || !reply) {
      return NextResponse.json(
        { success: false, error: 'Reply not found' },
        { status: 404 }
      );
    }

    // Check if user is the reply owner or admin
    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

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

    // Get existing reply
    const { data: reply, error: replyError } = await supabase
      .from('review_replies')
      .select('*')
      .eq('review_id', reviewId)
      .single();

    if (replyError || !reply) {
      return NextResponse.json(
        { success: false, error: 'Reply not found' },
        { status: 404 }
      );
    }

    // Check if user is the reply owner or admin
    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

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

