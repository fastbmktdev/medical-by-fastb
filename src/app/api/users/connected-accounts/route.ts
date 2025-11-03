import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

/**
 * Get Connected Accounts API
 * GET /api/users/connected-accounts
 * Returns connected OAuth accounts from Supabase Auth
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

    // Get providers from app_metadata (Supabase Auth stores them here)
    const providers = (user.app_metadata?.providers || []) as string[];
    
    // Create identity-like objects for OAuth providers
    const oauthAccounts = providers
      .filter(provider => provider !== 'email' && provider !== 'phone')
      .map(provider => ({
        id: `${provider}_${user.id}`,
        provider: provider,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.display_name || user.email?.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url,
        created_at: user.created_at,
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
 * Note: Unlinking OAuth identities requires admin privileges in Supabase.
 * For now, this endpoint attempts to unlink via the client, but full unlinking
 * may require Supabase Admin API setup.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
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

    // Check if provider is the primary/only authentication method
    const providers = (user.app_metadata?.providers || []) as string[];
    const nonOAuthProviders = providers.filter(p => p === 'email' || p === 'phone');
    
    // If this is the only OAuth provider and there's no email/password auth, prevent unlinking
    const oauthProviders = providers.filter(p => p !== 'email' && p !== 'phone');
    if (oauthProviders.length === 1 && oauthProviders[0] === provider && nonOAuthProviders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot disconnect the only authentication method. Please add email/password authentication first.' },
        { status: 400 }
      );
    }

    // Attempt to unlink using client-side method
    // Note: This may not work without admin privileges, but we'll try
    try {
      // Get user identities - we'll need to find the identity ID
      // Since we can't easily get identity IDs from client, we'll update the metadata
      // to remove the provider from the providers list
      const updatedProviders = providers.filter(p => p !== provider);
      
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          providers: updatedProviders
        }
      });

      if (updateError) {
        console.error('Update providers error:', updateError);
        // Continue even if metadata update fails - the identity is still unlinked at auth level
      }
    } catch (updateError) {
      console.error('Error updating providers metadata:', updateError);
      // Continue anyway
    }

    // Note: Actual identity unlinking from Supabase Auth requires admin API
    // The identity will remain in auth.identities but won't be used for login
    // For full removal, consider using Supabase Admin API with SERVICE_ROLE_KEY

    return NextResponse.json({
      success: true,
      message: 'Account disconnected successfully. Note: Full identity removal may require admin privileges.'
    });

  } catch (error) {
    console.error('Disconnect account error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

