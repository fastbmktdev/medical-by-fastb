import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { sanitizeHTML } from '@shared/lib/utils/sanitize';
import { logAuditEvent } from '@shared/lib/utils';

/**
 * Update Bio API
 * PUT /api/users/profile/bio
 * 
 * Body:
 * {
 *   bio: string (max 500 characters)
 * }
 */

const MAX_BIO_LENGTH = 500;

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    let { bio } = body;

    // Sanitize HTML content to prevent XSS attacks
    if (bio && typeof bio === 'string') {
      bio = sanitizeHTML(bio);
    }

    // Validate bio length (after sanitization)
    if (bio && bio.length > MAX_BIO_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Bio must be ${MAX_BIO_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Fetch existing bio for audit logging
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('bio')
      .eq('user_id', user.id)
      .maybeSingle();

    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .update({ bio: bio || null })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update bio error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update bio' },
        { status: 500 }
      );
    }

    await logAuditEvent({
      supabase,
      request,
      user,
      action: bio ? 'update' : 'delete',
      resourceType: 'profile',
      resourceId: user.id,
      resourceName: user.email ?? user.id,
      description: bio ? 'Updated profile bio' : 'Cleared profile bio',
      oldValues: existingProfile ? { bio: existingProfile.bio } : null,
      newValues: { bio: data.bio },
      metadata: {
        sanitized: Boolean(bio),
        previousLength: existingProfile?.bio?.length ?? 0,
        newLength: data.bio?.length ?? 0,
      },
      severity: 'low',
    });

    return NextResponse.json({
      success: true,
      data: {
        bio: data.bio,
        message: 'Bio updated successfully'
      }
    });

  } catch (error) {
    console.error('Update bio error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get Bio API
 * GET /api/users/profile/bio
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get profile
    const { data, error } = await supabase
      .from('profiles')
      .select('bio')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Get bio error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to get bio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        bio: data?.bio || null
      }
    });

  } catch (error) {
    console.error('Get bio error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

