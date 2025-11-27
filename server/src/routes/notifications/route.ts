import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";

/**
 * Get User Notifications API
 * GET /api/notifications?unread=true&limit=20
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get notifications error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to get notifications' },
        { status: 500 }
      );
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    return NextResponse.json({
      success: true,
      data: data || [],
      unread_count: unreadCount || 0,
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create Notification API
 * POST /api/notifications
 * Body: { type, title, message, link_url?, metadata? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as {
      type?: string;
      title?: string;
      message?: string;
      link_url?: string;
      metadata?: Record<string, unknown>;
      target_user_id?: string;
    };
    const { type, title, message, link_url, metadata, target_user_id } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, title, message' },
        { status: 400 }
      );
    }

    const validTypes = [
      'booking_confirmation',
      'booking_reminder',
      'event_reminder',
      'booking_cancelled',
      'payment_received',
      'payment_failed',
      'badge_earned',
      'level_up',
      'points_awarded',
      'challenge_complete',
      'promotion',
      'system',
      'partner_message',
      'content_flag',
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    // Use target_user_id if provided (for admin/system), otherwise use current user
    const userId = target_user_id || user.id;

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link_url: link_url || null,
        metadata: metadata || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Create notification error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Notification created',
    });

  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

