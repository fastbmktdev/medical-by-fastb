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

import { NextResponse } from 'next/server';
import { createServerClient } from '@shared/lib/database/supabase/server';
import { cookies } from 'next/headers';
import { locales, type Locale } from '@/i18n';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const next = url.searchParams.get('next');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');
    const type = url.searchParams.get('type');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      const cookieStore = await cookies();
      const locale = cookieStore.get('NEXT_LOCALE')?.value || 'th';
      return NextResponse.redirect(
        `${url.origin}/${locale}/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`
      );
    }

    // Handle email verification, password reset, or OAuth callback
    if (code) {
      const cookieStore = await cookies();
      const supabase = await createServerClient();

      // Check if this is a password reset (type=recovery)
      const isPasswordReset = type === 'recovery';

      // Exchange code for session
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError);
        const locale = cookieStore.get('NEXT_LOCALE')?.value || 'th';
        return NextResponse.redirect(
          `${url.origin}/${locale}/login?error=verification_failed&message=${encodeURIComponent(exchangeError.message)}`
        );
      }

      // Successfully verified/authenticated
      // Determine redirect destination
      const locale = (cookieStore.get('NEXT_LOCALE')?.value || 'th') as Locale;
      const validLocale = locales.includes(locale) ? locale : 'th';
      
      let redirectPath = `/${validLocale}/dashboard`;

      if (isPasswordReset) {
        // Password reset: redirect to update-password page
        redirectPath = `/${validLocale}/update-password`;
      } else if (next) {
        // Use next parameter if provided
        redirectPath = next.startsWith('/') ? next : `/${validLocale}${next}`;
      }

      return NextResponse.redirect(`${url.origin}${redirectPath}`);
    }

    // No code provided - redirect to login
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'th';
    return NextResponse.redirect(`${url.origin}/${locale}/login?error=no_code`);

  } catch (error) {
    console.error('Auth callback error:', error);
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'th';
    return NextResponse.redirect(
      `${new URL(request.url).origin}/${locale}/login?error=callback_error&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
    );
  }
}

