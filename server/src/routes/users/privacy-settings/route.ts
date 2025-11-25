import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

/**
 * Get Privacy Settings API
 * GET /api/users/privacy-settings
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

    const { data, error } = await supabase
      .from('user_privacy_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Get privacy settings error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to get privacy settings' },
        { status: 500 }
      );
    }

    // Return default settings if not found
    const defaultSettings = {
      profile_visibility: 'public',
      show_email: false,
      show_phone: false,
      show_training_history: true,
      show_achievements: true,
      show_social_links: true
    };

    return NextResponse.json({
      success: true,
      data: data || defaultSettings
    });

  } catch (error) {
    console.error('Get privacy settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update Privacy Settings API
 * PUT /api/users/privacy-settings
 * 
 * Body:
 * {
 *   profile_visibility?: 'public' | 'private' | 'friends_only',
 *   show_email?: boolean,
 *   show_phone?: boolean,
 *   show_training_history?: boolean,
 *   show_achievements?: boolean,
 *   show_social_links?: boolean
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.profile_visibility !== undefined) {
      const validVisibilities = ['public', 'private', 'friends_only'];
      if (!validVisibilities.includes(body.profile_visibility)) {
        return NextResponse.json(
          { success: false, error: 'Invalid profile_visibility' },
          { status: 400 }
        );
      }
      updateData.profile_visibility = body.profile_visibility;
    }
    if (body.show_email !== undefined) updateData.show_email = body.show_email;
    if (body.show_phone !== undefined) updateData.show_phone = body.show_phone;
    if (body.show_training_history !== undefined) updateData.show_training_history = body.show_training_history;
    if (body.show_achievements !== undefined) updateData.show_achievements = body.show_achievements;
    if (body.show_social_links !== undefined) updateData.show_social_links = body.show_social_links;

    // Upsert privacy settings
    const { data, error } = await supabase
      .from('user_privacy_settings')
      .upsert({
        user_id: user.id,
        ...updateData
      })
      .select()
      .single();

    if (error) {
      console.error('Update privacy settings error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update privacy settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Privacy settings updated successfully'
    });

  } catch (error) {
    console.error('Update privacy settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

