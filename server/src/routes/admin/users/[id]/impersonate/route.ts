import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@shared/lib/database/supabase/server';
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';
import { logAuditEvent } from '@shared/lib/utils/audit-log';
import type { ImpersonateRequest, ImpersonateResponse } from '@shared/types/impersonation.types';

/**
 * POST /api/admin/users/[id]/impersonate
 * Start impersonating a user (Admin only)
 */
export const POST = withAdminAuth(async (
  request: NextRequest,
  { params },
  adminUser
) => {
  try {
    const supabase = await createServerClient();
    const resolvedParams = await params as Promise<{ id: string }>;
    const { id: targetUserId } = await resolvedParams;
    const body = await request.json() as ImpersonateRequest;
    const { reason, metadata = {} } = body;

    // Use admin client to get user info
    const adminClient = createAdminClient();
    const { data: targetUser, error: targetUserError } = await adminClient.auth.admin.getUserById(targetUserId);
    
    if (targetUserError || !targetUser.user) {
      return NextResponse.json<ImpersonateResponse>(
        { success: false, error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Prevent self-impersonation
    if (targetUserId === adminUser.id) {
      return NextResponse.json<ImpersonateResponse>(
        { success: false, error: 'Cannot impersonate yourself' },
        { status: 400 }
      );
    }

    // Check if admin already has an active impersonation
    const { data: activeImpersonation } = await supabase
      .rpc('get_active_impersonation', { p_admin_user_id: adminUser.id });

    if (activeImpersonation && activeImpersonation.length > 0) {
      return NextResponse.json<ImpersonateResponse>(
        { success: false, error: 'You already have an active impersonation session. Please stop it first.' },
        { status: 400 }
      );
    }

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create impersonation record
    const { data: impersonation, error: impersonationError } = await supabase
      .from('user_impersonations')
      .insert({
        admin_user_id: adminUser.id,
        impersonated_user_id: targetUserId,
        reason: reason || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          ...metadata,
          admin_email: adminUser.email,
          target_email: targetUser.user.email,
        },
      })
      .select()
      .single();

    if (impersonationError || !impersonation) {
      console.error('Error creating impersonation:', impersonationError);
      return NextResponse.json<ImpersonateResponse>(
        { success: false, error: 'Failed to create impersonation session' },
        { status: 500 }
      );
    }

    // Generate a secure impersonation token
    const impersonationToken = crypto.randomUUID();
    
    // Update impersonation with token in metadata
    await supabase
      .from('user_impersonations')
      .update({ 
        session_id: impersonationToken,
        metadata: {
          ...metadata,
          admin_email: adminUser.email,
          target_email: targetUser.user.email,
          impersonation_token: impersonationToken,
        },
      })
      .eq('id', impersonation.id);
    
    // Note: Actual session switching should be handled client-side
    // The client will use this impersonation record to identify the session
    // For security, we don't create the session server-side

    // Log audit event
    await logAuditEvent({
      supabase,
      request,
      user: adminUser,
      action: 'impersonate',
      resourceType: 'user',
      resourceId: targetUserId,
      resourceName: targetUser.user.email || 'Unknown',
      description: `Admin ${adminUser.email} started impersonating user ${targetUser.user.email}`,
      metadata: {
        reason: reason || null,
        impersonation_id: impersonation.id,
      },
      severity: 'high',
      success: true,
    });

    // Return impersonation data
    // Note: Client will need to handle session switching separately
    // This is a security measure - we don't want to expose session tokens in API responses
    return NextResponse.json<ImpersonateResponse>({
      success: true,
      impersonation: {
        ...impersonation,
        session_id: impersonationToken,
      },
    });
  } catch (error) {
    console.error('Error in impersonate endpoint:', error);
    return NextResponse.json<ImpersonateResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
});

