import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { logAuditEvent } from '@shared/lib/utils';

/**
 * Get Social Links API
 * GET /api/users/profile/social-links
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

    // Get social links
    const { data, error } = await supabase
      .from('user_social_links')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Get social links error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to get social links' },
        { status: 500 }
      );
    }

    const normalizedData =
      data?.map((link) => ({
        ...link,
        platform: link.platform === 'twitter' ? 'x' : link.platform,
      })) ?? [];

    return NextResponse.json({
      success: true,
      data: normalizedData
    });

  } catch (error) {
    console.error('Get social links error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update Social Links API
 * PUT /api/users/profile/social-links
 * 
 * Body:
 * {
 *   links: [
 *     { platform: 'facebook', url: 'https://...' },
 *     { platform: 'instagram', url: 'https://...' }
 *   ]
 * }
 */
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
    const { links } = body;

    if (!Array.isArray(links)) {
      return NextResponse.json(
        { success: false, error: 'Links must be an array' },
        { status: 400 }
      );
    }

    // Fetch existing links for audit logging
    const { data: existingLinks } = await supabase
      .from('user_social_links')
      .select('id, platform, url, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    const existingNormalized =
      existingLinks?.map((link) => ({
        ...link,
        platform: link.platform === 'twitter' ? 'x' : link.platform,
      })) ?? [];

    // Validate URLs
    const urlPattern = /^https?:\/\//;
    const legacyPlatformMap: Record<string, string> = { twitter: 'x' };
    const validPlatforms = ['facebook', 'instagram', 'x', 'youtube', 'tiktok'];

    const normalizedLinks = links.map((link) => ({
      ...link,
      platform: legacyPlatformMap[link.platform] ?? link.platform,
    }));

    for (const link of normalizedLinks) {
      if (!validPlatforms.includes(link.platform)) {
        return NextResponse.json(
          { success: false, error: `Invalid platform: ${link.platform}` },
          { status: 400 }
        );
      }
      if (!urlPattern.test(link.url)) {
        return NextResponse.json(
          { success: false, error: `Invalid URL for ${link.platform}` },
          { status: 400 }
        );
      }
    }

    // Delete existing links
    await supabase
      .from('user_social_links')
      .delete()
      .eq('user_id', user.id);

    // Insert new links
    if (normalizedLinks.length > 0) {
      const linksToInsert = normalizedLinks.map(link => ({
        user_id: user.id,
        platform: link.platform,
        url: link.url
      }));

      const { data: insertedLinks, error } = await supabase
        .from('user_social_links')
        .insert(linksToInsert)
        .select();

      if (error) {
        console.error('Insert social links error:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to update social links' },
          { status: 500 }
        );
      }

      await logAuditEvent({
        supabase,
        request,
        user,
        action: 'update',
        resourceType: 'profile',
        resourceId: user.id,
        resourceName: user.email ?? user.id,
        description: 'Updated social links',
        oldValues: existingNormalized.length > 0 ? { links: existingNormalized } : null,
        newValues: { links: insertedLinks ?? [] },
        metadata: {
          newCount: insertedLinks?.length ?? 0,
          previousCount: existingNormalized.length,
        },
        severity: 'low',
      });

      return NextResponse.json({
        success: true,
        data: insertedLinks,
        message: 'Social links updated successfully'
      });
    }

    await logAuditEvent({
      supabase,
      request,
      user,
      action: 'delete',
      resourceType: 'profile',
      resourceId: user.id,
      resourceName: user.email ?? user.id,
      description: 'Cleared social links',
      oldValues: existingNormalized.length > 0 ? { links: existingNormalized } : null,
      newValues: { links: [] },
      metadata: {
        previousCount: existingNormalized.length,
        newCount: 0,
      },
      severity: 'low',
    });

    return NextResponse.json({
      success: true,
      data: [],
      message: 'Social links cleared successfully'
    });

  } catch (error) {
    console.error('Update social links error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

