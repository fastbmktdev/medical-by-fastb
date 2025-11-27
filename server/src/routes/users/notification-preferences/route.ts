import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";

/**
 * Get Notification Preferences API
 * GET /api/users/notification-preferences
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

    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Get notification preferences error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to get notification preferences' },
        { status: 500 }
      );
    }

    // Return default preferences if not found
    const defaultPreferences = {
      email_enabled: true,
      in_app_enabled: true,
      booking_confirmation: true,
      booking_reminder: true,
      gamification_updates: true,
      promotions_news: true,
      partner_messages: true
    };

    return NextResponse.json({
      success: true,
      data: data || defaultPreferences
    });

  } catch (error) {
    console.error('Get notification preferences error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update Notification Preferences API
 * PUT /api/users/notification-preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.email_enabled !== undefined) updateData.email_enabled = body.email_enabled;
    if (body.in_app_enabled !== undefined) updateData.in_app_enabled = body.in_app_enabled;
    if (body.booking_confirmation !== undefined) updateData.booking_confirmation = body.booking_confirmation;
    if (body.booking_reminder !== undefined) updateData.booking_reminder = body.booking_reminder;
    if (body.gamification_updates !== undefined) updateData.gamification_updates = body.gamification_updates;
    if (body.promotions_news !== undefined) updateData.promotions_news = body.promotions_news;
    if (body.partner_messages !== undefined) updateData.partner_messages = body.partner_messages;

    // Upsert notification preferences
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: user.id,
        ...updateData
      })
      .select()
      .single();

    if (error) {
      console.error('Update notification preferences error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update notification preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Notification preferences updated successfully'
    });

  } catch (error) {
    console.error('Update notification preferences error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

