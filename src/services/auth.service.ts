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

