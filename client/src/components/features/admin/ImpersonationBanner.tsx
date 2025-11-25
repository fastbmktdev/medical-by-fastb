"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@shared/lib/database/supabase/client';
import { Alert, Button } from '@heroui/react';
import { XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import type { ImpersonationContext } from '@shared/types/impersonation.types';

/**
 * ImpersonationBanner Component
 * Displays a banner when admin is impersonating a user
 */
export function ImpersonationBanner() {
  const supabase = createClient();
  const [impersonationContext, setImpersonationContext] = useState<ImpersonationContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStopping, setIsStopping] = useState(false);

  useEffect(() => {
    async function checkImpersonation() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Check if user is admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleData?.role !== 'admin') {
          setIsLoading(false);
          return;
        }

        // Get active impersonation
        const { data: impersonationData } = await supabase
          .rpc('get_active_impersonation', { p_admin_user_id: user.id });

        if (!impersonationData || impersonationData.length === 0) {
          setImpersonationContext(null);
          setIsLoading(false);
          return;
        }

        const impersonation = impersonationData[0];

        // Get user emails
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', impersonation.admin_user_id)
          .maybeSingle();

        const { data: impersonatedProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', impersonation.impersonated_user_id)
          .maybeSingle();

        setImpersonationContext({
          isImpersonating: true,
          adminUserId: impersonation.admin_user_id,
          adminEmail: adminProfile?.email || null,
          impersonatedUserId: impersonation.impersonated_user_id,
          impersonatedEmail: impersonatedProfile?.email || null,
          impersonationId: impersonation.id,
          startedAt: impersonation.started_at,
        });
      } catch (error) {
        console.error('Error checking impersonation:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkImpersonation();
    
    // Poll for changes every 5 seconds
    const interval = setInterval(checkImpersonation, 5000);
    return () => clearInterval(interval);
  }, [supabase]);

  const handleStopImpersonation = async () => {
    setIsStopping(true);
    try {
      const response = await fetch('/api/admin/users/stop-impersonation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Reload page to reset session
        window.location.reload();
      } else {
        alert('Failed to stop impersonation: ' + (data.error || 'Unknown error'));
        setIsStopping(false);
      }
    } catch (error) {
      console.error('Error stopping impersonation:', error);
      alert('Failed to stop impersonation');
      setIsStopping(false);
    }
  };

  if (isLoading || !impersonationContext?.isImpersonating || !impersonationContext.startedAt) {
    return null;
  }

  const startedAt = new Date(impersonationContext.startedAt);
  const duration = Math.floor((Date.now() - startedAt.getTime()) / 1000 / 60); // minutes

  return (
    <Alert
      color="warning"
      variant="flat"
      className="mb-4"
      startContent={<UserIcon className="w-5 h-5" />}
      endContent={
        <Button
          size="sm"
          color="warning"
          variant="flat"
          onPress={handleStopImpersonation}
          isLoading={isStopping}
          startContent={!isStopping && <XMarkIcon className="w-4 h-4" />}
        >
          {isStopping ? 'Stopping...' : 'Stop Impersonation'}
        </Button>
      }
    >
      <div className="flex flex-col gap-1">
        <p className="font-semibold">
          คุณกำลังเข้าสู่ระบบในฐานะผู้ใช้อื่น
        </p>
        <p className="text-sm opacity-90">
          Admin: {impersonationContext.adminEmail || 'Unknown'} → 
          User: {impersonationContext.impersonatedEmail || 'Unknown'} 
          ({duration} นาที)
        </p>
      </div>
    </Alert>
  );
}

