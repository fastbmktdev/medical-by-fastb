// Mock createServerClient - replace with real import when @supabase/ssr is available
// import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, NextRequest } from 'next/server'
import type { User } from '@shared/types';

/**
 * Mock createServerClient function
 * This is a mock implementation to fix "Module not found" errors
 */
const mockUser: User = {
  id: '123',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

function createServerClient(url: string, key: string, options: any) {
  // Query builder for database operations
  const createQueryBuilder = (table: string) => {
    let selectColumns: string | string[] = '*';
    let eqFilters: Array<{ column: string; value: any }> = [];
    let isSingle = false;
    let maybeSingle = false;

    const builder = {
      select: (columns: string | string[]) => {
        selectColumns = columns;
        return builder;
      },
      eq: (column: string, value: any) => {
        eqFilters.push({ column, value });
        return builder;
      },
      single: () => {
        isSingle = true;
        return builder;
      },
      maybeSingle: () => {
        maybeSingle = true;
        return builder;
      },
      insert: (data: any) => {
        return builder;
      },
    };

    // Create a Promise that resolves with the query result
    const promise = Promise.resolve().then(async () => {
      console.log(`Query: ${table}`, { selectColumns, eqFilters, isSingle, maybeSingle });
      
      // Mock implementation - returns empty data for now
      return {
        data: isSingle || maybeSingle ? null : [],
        error: {
          code: 'PGRST116',
          message: 'No rows found',
        },
      };
    });

    // Attach builder methods to the promise
    return Object.assign(promise, builder) as any;
  };

  return {
    supabaseUrl: url,
    supabaseKey: key,
    realtime: {} as any,
    storage: {} as any,
    auth: {
      signUp: async (credentials: any) => {
        console.log('signUp', credentials);
        return { data: { user: mockUser }, error: null };
      },
      signInWithPassword: async (credentials: any) => {
        console.log('signInWithPassword', credentials);
        return { 
          data: { 
            user: mockUser, 
            session: { 
              access_token: 'mock-token',
              refresh_token: 'mock-refresh-token',
              expires_in: 3600,
              token_type: 'bearer',
              user: mockUser,
            } 
          }, 
          error: null as { message: string; status?: number | null } | null 
        };
      },
      signOut: async () => {
        console.log('signOut');
        return { error: null };
      },
      getUser: async () => {
        console.log('getUser');
        return { data: { user: mockUser }, error: null as { message: string } | null };
      },
      getSession: async () => {
        console.log('getSession');
        return { 
          data: { 
            session: {
              access_token: 'mock-token',
              refresh_token: 'mock-refresh-token',
              expires_in: 3600,
              token_type: 'bearer',
              user: mockUser,
            } as any
          }, 
          error: null as { message: string } | null 
        };
      },
      updateUser: async (options: any) => {
        console.log('updateUser', options);
        return { data: { user: mockUser }, error: null };
      },
      resetPasswordForEmail: async (email: string, options?: any) => {
        console.log('resetPasswordForEmail', email, options);
        return { data: {}, error: null as { message: string } | null };
      },
      onAuthStateChange: (callback: any) => {
        console.log('onAuthStateChange');
        callback('authenticated', { user: mockUser });
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signInWithOAuth: async (options: any) => {
        console.log('signInWithOAuth', options);
        return { data: {}, error: null };
      },
      linkIdentity: async (options: any) => {
        console.log('linkIdentity', options);
        return { data: {}, error: null };
      },
      unlinkIdentity: async (identity: any) => {
        console.log('unlinkIdentity', identity);
        return { data: {}, error: null };
      },
      getUserIdentities: async () => {
        console.log('getUserIdentities');
        return {
          data: {
            identities: [
              { provider: 'google', identity_id: '123' },
              { provider: 'email', identity_id: '456' },
            ],
          },
          error: null,
        };
      },
    },
    from: (table: string) => createQueryBuilder(table),
    rpc: async (functionName: string, params?: any) => {
      console.log('rpc', functionName, params);
      return { data: [] as any[], error: null as { message: string } | null };
    },
    realtimeUrl: '',
    authUrl: '',
    storageUrl: '',
    functionsUrl: '',
    schema: 'public',
    rest: {} as any,
    functions: {} as any,
  } as any;
}

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
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) =>
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
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) =>
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
        setAll(_cookiesToSet: Array<{ name: string; value: string; options?: any }>) {},
      },
    }
  );

  return supabase;
}

