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
  // ⚠️ IMPORTANT: Must use NEXT_PUBLIC_ prefix for client-side code
  // Without it, these variables won't be available in the browser
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

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

