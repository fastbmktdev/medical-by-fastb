import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

/**
 * POST /api/content/flag
 * Flag/report content (Public - authenticated users can flag)
 * Body: {
 *   contentType: 'article' | 'gym' | 'review' | 'comment' | 'product' | 'event' | 'user_profile' | 'message',
 *   contentId: string,
 *   flagType: 'spam' | 'inappropriate' | 'harassment' | 'false_information' | 'copyright' | 'other',
 *   reason?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { contentType, contentId, flagType, reason } = body;

    if (!contentType || !contentId || !flagType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: contentType, contentId, flagType' },
        { status: 400 }
      );
    }

    const validContentTypes = ['article', 'gym', 'review', 'comment', 'product', 'event', 'user_profile', 'message'];
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

