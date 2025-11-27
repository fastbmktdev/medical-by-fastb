import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Create a Supabase client for use on the server (Server Components, Route Handlers, API Routes).
 * 
 * This client manages authentication cookies and sessions through Next.js cookies API.
 * It should be used in server-side code where you need user authentication context.
 * 
 * @returns A Promise resolving to a Supabase client instance configured for server use
 * 
 * @example
 * ```ts
 * import { createServerClient } from '@shared/lib/database';
 * 
 * const supabase = await createServerClient();
 * const { data: { user } } = await supabase.auth.getUser();
 * ```
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // In server component, this may throw; safe to ignore.
          }
        },
        remove: (name: string, options: CookieOptions) => {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // In server component, this may throw; safe to ignore.
          }
        },
      },
    }
  );
}

/**
 * Create a Supabase client using the service role key (admin privileges).
 * 
 * ⚠️ WARNING: This client has full admin access to your database.
 * Only use this in secure server-side code. Never expose this in client-side code.
 * 
 * Use cases:
 * - Admin operations that require bypassing RLS (Row Level Security)
 * - System-level operations (cron jobs, migrations, etc.)
 * - Operations that need to act on behalf of any user
 * 
 * @returns A Supabase client with admin privileges
 * @throws {Error} If required environment variables are not set
 * 
 * @example
 * ```ts
 * import { createAdminClient } from '@shared/lib/database';
 * 
 * const adminClient = createAdminClient();
 * // Can bypass RLS and perform admin operations
 * ```
 */
export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase admin credentials. Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create a Supabase client for use in Next.js middleware.
 * 
 * This is a specialized client for middleware that handles cookie management
 * differently than regular server clients. It returns both the client and
 * a NextResponse object for proper cookie handling.
 * 
 * @param request - The Next.js request object
 * @returns An object containing the Supabase client and NextResponse for cookie management
 * 
 * @example
 * ```ts
 * import { createClientForMiddleware } from '@shared/lib/database';
 * 
 * export async function middleware(request: NextRequest) {
 *   const { supabase, response } = createClientForMiddleware(request);
 *   const { data: { user } } = await supabase.auth.getUser();
 *   return response;
 * }
 * ```
 */
export function createClientForMiddleware(request: NextRequest) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';

  const supabaseResponse = NextResponse.next({ request });

  const supabase = createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: any;
        }>
      ) => {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  return { supabase, response: supabaseResponse };
}
