import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";

/**
 * POST /api/content/flag
 * Flag/report content (Public - authenticated users can flag)
 * Body: {
 *   contentType: 'article' | 'hospital' | 'review' | 'comment' | 'product' | 'event' | 'user_profile' | 'message',
 *   contentId: string,
 *   flagType: 'spam' | 'inappropriate' | 'harassment' | 'false_information' | 'copyright' | 'other',
 *   reason?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json() as {
      contentType?: string;
      contentId?: string;
      flagType?: string;
      reason?: string;
    };
    const { contentType, contentId, flagType, reason } = body;

    if (!contentType || !contentId || !flagType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: contentType, contentId, flagType' },
        { status: 400 }
      );
    }

    const validContentTypes = ['article', 'hospital', 'review', 'comment', 'product', 'event', 'user_profile', 'message'];
    if (!validContentTypes.includes(contentType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid content type' },
        { status: 400 }
      );
    }

    const validFlagTypes = ['spam', 'inappropriate', 'harassment', 'false_information', 'copyright', 'other'];
    if (!validFlagTypes.includes(flagType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid flag type' },
        { status: 400 }
      );
    }

    // Check if user already flagged this content with same flag type
    const { data: existingFlag } = await supabase
      .from('content_flags')
      .select('id')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .eq('reported_by', user.id)
      .eq('flag_type', flagType)
      .maybeSingle();

    if (existingFlag) {
      return NextResponse.json(
        { success: false, error: 'You have already flagged this content' },
        { status: 400 }
      );
    }

    // Create flag
    const { data: flag, error } = await supabase
      .from('content_flags')
      .insert({
        content_type: contentType,
        content_id: contentId,
        flag_type: flagType,
        reason: reason || null,
        reported_by: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Send notifications to all admin users
    try {
      // Get all admin users
      const { data: adminUsers, error: adminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (!adminError && adminUsers && adminUsers.length > 0) {
        // Get content title/name for notification message
        let contentTitle = `${contentType} #${contentId.substring(0, 8)}`;
        const tableMap: Record<string, string> = {
          article: 'articles',
          hospital: 'hospitals',
          product: 'products',
          event: 'events',
        };

        const table = tableMap[contentType];
        if (table) {
          const { data: contentData } = await supabase
            .from(table)
            .select('name, name_thai, name_english, title')
            .eq('id', contentId)
            .maybeSingle();

          if (contentData) {
            contentTitle = contentData.title || contentData.name_thai || contentData.name_english || contentData.name || contentTitle;
          }
        }

        // Create notifications for all admins
        const notifications = adminUsers.map((admin) => ({
          user_id: admin.user_id,
          type: 'content_flag',
          title: '🚩 มีเนื้อหาใหม่ที่ถูกแจ้งเตือน',
          message: `เนื้อหา "${contentTitle}" ถูกแจ้งเตือนเป็น ${flagType}`,
          link_url: `/admin/dashboard/moderation`,
          metadata: {
            flag_id: flag.id,
            content_type: contentType,
            content_id: contentId,
            flag_type: flagType,
            reported_by: user.id,
            reason: reason || null,
          },
        }));

        // Insert notifications in batch
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notificationError) {
          console.error('Error creating admin notifications:', notificationError);
          // Don't fail the request if notification fails
        } else {
          console.log(`Sent content flag notifications to ${adminUsers.length} admin(s)`);
        }
      }
    } catch (notificationErr) {
      console.error('Error sending admin notifications:', notificationErr);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      data: flag,
    });
  } catch (error) {
    console.error('Flag content error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to flag content' },
      { status: 500 }
    );
  }
}

