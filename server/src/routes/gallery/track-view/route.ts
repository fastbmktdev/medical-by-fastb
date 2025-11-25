import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

/**
 * POST /api/gallery/track-view
 * Track an image view (public endpoint)
 * Body: { image_id, hospital_id, session_id }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { image_id, hospital_id, session_id } = body;

    if (!image_id || !hospital_id) {
      return NextResponse.json(
        { success: false, error: 'image_id and hospital_id are required' },
        { status: 400 }
      );
    }

    // Get viewer info from request
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || null;

    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    const viewerId = user?.id || null;

    // Record the view using the database function
    const { error } = await supabase.rpc('record_image_view', {
      p_image_id: image_id,
      p_hospital_id: hospital_id,
      p_viewer_ip: ip,
      p_viewer_user_agent: userAgent,
      p_viewer_id: viewerId,
      p_referrer: referrer,
      p_session_id: session_id || `anon-${Date.now()}`,
    });

    if (error) {
      console.error('Error recording view:', error);
      // Don't fail the request if analytics fail
      return NextResponse.json({
        success: true,
        message: 'View tracking skipped',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'View tracked successfully',
    });
  } catch (error) {
    console.error('Track view error:', error);
    // Don't fail loudly - analytics shouldn't break user experience
    return NextResponse.json(
      { success: true, message: 'View tracking skipped' },
      { status: 200 }
    );
  }
}

