import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase client for client-side operations
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous key
 * 
 * @returns Supabase client instance
 * @throws Error if environment variables are not set
 */
export function createClient() {
  // In browser/client-side, Next.js exposes NEXT_PUBLIC_ vars via window
  // But process.env should still work in client components
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    throw new Error(
      `Missing Supabase environment variables: ${missingVars.join(', ')}. Please ensure these are set in your .env.local file and restart your dev server.`
    );
  }

  // Validate URL format
  try {
    const url = new URL(supabaseUrl);
  } catch (urlError) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL format. Expected a valid URL, got: ${supabaseUrl}`
    );
  }

  const client = createBrowserClient(supabaseUrl, supabaseAnonKey);

  return client;
}

