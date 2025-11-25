import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, NextRequest } from 'next/server'

/**
 * Create a Supabase client for server-side operations
 *
 * Environment variables required:
 * - SUPABASE_URL: Your Supabase project URL (server-side only, not exposed to browser)
 * - SUPABASE_ANON_KEY: Your Supabase anonymous key (server-side only, not exposed to browser)
 *
 * Note: Server-side uses regular env vars (without NEXT_PUBLIC_ prefix) for security
 *
 * @returns Promise<Supabase client instance>
 * @throws Error if environment variables are not set
 */
export async function createClient() {
  const cookieStore = await cookies()

  // Server-side uses regular env vars (without NEXT_PUBLIC_ prefix)
  // These are NOT exposed to the browser for security
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('SUPABASE_URL');
    if (!supabaseAnonKey) missingVars.push('SUPABASE_ANON_KEY');
    
    const errorMessage = `Missing Supabase environment variables: ${missingVars.join(', ')}. 
    
For local development: Please ensure these are set in your .env.local file and restart your dev server.

For production: These variables must be set as environment variables in your deployment platform (Vercel, etc.).

Current values:
- SUPABASE_URL: ${supabaseUrl ? 'Set' : 'Missing'}
- SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'Set' : 'Missing'}`;
    
    console.error('❌ Supabase Server Client Error:', errorMessage);
    throw new Error(errorMessage);
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Create a Supabase client for middleware operations
 * This function is specifically for middleware and returns both client and response
 *
 * @param request NextRequest object
 * @returns Object containing supabase client and response
 */
export function createClientForMiddleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  );

  return { supabase, response: supabaseResponse };
}

/**
 * Create a Supabase admin client with service role key
 * This client has admin privileges and can bypass RLS policies
 * 
 * Environment variables required:
 * - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (keep secret!)
 * 
 * @returns Supabase client instance with admin privileges
 * @throws Error if environment variables are not set
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin credentials. Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );

  return supabase;
}

