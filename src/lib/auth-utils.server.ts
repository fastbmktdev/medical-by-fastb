/**
 * Authentication and Authorization Utilities (Server-Side)
 * 
 * Use these functions in Server Components and API Routes only
 */

import { createClient as createServerClient } from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js';

export type UserRole = 'authenticated' | 'partner' | 'admin';

export interface UserWithRole extends User {
  role: UserRole;
}

/**
 * Get user role from user_roles table (Server-side)
 * Use this in Server Components and API routes
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  const supabase = await createServerClient();
  
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
 * Get current user with their role (Server-side)
 */
export async function getCurrentUserWithRole(): Promise<UserWithRole | null> {
  const supabase = await createServerClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return null;
  }

  const role = await getUserRole(user.id);
  
  return {
    ...user,
    role,
  };
}

/**
 * Check if user has required role (Server-side)
 * Returns true if user has the exact role or a higher role
 */
export async function hasRole(userId: string, requiredRole: UserRole): Promise<boolean> {
  const userRole = await getUserRole(userId);
  
  // Role hierarchy: admin > partner > authenticated
  const roleHierarchy: Record<UserRole, number> = {
    'authenticated': 1,
    'partner': 2,
    'admin': 3,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Check if user has exact role (Server-side)
 * Returns true only if user has the exact role specified
 */
export async function hasExactRole(userId: string, requiredRole: UserRole): Promise<boolean> {
  const userRole = await getUserRole(userId);
  return userRole === requiredRole;
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

