import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';
import { logAuditEvent } from '@shared/lib/utils/audit-log';
import type { StopImpersonationResponse } from '@shared/types/impersonation.types';

/**
 * POST /api/admin/users/stop-impersonation
 * Stop current impersonation session (Admin only)
 */
export const POST = withAdminAuth(async (
  request: NextRequest,
  _context,
  adminUser
) => {
  try {
    const supabase = await createClient();

    // Get active impersonation for this admin
    const { data: activeImpersonation, error: impersonationError } = await supabase
      .rpc('get_active_impersonation', { p_admin_user_id: adminUser.id });

    if (impersonationError || !activeImpersonation || activeImpersonation.length === 0) {
      return NextResponse.json<StopImpersonationResponse>(
        { success: false, error: 'No active impersonation session found' },
        { status: 404 }
      );
    }

    const impersonation = activeImpersonation[0];

    // Stop impersonation
    const { data: stopped, error: stopError } = await supabase
      .rpc('stop_impersonation', {
        p_impersonation_id: impersonation.id,
        p_admin_user_id: adminUser.id,
      });

    if (stopError || !stopped) {
      console.error('Error stopping impersonation:', stopError);
      return NextResponse.json<StopImpersonationResponse>(
        { success: false, error: 'Failed to stop impersonation session' },
        { status: 500 }
      );
    }

    // Get impersonated user info for audit log
    const { data: impersonatedUser } = await supabase.auth.admin.getUserById(
      impersonation.impersonated_user_id
    );

    // Log audit event
    await logAuditEvent({
      supabase,
      request,
      user: adminUser,
      action: 'stop_impersonation',
      resourceType: 'user',
      resourceId: impersonation.impersonated_user_id,
      resourceName: impersonatedUser?.user?.email || 'Unknown',
      description: `Admin ${adminUser.email} stopped impersonating user ${impersonatedUser?.user?.email || 'Unknown'}`,
      metadata: {
        impersonation_id: impersonation.id,
        duration_seconds: Math.floor(
          (new Date().getTime() - new Date(impersonation.started_at).getTime()) / 1000
        ),
      },
      severity: 'high',
      success: true,
    });

    return NextResponse.json<StopImpersonationResponse>({
      success: true,
    });
  } catch (error) {
    console.error('Error in stop-impersonation endpoint:', error);
    return NextResponse.json<StopImpersonationResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
});

