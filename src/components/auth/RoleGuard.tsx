"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserRole, getUserRole, getDashboardPath, hasRole } from '@/lib/auth-utils.client';
import { User } from '@supabase/supabase-js';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRole: UserRole;
  redirectTo?: string;
}

/**
 * RoleGuard Component
 *
 * Protects routes by checking user role using EXACT MATCH
 * Each role can only access their own dashboard:
 * - admin -> /admin/dashboard only
 * - partner -> /partner/dashboard only
 * - authenticated -> /dashboard only
 *
 * Redirects unauthorized users to their appropriate dashboard or login
 *
 * Usage:
 * <RoleGuard allowedRole="admin">
 *   <AdminContent />
 * </RoleGuard>
 */
export default function RoleGuard({ 
  children, 
  allowedRole,
  redirectTo 
}: RoleGuardProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Check if user is logged in
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          // Not logged in, redirect to login
          const currentPath = window.location.pathname;
          router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
          return;
        }

        setUser(user);

        // Get user role (may throw error and logout if session invalid)
        let userRole: UserRole;
        try {
          userRole = await getUserRole(user.id);
        } catch (error) {
          // getUserRole will handle logout if error 406 or session invalid
          console.error('[RoleGuard] Error getting role, user will be logged out');
          return;
        }
        
        // Debug logging
        console.log('[RoleGuard] User:', user.email);
        console.log('[RoleGuard] User Role:', userRole);
        console.log('[RoleGuard] Required Role:', allowedRole);
        console.log('[RoleGuard] Exact match:', userRole === allowedRole);

        // Check if user has the exact required role
        // For dashboard routes, we use exact matching to prevent role escalation
        // (e.g., admin cannot access partner dashboard, partner cannot access user dashboard)
        if (userRole !== allowedRole) {
          // User doesn't have the required role - redirect to their own dashboard
          console.warn(`[RoleGuard] Access denied. User has '${userRole}' but needs '${allowedRole}'`);
          const redirectPath = redirectTo || getDashboardPath(userRole);
          router.push(redirectPath);
          return;
        }

        // User is authorized
        console.log('[RoleGuard] Access granted');
        setIsAuthorized(true);
      } catch (error) {
        console.error('Role check error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [allowedRole, redirectTo, router, supabase.auth]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center bg-zinc-900 min-h-screen">
        <div className="text-center">
          <div className="inline-block mb-4 border-4 border-t-transparent border-red-600 rounded-full w-16 h-16 animate-spin"></div>
          <p className="text-zinc-300 text-lg">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  // Not authorized (will redirect)
  if (!isAuthorized || !user) {
    return (
      <div className="flex justify-center items-center bg-zinc-900 min-h-screen">
        <div className="text-center">
          <div className="inline-block mb-4 border-4 border-t-transparent border-red-600 rounded-full w-16 h-16 animate-spin"></div>
          <p className="text-zinc-300 text-lg">กำลัง redirect...</p>
        </div>
      </div>
    );
  }

  // Authorized, render children
  return <>{children}</>;
}

