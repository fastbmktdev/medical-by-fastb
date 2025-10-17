import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Create a Supabase client for server-side operations
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous key
 * 
 * Note: Uses NEXT_PUBLIC_ prefix to share the same config as client
 * 
 * @returns Promise<Supabase client instance>
 * @throws Error if environment variables are not set
 */
export async function createClient() {
  const cookieStore = await cookies()
  
  // Note: Using NEXT_PUBLIC_ prefix to share config with client
  // Server-side can access both NEXT_PUBLIC_ and regular env vars
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      '❌ Missing Supabase environment variables!\n\n' +
      'Please create a .env.local file with:\n' +
      'NEXT_PUBLIC_SUPABASE_URL=your-supabase-url\n' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n\n' +
      'For local development:\n' +
      'NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321\n' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0\n\n' +
      'See ENV_SETUP.md for more details.'
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

