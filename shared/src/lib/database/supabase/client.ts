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

export const createClient = () => ({
  auth: {
    signUp: async (credentials: any) => {
      console.log('signUp', credentials);
      return { data: { user: mockUser }, error: null };
    },
    signInWithPassword: async (credentials: any) => {
      console.log('signInWithPassword', credentials);
      return { data: { user: mockUser }, error: null };
    },
    signOut: async () => {
      console.log('signOut');
      return { error: null };
    },
    getUser: async () => {
      console.log('getUser');
      return { data: { user: mockUser }, error: null };
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
});
