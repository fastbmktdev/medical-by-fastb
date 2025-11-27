import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';

/**
 * PATCH /api/admin/moderation/flags/[id]
 * Update flag status (Admin only)
 * Body: {
 *   status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'resolved',
 *   moderationNotes?: string
 * }
 */
export const PATCH = withAdminAuth<{ id: string }>(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  user
) => {
  try {
    const supabase = await createServerClient();
    const { id } = await context.params;
    const body = await request.json() as {
      status?: string;
      moderationNotes?: string;
    };
    const { status, moderationNotes } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    if (!['pending', 'reviewed', 'approved', 'rejected', 'resolved'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get flag details
    const { data: flag, error: flagError } = await supabase
      .from('content_flags')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (flagError || !flag) {
      return NextResponse.json(
        { success: false, error: 'Flag not found' },
        { status: 404 }
      );
    }

    // Update flag
    const updateData: Record<string, unknown> = {
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    };

    if (moderationNotes) {
      updateData.moderation_notes = moderationNotes;
    }

    const { data: updatedFlag, error: updateError } = await supabase
      .from('content_flags')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log moderation action
    await supabase
      .from('content_moderation_log')
      .insert({
        content_type: flag.content_type,
        content_id: flag.content_id,
        action: status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'flag',
        action_reason: moderationNotes,
        moderated_by: user.id,
        flag_id: id,
        content_snapshot: flag.metadata,
      });

    return NextResponse.json({
      success: true,
      data: updatedFlag,
    });
  } catch (error) {
    console.error('Update flag error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update flag' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/admin/moderation/flags/[id]
 * Delete flag (Admin only)
 */
export const DELETE = withAdminAuth<{ id: string }>(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  _user
) => {
  try {
    const supabase = await createServerClient();
    const { id } = await context.params;

    const { error } = await supabase
      .from('content_flags')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Delete flag error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete flag' },
      { status: 500 }
    );
  }
});

