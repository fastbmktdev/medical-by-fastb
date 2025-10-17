"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserRole, getUserRole, getDashboardPath } from '@/lib/auth-utils.client';
import { User } from '@supabase/supabase-js';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRole: UserRole;
  redirectTo?: string;
}

/**
 * RoleGuard Component
 * 
 * Protects routes by checking user role
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

        // Get user role
        const userRole = await getUserRole(user.id);

        // Check if user has the required role
        if (userRole !== allowedRole) {
          // User doesn't have required role - redirect silently
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
    return null;
  }

  // Authorized, render children
  return <>{children}</>;
}

