import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";

/**
 * Get Connected Accounts API
 * GET /api/users/connected-accounts
 * Returns connected OAuth accounts from Supabase Auth using getUserIdentities()
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

    // Get all user identities using the proper Supabase Auth API
    const { data: identitiesData, error: identitiesError } = await supabase.auth.getUserIdentities();
    
    if (identitiesError) {
      console.error('Get identities error:', identitiesError);
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve connected accounts' },
        { status: 500 }
      );
    }

    if (!identitiesData || !identitiesData.identities) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Filter to only OAuth providers (exclude email and phone)
    const oauthAccounts = identitiesData.identities
      .filter(identity => identity.provider !== 'email' && identity.provider !== 'phone')
      .map(identity => ({
        id: identity.id,
        provider: identity.provider,
        email: identity.identity_data?.email || user.email,
        name: identity.identity_data?.full_name || identity.identity_data?.name || user.user_metadata?.full_name,
        avatar_url: identity.identity_data?.avatar_url || user.user_metadata?.avatar_url,
        created_at: identity.created_at || user.created_at,
      }));

    return NextResponse.json({
      success: true,
      data: oauthAccounts
    });

  } catch (error) {
    console.error('Get connected accounts error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Disconnect Account API
 * DELETE /api/users/connected-accounts?provider=google
 * 
 * Note: This endpoint is kept for backward compatibility, but unlinking is now
 * done client-side using unlinkIdentity() which works when user has at least 2 identities.
 * For full identity removal, consider using Supabase Admin API with SERVICE_ROLE_KEY.
 */
export async function DELETE(request: NextRequest) {
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
    const provider = searchParams.get('provider');

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider parameter is required' },
        { status: 400 }
      );
    }

    const validProviders = ['google', 'facebook', 'apple'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { success: false, error: 'Invalid provider' },
        { status: 400 }
      );
    }

    // Get all user identities
    const { data: identitiesData, error: identitiesError } = await supabase.auth.getUserIdentities();
    
    if (identitiesError) {
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve connected accounts' },
        { status: 500 }
      );
    }

    if (!identitiesData || !identitiesData.identities) {
      return NextResponse.json(
        { success: false, error: 'No connected accounts found' },
        { status: 404 }
      );
    }

    // Check if user has at least 2 identities (required for unlinking)
    if (identitiesData.identities.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Cannot disconnect the only authentication method. Please add email/password authentication first.' },
        { status: 400 }
      );
    }

    // Find the identity to unlink
    const identityToUnlink = identitiesData.identities.find(
      (identity) => identity.provider === provider
    );

    if (!identityToUnlink) {
      return NextResponse.json(
        { success: false, error: `No ${provider} account found to disconnect` },
        { status: 404 }
      );
    }

    // Attempt to unlink the identity
    // Note: Server-side unlinking may require admin privileges
    // For now, we'll return a message directing users to use client-side method
    return NextResponse.json({
      success: false,
      error: 'Server-side unlinking requires admin privileges. Please use the client-side unlinkIdentity() method instead.',
      message: 'For best results, use the client-side unlinking method in the UI.'
    }, { status: 501 }); // 501 Not Implemented

  } catch (error) {
    console.error('Disconnect account error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

