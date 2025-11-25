import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';

/**
 * POST /api/admin/moderation/actions
 * Perform moderation action on content (Admin only)
 * Body: {
 *   contentType: 'article' | 'hospital' | 'review' | 'comment' | 'product' | 'user_profile' | 'message',
 *   contentId: string,
 *   action: 'approve' | 'reject' | 'delete' | 'edit' | 'hide' | 'unhide',
 *   actionReason?: string,
 *   flagId?: string
 * }
 */
export const POST = withAdminAuth<Record<string, never>>(async (
  request: NextRequest,
  _context: { params: Promise<Record<string, never>> },
  user
) => {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { contentType, contentId, action, actionReason, flagId } = body;

    if (!contentType || !contentId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: contentType, contentId, action' },
        { status: 400 }
      );
    }

    const validActions = ['approve', 'reject', 'delete', 'edit', 'hide', 'unhide'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get content snapshot before action (for audit)
    let contentSnapshot: Record<string, unknown> | null = null;
    try {
      const tableMap: Record<string, string> = {
        article: 'articles',
        hospital: 'hospitals',
        product: 'products',
        user_profile: 'user_profiles',
      };

      const table = tableMap[contentType];
      if (table) {
        const { data: content } = await supabase
          .from(table)
          .select('*')
          .eq('id', contentId)
          .maybeSingle();
        contentSnapshot = content;
      }
    } catch (error) {
      console.warn('Could not fetch content snapshot:', error);
    }

    // Perform action based on type
    let updateData: Record<string, unknown> = {};

    switch (action) {
      case 'approve':
        if (contentType === 'article') updateData = { is_published: true };
        else if (contentType === 'hospital') updateData = { is_approved: true, status: 'approved' };
        else if (contentType === 'product') updateData = { is_published: true };
        break;
      case 'reject':
        if (contentType === 'article') updateData = { is_published: false };
        else if (contentType === 'hospital') updateData = { is_approved: false, status: 'rejected' };
        else if (contentType === 'product') updateData = { is_published: false };
        break;
      case 'hide':
        // Add is_hidden flag if table supports it
        updateData = { is_hidden: true };
        break;
      case 'unhide':
        updateData = { is_hidden: false };
        break;
      case 'delete':
        // Delete will be handled separately
        break;
    }

    // Update or delete content
    if (action === 'delete') {
      const tableMap: Record<string, string> = {
        article: 'articles',
        hospital: 'hospitals',
        product: 'products',
      };

      const table = tableMap[contentType];
      if (table) {
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('id', contentId);

        if (deleteError) {
          throw deleteError;
        }
      }
    } else if (Object.keys(updateData).length > 0) {
      const tableMap: Record<string, string> = {
        article: 'articles',
        hospital: 'hospitals',
        product: 'products',
      };

      const table = tableMap[contentType];
      if (table) {
        const { error: updateError } = await supabase
          .from(table)
          .update(updateData)
          .eq('id', contentId);

        if (updateError) {
          throw updateError;
        }
      }
    }

    // Log moderation action
    const { data: logEntry, error: logError } = await supabase
      .from('content_moderation_log')
      .insert({
        content_type: contentType,
        content_id: contentId,
        action,
        action_reason: actionReason || null,
        moderated_by: user.id,
        flag_id: flagId || null,
        content_snapshot: contentSnapshot,
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging moderation action:', logError);
      // Don't fail the request if logging fails
    }

    // Update flag status if flagId is provided
    if (flagId) {
      await supabase
        .from('content_flags')
        .update({
          status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'resolved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          moderation_notes: actionReason || null,
        })
        .eq('id', flagId);
    }

    return NextResponse.json({
      success: true,
      data: logEntry,
    });
  } catch (error) {
    console.error('Moderation action error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform moderation action' },
      { status: 500 }
    );
  }
});

