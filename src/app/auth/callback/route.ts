import { createClient } from '@/lib/database/supabase/server';
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
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';
  const type = requestUrl.searchParams.get('type');

  if (code) {
    const supabase = await createClient();
    
    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback error:', error);
        
        // Redirect to login with error message
        const errorUrl = new URL('/login', request.url);
        errorUrl.searchParams.set('error', 'auth_callback_failed');
        errorUrl.searchParams.set('message', encodeURIComponent(error.message));
        return NextResponse.redirect(errorUrl);
      }

      if (data.session) {
        // Determine redirect based on the type of auth callback
        let redirectUrl = next;
        
        if (type === 'recovery') {
          // Password reset - redirect to update password page
          redirectUrl = '/update-password';
        } else if (type === 'signup') {
          // Email confirmation - redirect to dashboard
          redirectUrl = '/dashboard';
        } else if (type === 'magiclink') {
          // Magic link - redirect to dashboard
          redirectUrl = '/dashboard';
        }

        // Create redirect URL
        const redirect = new URL(redirectUrl, request.url);
        
        // Add success message for password reset
        if (type === 'recovery') {
          redirect.searchParams.set('message', 'password_reset_success');
        }
        
        return NextResponse.redirect(redirect);
      }
    } catch (error) {
      console.error('Auth callback exception:', error);
      
      // Redirect to login with error
      const errorUrl = new URL('/login', request.url);
      errorUrl.searchParams.set('error', 'auth_callback_exception');
      return NextResponse.redirect(errorUrl);
    }
  }

  // No code provided, redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}
