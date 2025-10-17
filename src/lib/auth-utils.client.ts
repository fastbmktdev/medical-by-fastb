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
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    // Default to 'authenticated' if no role found
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

