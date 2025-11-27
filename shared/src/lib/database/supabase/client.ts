import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase client for use in the browser/client-side.
 * 
 * This client is designed for use in React components, hooks, and client-side code.
 * It automatically handles authentication state and session management in the browser.
 * 
 * @returns A Supabase client instance configured for browser use
 * 
 * @example
 * ```tsx
 * import { createBrowserClient } from '@shared/lib/database';
 * 
 * const supabase = createBrowserClient();
 * const { data } = await supabase.from('users').select('*');
 * ```
 */
export function createBrowserClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * @deprecated Use `createBrowserClient()` instead for better clarity.
 * This alias is maintained for backward compatibility.
 */
export const createClient = createBrowserClient;