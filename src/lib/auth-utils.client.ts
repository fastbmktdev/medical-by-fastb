/**
 * Authentication and Authorization Utilities (Client-Side)
 * 
 * Use these functions in Client Components only
 */

import { createClient as createBrowserClient } from '@/lib/supabase/client';

export type UserRole = 'authenticated' | 'partner' | 'admin';

/**
 * Get user role from user_roles table (Client-side)
 * Use this in Client Components
 * 
 * If error 406 or authentication issues occur, will logout user automatically
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('[getUserRole] Error fetching role:', error);
    
    // If error is 406 (Not Acceptable) or authentication-related, logout user
    if (error.code === 'PGRST301' || error.message.includes('406') || error.message.includes('JWT')) {
      console.warn('[getUserRole] Session invalid or RLS error. Logging out...');
      
      // Logout user
      await supabase.auth.signOut();
      
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login?error=session_expired';
      }
      
      throw new Error('Session expired. Please login again.');
    }
    
    // Default to 'authenticated' if no role found
    return 'authenticated';
  }

  if (!data) {
    return 'authenticated';
  }

  return data.role as UserRole;
}

/**
 * Get redirect path based on user role
 */
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'partner':
      return '/partner/dashboard';
    case 'authenticated':
    default:
      return '/dashboard';
  }
}

/**
 * Check if user can access a specific dashboard
 */
export function canAccessDashboard(userRole: UserRole, dashboardRole: UserRole): boolean {
  // Users can only access their own dashboard
  return userRole === dashboardRole;
}

/**
 * Role display names in Thai
 */
export const ROLE_NAMES: Record<UserRole, string> = {
  'authenticated': 'ผู้ใช้ทั่วไป',
  'partner': 'พาร์ทเนอร์',
  'admin': 'ผู้ดูแลระบบ',
};

/**
 * Role badge colors for UI
 */
export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
  'authenticated': {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500',
  },
  'partner': {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border-purple-500',
  },
  'admin': {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500',
  },
};

