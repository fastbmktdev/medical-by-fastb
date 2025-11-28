/**
 * Supabase Client for Express Server
 * 
 * This module provides a way to create Supabase clients in Express server routes
 * that work with Express request cookies instead of Next.js cookies API.
 */

import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Create a Supabase client for use in Express server routes
 * 
 * This function creates a Supabase client that reads cookies from a NextRequest-like object
 * (which is created by the Express adapter from Express Request) and sets cookies via NextResponse.
 * 
 * @param request - A NextRequest-like object (from Express adapter)
 * @param response - Optional NextResponse object for setting cookies (will be created if not provided)
 * @returns An object containing the Supabase client and NextResponse for cookie management
 * 
 * @example
 * ```ts
 * import { createExpressClient } from '@shared/lib/database/supabase/express';
 * 
 * export async function GET(request: NextRequest) {
 *   const { supabase, response } = createExpressClient(request);
 *   const { data: { user } } = await supabase.auth.getUser();
 *   // Use response to return data
 *   return NextResponse.json({ data: user }, { headers: response.headers });
 * }
 * ```
 */
export function createExpressClient(request: NextRequest, response?: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  const nextResponse = response || NextResponse.next({ request });

  const supabase = createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: CookieOptions;
        }>
      ) => {
        // Set cookies on both request and response
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          nextResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  return { supabase, response: nextResponse };
}

