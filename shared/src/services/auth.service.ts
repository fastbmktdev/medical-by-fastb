/**
 * Authentication Service
 * บริการด้าน Authentication (Client-side)
 */

import { createClient } from '@shared/lib/database/supabase/client';
import type { SignUpCredentials, SignInCredentials, User } from '@shared/types';

// Type declarations for browser APIs (for server-side compilation)
interface BrowserWindow {
  location: {
    origin: string;
    pathname: string;
  };
}

interface BrowserDocument {
  cookie: string;
}

// Global declarations for browser APIs (for TypeScript compilation in server environment)
declare var window: BrowserWindow | undefined;
declare var document: BrowserDocument | undefined;

/**
 * Helper function to get current locale from pathname
 * Falls back to 'th' if locale cannot be determined
 */
function getCurrentLocale(): string {
  if (typeof window === 'undefined') {
    return 'th'; // Default locale for SSR
  }
  
  const pathname = (window as unknown as BrowserWindow).location.pathname;
  const localeMatch = pathname.match(/^\/(th|en|jp)(\/|$)/);
  return localeMatch ? localeMatch[1] : 'th';
}

/**
 * ออกจากระบบ
 */
export async function signOut() {
  const supabase = createClient();
  
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error((error as { message?: string }).message || 'Sign out failed');
  }
}

/**
 * ดึงข้อมูลผู้ใช้ปัจจุบัน
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error((error as { message?: string }).message || 'Failed to get user');
  }

  return user as User | null;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const supabase = createClient();
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: { user: User | null } | null) => {
    callback(session?.user ?? null);
  });

  return subscription;
}

type OAuthProvider = 'google' | 'facebook' | 'apple';

/**
 * Helper สำหรับเข้าสู่ระบบด้วย OAuth Provider
 */
async function signInWithOAuthProvider(provider: OAuthProvider) {
  const supabase = createClient();
  const locale = getCurrentLocale();

  // For Facebook, use a simpler redirect URL without query parameters
  // Facebook's security system is strict about redirect URLs
  // We'll store the locale and next destination in cookies instead
  let callbackUrl: string;
  
  if (typeof window === 'undefined') {
    throw new Error('OAuth sign-in is only available in browser environment');
  }

  const win = window as unknown as BrowserWindow;
  const doc = document as unknown as BrowserDocument;

  if (provider === 'facebook') {
    // Facebook requires a clean redirect URL without query parameters
    // Store locale and next destination in cookies for server-side retrieval
    // Set cookies that will be available in the callback route
    doc.cookie = `oauth_locale=${locale}; path=/; max-age=600; SameSite=Lax`;
    doc.cookie = `oauth_next=/${locale}/dashboard; path=/; max-age=600; SameSite=Lax`;
    callbackUrl = `${win.location.origin}/api/auth/callback`;
  } else {
    // For other providers (Google, etc.), we can use query parameters
    const callbackUrlObj = new URL(`${win.location.origin}/api/auth/callback`);
    callbackUrlObj.searchParams.set('next', `/${locale}/dashboard`);
    callbackUrl = callbackUrlObj.toString();
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl,
    },
  });

  if (error) {
    throw new Error((error as { message?: string }).message || 'OAuth sign in failed');
  }

  return data;
}

/**
 * เข้าสู่ระบบด้วย Google OAuth
 */
export async function signInWithGoogle() {
  return signInWithOAuthProvider('google');
}

/**
 * เข้าสู่ระบบด้วย Facebook OAuth
 */
export async function signInWithFacebook() {
  return signInWithOAuthProvider('facebook');
}

/**
 * เชื่อมต่อบัญชี OAuth (สำหรับผู้ใช้ที่ล็อกอินอยู่แล้ว)
 * Uses Supabase Auth manual identity linking (beta)
 * Requires GOTRUE_SECURITY_MANUAL_LINKING_ENABLED: true in Supabase config
 */
async function linkOAuthAccount(provider: Exclude<OAuthProvider, 'apple'>) {
  const supabase = createClient();
  const locale = getCurrentLocale();

  // For Facebook, use cookies instead of query parameters
  let callbackUrl: string;
  
  if (typeof window === 'undefined') {
    throw new Error('OAuth account linking is only available in browser environment');
  }

  const win = window as unknown as BrowserWindow;
  const doc = document as unknown as BrowserDocument;

  if (provider === 'facebook') {
    // Facebook requires a clean redirect URL without query parameters
    doc.cookie = `oauth_locale=${locale}; path=/; max-age=600; SameSite=Lax`;
    doc.cookie = `oauth_next=/${locale}/dashboard/profile; path=/; max-age=600; SameSite=Lax`;
    callbackUrl = `${win.location.origin}/api/auth/callback`;
  } else {
    // For other providers, use query parameters
    const callbackUrlObj = new URL(`${win.location.origin}/api/auth/callback`);
    callbackUrlObj.searchParams.set('next', `/${locale}/dashboard/profile`);
    callbackUrl = callbackUrlObj.toString();
  }

  const { data, error } = await supabase.auth.linkIdentity({
    provider,
    options: {
      redirectTo: callbackUrl,
    },
  });

  if (error) {
    throw new Error((error as { message?: string }).message || 'Failed to link account');
  }

  return data;
}

export async function linkGoogleAccount() {
  return linkOAuthAccount('google');
}

export async function linkFacebookAccount() {
  return linkOAuthAccount('facebook');
}

/**
 * ยกเลิกการเชื่อมต่อบัญชี OAuth
 * Uses Supabase Auth unlinkIdentity() - requires user to have at least 2 linked identities
 * @param provider - OAuth provider to unlink (e.g., 'google', 'facebook', 'apple')
 */
export async function unlinkOAuthAccount(provider: OAuthProvider = 'google') {
  const supabase = createClient();
  
  // First, get all user identities
  const { data: identitiesData, error: identitiesError } = await supabase.auth.getUserIdentities();
  
  if (identitiesError) {
    throw new Error((identitiesError as { message?: string }).message || 'ไม่สามารถดึงข้อมูลบัญชีที่เชื่อมต่อได้');
  }

  if (!identitiesData || !identitiesData.identities) {
    throw new Error('ไม่พบบัญชีที่เชื่อมต่อ');
  }

  // Check if user has at least 2 identities (required for unlinking)
  if (identitiesData.identities.length < 2) {
    throw new Error('ไม่สามารถยกเลิกการเชื่อมต่อได้ เนื่องจากนี่เป็นบัญชีเดียวที่เหลืออยู่ กรุณาเพิ่มวิธีเข้าสู่ระบบอื่นก่อน');
  }

  // Find the identity to unlink
  const identityToUnlink = identitiesData.identities.find(
    (identity: { provider: string; identity_id: string }) => identity.provider === provider
  );

  if (!identityToUnlink) {
    throw new Error(`ไม่พบบัญชี ${provider} ที่เชื่อมต่อ`);
  }

  // Unlink the identity
  const { data, error } = await supabase.auth.unlinkIdentity(identityToUnlink);

  if (error) {
    throw new Error((error as { message?: string }).message || 'ไม่สามารถยกเลิกการเชื่อมต่อได้');
  }

  return data;
}

// Backwards compatibility
export async function unlinkGoogleAccount(provider: OAuthProvider = 'google') {
  return unlinkOAuthAccount(provider as OAuthProvider);
}

/**
 * ดึงข้อมูลบัญชีที่เชื่อมต่อทั้งหมด
 * Uses Supabase Auth getUserIdentities() to get all linked identities
 * Returns only OAuth providers (excludes email and phone)
 */
export async function getConnectedAccounts() {
  const supabase = createClient();
  
  // Get all user identities using the proper Supabase Auth API
  const { data: identitiesData, error: identitiesError } = await supabase.auth.getUserIdentities();
  
  if (identitiesError) {
    throw new Error((identitiesError as { message?: string }).message || 'ไม่สามารถดึงข้อมูลบัญชีที่เชื่อมต่อได้');
  }

  if (!identitiesData || !identitiesData.identities) {
    return [];
  }

  // Filter to only OAuth providers (exclude email and phone)
  const oauthIdentities = identitiesData.identities.filter(
    (identity: { provider: string; identity_id: string }) => identity.provider !== 'email' && identity.provider !== 'phone'
  );

  return oauthIdentities;
}
