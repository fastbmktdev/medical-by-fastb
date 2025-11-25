import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

/**
 * POST /api/partner/reviews/google/connect
 * Initiate Google Business Profile OAuth flow
 * Body: { hospital_id, google_place_id? }
 */
export async function POST(request: NextRequest) {
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
    const { hospital_id, google_place_id } = body;

    if (!hospital_id) {
      return NextResponse.json(
        { success: false, error: 'hospital_id is required' },
        { status: 400 }
      );
    }

    // Verify hospital ownership
    const { data: hospital } = await supabase
      .from('hospitals')
      .select('id, user_id')
      .eq('id', hospital_id)
      .single();

    if (!hospital || hospital.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'hospital not found or access denied' },
        { status: 403 }
      );
    }

    // Check if Google OAuth credentials are configured
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google OAuth is not configured. Please contact administrator.',
          details: 'Missing GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI environment variables',
        },
        { status: 503 }
      );
    }

    // Create or update sync record
    const { data: syncRecord } = await supabase
      .from('google_reviews_sync')
      .upsert(
        {
          hospital_id,
          google_place_id: google_place_id || null,
          sync_status: 'pending',
        },
        { onConflict: 'hospital_id' }
      )
      .select()
      .single();

    // Generate OAuth URL
    const scopes = [
      'https://www.googleapis.com/auth/business.manage',
    ];

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state: JSON.stringify({ hospital_id, user_id: user.id }),
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return NextResponse.json({
      success: true,
      data: {
        auth_url: authUrl,
        sync_record: syncRecord,
      },
      message: 'Please authorize access to your Google Business Profile',
    });
  } catch (error) {
    console.error('Google connect error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

