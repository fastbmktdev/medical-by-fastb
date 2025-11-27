/**
 * Auth Callback Route
 * 
 * Handles Supabase authentication callbacks including:
 * - Email verification (code parameter)
 * - OAuth callbacks
 * - Password reset callbacks
 * 
 * GET /api/auth/callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientForMiddleware } from '@shared/lib/database/supabase/server';

/**
 * Get the base URL for redirects
 * Uses environment variable or falls back to request origin
 */
function getBaseUrl(request: NextRequest): string {
  // Priority: NEXT_PUBLIC_APP_URL > VERCEL_URL > request origin
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  return request.nextUrl.origin;
}

/**
 * Get locale from cookies or default to 'th'
 */
function getLocale(request: NextRequest): string {
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'th';
  return locale;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      const baseUrl = getBaseUrl(request);
      const locale = getLocale(request);
      return NextResponse.redirect(
        `${baseUrl}/${locale}/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`
      );
    }

    // Handle email verification, password reset, or OAuth callback
    if (code) {
      const { supabase, response } = createClientForMiddleware(request);
      
      // Check if this is a password reset (type=recovery)
      const type = searchParams.get('type');
      const isPasswordReset = type === 'recovery';
      
      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError);
        const baseUrl = getBaseUrl(request);
        const locale = getLocale(request);
        return NextResponse.redirect(
          `${baseUrl}/${locale}/login?error=verification_failed&message=${encodeURIComponent(exchangeError.message)}`
        );
      }

      // Successfully verified/authenticated
      if (data.session) {
        // Determine redirect destination
        let redirectPath = `/${getLocale(request)}/dashboard`;
        
        if (isPasswordReset) {
          // Password reset: redirect to update-password page
          redirectPath = `/${getLocale(request)}/update-password`;
        } else if (next) {
          // Use next parameter if provided
          redirectPath = next.startsWith('/') ? next : `/${getLocale(request)}${next}`;
        } else {
          // Check if this is an email verification (user just signed up)
          const { data: { user } } = await supabase.auth.getUser();
          if (user && !user.email_confirmed_at) {
            // Email was just verified, redirect to verification success or dashboard
            redirectPath = `/${getLocale(request)}/dashboard`;
          }
        }

        const baseUrl = getBaseUrl(request);
        const redirectUrl = `${baseUrl}${redirectPath}`;
        
        // Return response with updated cookies
        return NextResponse.redirect(redirectUrl);
      }
    }

    // No code provided - redirect to login
    const baseUrl = getBaseUrl(request);
    const locale = getLocale(request);
    return NextResponse.redirect(`${baseUrl}/${locale}/login?error=no_code`);

  } catch (error) {
    console.error('Auth callback error:', error);
    const baseUrl = getBaseUrl(request);
    const locale = getLocale(request);
    return NextResponse.redirect(
      `${baseUrl}/${locale}/login?error=callback_error&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
    );
  }
}

