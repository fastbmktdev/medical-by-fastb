import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase client for client-side operations
 * 
 * Environment variables required:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_ANON_KEY: Your Supabase anonymous key
 * 
 * @returns Supabase client instance
 * @throws Error if environment variables are not set
 */
export function createClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase client-side environment variables are missing!');
    throw new Error(
      'Missing Supabase environment variables. Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set.'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

