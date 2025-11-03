/**
 * Authentication Service
 * บริการด้าน Authentication (Client-side)
 */

import { createClient } from '@/lib/database/supabase/client';
import type { SignUpCredentials, SignInCredentials } from '@/types';

/**
 * ลงทะเบียนผู้ใช้ใหม่
 */
export async function signUp(credentials: SignUpCredentials) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      emailRedirectTo: `${window.location.origin}/examples/auth`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * เข้าสู่ระบบ
 */
export async function signIn(credentials: SignInCredentials) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * ออกจากระบบ
 */
export async function signOut() {
  const supabase = createClient();
  
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * ดึงข้อมูลผู้ใช้ปัจจุบัน
 */
export async function getCurrentUser() {
  const supabase = createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return user;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: ReturnType<typeof getCurrentUser> extends Promise<infer U> ? U : never) => void) {
  const supabase = createClient();
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return subscription;
}

/**
 * เข้าสู่ระบบด้วย Google OAuth
 */
export async function signInWithGoogle() {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * เชื่อมต่อบัญชี Google (สำหรับผู้ใช้ที่ล็อกอินอยู่แล้ว)
 */
export async function linkGoogleAccount() {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * ยกเลิกการเชื่อมต่อบัญชี Google
 * Note: Uses API route since unlinkIdentity requires admin privileges
 */
export async function unlinkGoogleAccount(provider: string = 'google') {
  try {
    const response = await fetch(`/api/users/connected-accounts?provider=${provider}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'ไม่สามารถยกเลิกการเชื่อมต่อได้');
    }

    return data;
  } catch (error: any) {
    throw new Error(error.message || 'เกิดข้อผิดพลาดในการยกเลิกการเชื่อมต่อ');
  }
}

/**
 * ดึงข้อมูลบัญชีที่เชื่อมต่อทั้งหมด
 * Note: Supabase Auth stores identities internally. This function checks the user's
 * app_metadata.providers array and creates identity objects based on that.
 */
export async function getConnectedAccounts() {
  const supabase = createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error(userError?.message || 'ไม่พบข้อมูลผู้ใช้');
  }

  // Get providers from app_metadata
  // Supabase stores connected providers in user.app_metadata.providers array
  const providers = (user.app_metadata?.providers || []) as string[];
  
  // Also check if user was created via OAuth by looking at identities
  // We'll create identity-like objects for display
  const identities: any[] = [];
  
  // Check each provider
  providers.forEach((provider) => {
    // Skip email and phone as they're not OAuth providers
    if (provider !== 'email' && provider !== 'phone') {
      identities.push({
        id: `${provider}_${user.id}`, // Create a unique ID
        provider: provider,
        identity_data: {
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.display_name || user.email?.split('@')[0],
          avatar_url: user.user_metadata?.avatar_url,
        },
        created_at: user.created_at,
      });
    }
  });

  return identities;
}

