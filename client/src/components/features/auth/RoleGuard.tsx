"use client";

import { useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { createClient } from '@shared/lib/database/supabase/client';
import { UserRole, getUserRole, getDashboardPath } from '@shared/lib/auth';
import { User } from '@supabase/supabase-js';
import { Loading } from '@/components/shared';

export interface RoleGuardProps {
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
export function RoleGuard({ 
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
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

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

        // Get user role with retry mechanism
        // This handles cases where user role is still being created (e.g., after email confirmation)
        let userRole: UserRole | null = null;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            userRole = await getUserRole(user.id);
            break; // Success, exit retry loop
          } catch (error: unknown) {
            // Check if this is a "no role found" error (PGRST116)
            // This might happen if the user was just created and role hasn't been set up yet
            const isPgError = error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116';
            
            if (isPgError && attempt < maxRetries) {
              // Wait before retrying (role might be getting created)
              console.log(`[RoleGuard] Role not found, retrying... (attempt ${attempt + 1}/${maxRetries + 1})`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              continue;
            }
            
            // For other errors (406, session invalid, etc.), getUserRole will handle logout
            // Don't retry these - they're real errors
            console.error('[RoleGuard] Error getting role:', error);
            return;
          }
        }
        
        // If we still don't have a role after retries, something went wrong
        if (!userRole) {
          console.error('[RoleGuard] Could not get user role after retries');
          // Don't logout - let the user see an error message or redirect to login
          router.push('/login?error=role_not_found');
          return;
        }
        
        // Check if user has the exact required role
        // For dashboard routes, we use exact matching to prevent role escalation
        // (e.g., admin cannot access partner dashboard, partner cannot access user dashboard)
        if (userRole !== allowedRole) {
          // User doesn't have the required role - redirect to their own dashboard
          const redirectPath = redirectTo || getDashboardPath(userRole);
          router.push(redirectPath);
          return;
        }

        // User is authorized
        setIsAuthorized(true);
      } catch (error) {
        console.error('Role check error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedRole, redirectTo, router, supabase.auth]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center bg-zinc-100 min-h-screen">
        <Loading 
          size="lg" 
          text="กำลังตรวจสอบสิทธิ์..." 
          centered 
        />
      </div>
    );
  }

  // Not authorized (will redirect)
  if (!isAuthorized || !user) {
    return (
      <div className="flex justify-center items-center bg-zinc-100 min-h-screen">
        <Loading 
          size="lg" 
          text="กำลัง redirect..." 
          centered 
        />
      </div>
    );
  }

  // Authorized, render children
  return <>{children}</>;
}
