/**
 * Impersonation Context Helper
 * Utilities for managing and checking impersonation state
 */

import { createClient } from '@shared/lib/database/supabase/server';
import type { ImpersonationContext } from '@shared/types/impersonation.types';

/**
 * Get current impersonation context from session
 * Checks if admin is currently impersonating a user
 */
export async function getImpersonationContext(): Promise<ImpersonationContext> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return {
      isImpersonating: false,
      adminUserId: null,
      adminEmail: null,
      impersonatedUserId: null,
      impersonatedEmail: null,
      impersonationId: null,
      startedAt: null,
    };
  }

  // Check if user is admin
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (roleData?.role !== 'admin') {
    return {
      isImpersonating: false,
      adminUserId: null,
      adminEmail: null,
      impersonatedUserId: null,
      impersonatedEmail: null,
      impersonationId: null,
      startedAt: null,
    };
  }

  // Get active impersonation for this admin
  const { data: impersonationData } = await supabase
    .rpc('get_active_impersonation', { p_admin_user_id: user.id });

  if (!impersonationData || impersonationData.length === 0) {
    return {
      isImpersonating: false,
      adminUserId: null,
      adminEmail: null,
      impersonatedUserId: null,
      impersonatedEmail: null,
      impersonationId: null,
      startedAt: null,
    };
  }

  const impersonation = impersonationData[0];

  // Get admin and impersonated user emails from profiles
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

  return {
    isImpersonating: true,
    adminUserId: impersonation.admin_user_id,
    adminEmail: adminProfile?.email || null,
    impersonatedUserId: impersonation.impersonated_user_id,
    impersonatedEmail: impersonatedProfile?.email || null,
    impersonationId: impersonation.id,
    startedAt: impersonation.started_at,
  };
}

/**
 * Check if current session is an impersonation session
 */
export async function isImpersonating(): Promise<boolean> {
  const context = await getImpersonationContext();
  return context.isImpersonating;
}

