import { createClientForMiddleware, createAdminClient } from '@/lib/database/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Auth Callback Route Handler
 * Handles authentication callbacks from Supabase Auth
 * 
 * This route processes:
 * - Email confirmations
 * - Password reset tokens
 * - OAuth callbacks
 * - Magic link authentications
 * 
 * Note: This route is at /api/auth/callback to avoid i18n middleware processing.
 * After successful authentication, it redirects to locale-aware pages.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';
  const type = requestUrl.searchParams.get('type');
  
  // Try to detect locale from referer or default to 'th'
  const referer = request.headers.get('referer');
  let locale = 'th';
  if (referer) {
    const refererUrl = new URL(referer);
    const localeMatch = refererUrl.pathname.match(/^\/(th|en|jp)(\/|$)/);
    if (localeMatch) {
      locale = localeMatch[1];
    }
  }
  const localePrefix = `/${locale}`;

  if (code) {
    const { supabase } = createClientForMiddleware(request);
    
    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback error:', error);
        
        // Redirect to login with error message (locale-aware)
        const errorUrl = new URL(`${localePrefix}/login`, request.url);
        errorUrl.searchParams.set('error', 'auth_callback_failed');
        errorUrl.searchParams.set('message', encodeURIComponent(error.message));
        return NextResponse.redirect(errorUrl);
      }

      if (data.session && data.user) {
        const userId = data.user.id;
        
        // For signup/email confirmation, ensure user has role and profile
        // Note: Supabase email confirmation links may not have type parameter
        // So we check if user was just created (no role exists yet)
        const isEmailConfirmation = type === 'signup' || !type || type === '';
        
        if (isEmailConfirmation) {
          try {
            const adminSupabase = createAdminClient();
            
            // Check if user role exists
            const { data: existingRole } = await adminSupabase
              .from('user_roles')
              .select('role')
              .eq('user_id', userId)
              .maybeSingle();
            
            // If no role exists, create it (this is a new user from email confirmation)
            if (!existingRole) {
              // Create user role
              await adminSupabase.from('user_roles').insert({
                user_id: userId,
                role: 'authenticated',
              });
              
              // Ensure profile exists
              const { data: existingProfile } = await adminSupabase
                .from('profiles')
                .select('user_id')
                .eq('user_id', userId)
                .maybeSingle();
              
              if (!existingProfile && data.user.user_metadata) {
                // Create profile from user metadata
                await adminSupabase.from('profiles').insert({
                  user_id: userId,
                  username: data.user.user_metadata.username || data.user.email?.split('@')[0] || `user_${userId.slice(0, 8)}`,
                  full_name: data.user.user_metadata.full_name || data.user.email?.split('@')[0] || 'User',
                  phone: data.user.user_metadata.phone || null,
                });
              }
              
              // Initialize user points for gamification
              const { data: existingPoints } = await adminSupabase
                .from('user_points')
                .select('user_id')
                .eq('user_id', userId)
                .maybeSingle();
              
              if (!existingPoints) {
                await adminSupabase.from('user_points').insert({
                  user_id: userId,
                  total_points: 0,
                  current_level: 1,
                  points_to_next_level: 100,
                });
              }
            }
          } catch (profileError) {
            // Log error but don't block - user can still access dashboard
            console.error('Error setting up user profile/role:', profileError);
          }
        }

        // Determine redirect based on the type of auth callback (locale-aware)
        let redirectUrl = next;
        
        // If next doesn't start with locale prefix, add it
        if (!redirectUrl.startsWith(localePrefix) && !redirectUrl.startsWith('/')) {
          redirectUrl = `${localePrefix}${redirectUrl}`;
        } else if (redirectUrl.startsWith('/') && !redirectUrl.startsWith(localePrefix)) {
          redirectUrl = `${localePrefix}${redirectUrl}`;
        }
        
        if (type === 'recovery') {
          // Password reset - redirect to update password page
          redirectUrl = `${localePrefix}/update-password`;
        } else if (type === 'signup' || isEmailConfirmation) {
          // Email confirmation - redirect to dashboard
          redirectUrl = `${localePrefix}/dashboard`;
        } else if (type === 'magiclink') {
          // Magic link - redirect to dashboard
          redirectUrl = `${localePrefix}/dashboard`;
        } else if (type === 'oauth' || type === 'link') {
          // OAuth callback (Google, etc.) - redirect to dashboard or profile
          redirectUrl = `${localePrefix}/dashboard/profile`;
        }

        // Create redirect URL
        const redirect = new URL(redirectUrl, request.url);
        
        // Add success message for email confirmation
        if (isEmailConfirmation) {
          redirect.searchParams.set('message', 'email_confirmed');
        }
        
        // Add success message for password reset
        if (type === 'recovery') {
          redirect.searchParams.set('message', 'password_reset_success');
        }
        
        // Add success message for OAuth
        if (type === 'oauth' || type === 'link') {
          redirect.searchParams.set('message', 'account_linked_success');
        }
        
        // Create response with redirect
        const response = NextResponse.redirect(redirect);
        
        // Ensure session cookies are set properly
        // The supabase client should have already set cookies, but we make sure
        return response;
      }
    } catch (error) {
      console.error('Auth callback exception:', error);
      
      // Redirect to login with error (locale-aware)
      const errorUrl = new URL(`${localePrefix}/login`, request.url);
      errorUrl.searchParams.set('error', 'auth_callback_exception');
      return NextResponse.redirect(errorUrl);
    }
  }

  // No code provided, redirect to login (locale-aware)
  return NextResponse.redirect(new URL(`${localePrefix}/login`, request.url));
}

