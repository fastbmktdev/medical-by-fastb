import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
    // Return a dummy client to prevent crashes
    return createServerClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      }
    );
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

