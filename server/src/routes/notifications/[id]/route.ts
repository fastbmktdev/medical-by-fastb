import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";

/**
 * Update Notification API
 * PUT /api/notifications/[id]
 * Body: { is_read?: boolean }
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await context.params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as {
      is_read?: boolean;
    };
    const { is_read } = body;

    const updateData: Record<string, unknown> = {};
    if (is_read !== undefined) {
      updateData.is_read = is_read;
    }

    const { data, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update notification error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update notification' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Notification updated',
    });

  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete Notification API
 * DELETE /api/notifications/[id]
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await context.params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete notification error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

