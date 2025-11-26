import type { User } from '@shared/types';

/**
 * Mock Supabase Client
 *
 * This is a mock Supabase client that is used to fix the "Module not found" errors.
 * It has all the methods that are used in the auth.service.ts file.
 */
const mockUser: User = {
  id: '123',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

export const createClient = () => {
  // Query builder for database operations
  const createQueryBuilder = (table: string) => {
    let selectColumns: string | string[] = '*';
    let eqFilters: Array<{ column: string; value: any }> = [];
    let isSingle = false;

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
    };

    // Create a Promise that resolves with the query result
    const promise = Promise.resolve().then(async () => {
      console.log(`Query: ${table}`, { selectColumns, eqFilters, isSingle });
      
      // Mock implementation - returns empty data for now
      // In a real implementation, this would query the database
      return {
        data: isSingle ? null : [],
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
    supabaseUrl: '',
    supabaseKey: '',
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
        return { data: { user: mockUser }, error: null };
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
    // Add other required SupabaseClient properties as stubs
    realtimeUrl: '',
    authUrl: '',
    storageUrl: '',
    functionsUrl: '',
    schema: 'public',
    rest: {} as any,
    functions: {} as any,
  } as any;
};
