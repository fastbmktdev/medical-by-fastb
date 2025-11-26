import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Create a Supabase client for client-side operations
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous key
 * 
 * @returns Supabase client instance
 * @returns Placeholder client if environment variables are missing (for local development)
 */
export function createClient() {
  // In browser/client-side, Next.js exposes NEXT_PUBLIC_ vars via window
  // But process.env should still work in client components
  // In production builds, these need to be available at build time
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Handle missing environment variables gracefully for local development
  // Return a mock client that won't crash the app but won't function properly
  if (!supabaseUrl || !supabaseAnonKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    const warningMessage = `⚠️  Missing Supabase environment variables: ${missingVars.join(', ')}. 
    
For local development: Please ensure these are set in your .env.local file and restart your dev server.

For production: These variables must be set as environment variables in your deployment platform (Vercel, etc.) and available at build time.

Current values:
- NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'Set' : 'Missing'}
- NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'Set' : 'Missing'}

Using placeholder values. Supabase features will not work.`;
    
    console.warn('⚠️  Supabase Client Warning:', warningMessage);
    
    // Return a client with placeholder values that won't crash
    // The client will fail gracefully when used
    return createSupabaseClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI1MjAsImV4cCI6MTk2MDc2ODUyMH0.placeholder'
    );
  }

  // Validate URL format (only warn, don't throw for local dev)
  try {
    const url = new URL(supabaseUrl);
    if (!url.protocol.startsWith('http')) {
      console.warn('⚠️  Supabase URL Error: URL must use http or https protocol');
    }
  } catch (urlError) {
    console.warn('⚠️  Supabase URL Error: Invalid URL format. Expected a valid URL, got:', supabaseUrl);
  }

  // Validate API key format (basic check)
  // Supabase keys can be:
  // - JWT tokens (eyJ...)
  // - Publishable keys (sb_publishable_...)
  // - API keys (sb_...)
  // - Local development keys (shorter, for testing)
  const isJWT = supabaseAnonKey.startsWith('eyJ');
  const isPublishableKey = supabaseAnonKey.startsWith('sb_publishable_');
  const isAPIKey = supabaseAnonKey.startsWith('sb_');
  const isLocalDev = supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1');
  
  // Only warn if key seems obviously invalid (too short and not a known format)
  // For local dev, we allow shorter keys
  const minLength = isLocalDev ? 20 : 50;
  const isValidFormat = isJWT || isPublishableKey || isAPIKey;
  
  if (supabaseAnonKey.length < minLength && !isValidFormat) {
    console.warn('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY format may be invalid. Expected JWT token (eyJ...), publishable key (sb_publishable_...), or API key (sb_...).');
  }

  // Create client with validated credentials
  try {
    const client = createSupabaseClient(supabaseUrl, supabaseAnonKey);
    
    // Verify client was created successfully
    if (!client) {
      console.warn('⚠️  Failed to create Supabase client: client is null');
      // Return a fallback client with placeholder values
      return createSupabaseClient(
        'https://placeholder.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI1MjAsImV4cCI6MTk2MDc2ODUyMH0.placeholder'
      );
    }
    
    return client;
  } catch (clientError) {
    console.warn('⚠️  Failed to create Supabase client:', clientError);
    // Return a fallback client instead of throwing
    return createSupabaseClient(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI1MjAsImV4cCI6MTk2MDc2ODUyMH0.placeholder'
    );
  }
}

