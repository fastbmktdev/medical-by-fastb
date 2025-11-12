import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { logAuditEvent } from '@/lib/utils';

/**
 * Request Account Deletion API
 * POST /api/users/delete-account
 * 
 * Body:
 * {
 *   password?: string (for verification),
 *   deletion_reason?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { password, deletion_reason } = body;

    const { data: existingDeletion } = await supabase
      .from('deleted_accounts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Verify password if provided
    if (password) {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password
      });

      if (verifyError) {
        await logAuditEvent({
          supabase,
          request,
          user,
          action: 'delete',
          resourceType: 'user',
          resourceId: user.id,
          resourceName: user.email ?? user.id,
          description: 'Account deletion request failed - invalid password',
          metadata: {
            providedReason: deletion_reason || null,
          },
          severity: 'high',
          success: false,
          errorMessage: 'Invalid password provided for deletion request',
        });

        return NextResponse.json(
          { success: false, error: 'Invalid password' },
          { status: 401 }
        );
      }
    }

    // Calculate grace period (30 days)
    const gracePeriodEnds = new Date();
    gracePeriodEnds.setDate(gracePeriodEnds.getDate() + 30);

    // Record deletion request
    const deletePayload = {
      user_id: user.id,
      deletion_reason: deletion_reason || null,
      grace_period_ends_at: gracePeriodEnds.toISOString()
    };

    const { data: deletionRecord, error: deleteError } = await supabase
      .from('deleted_accounts')
      .upsert(deletePayload)
      .select()
      .single();

    if (deleteError) {
      console.error('Record deletion error:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to process deletion request' },
        { status: 500 }
      );
    }

    // Soft delete: Update user metadata to mark as deleted
    // Note: Actual user deletion should be done through Supabase Admin API
    // This is just a soft delete marker
    await supabase.auth.updateUser({
      data: {
        deleted: true,
        deleted_at: new Date().toISOString()
      }
    });

    await logAuditEvent({
      supabase,
      request,
      user,
      action: 'delete',
      resourceType: 'user',
      resourceId: user.id,
      resourceName: user.email ?? user.id,
      description: 'Account deletion requested',
      oldValues: existingDeletion ? { deleted_account: existingDeletion } : null,
      newValues: deletionRecord ? { deleted_account: deletionRecord } : { deleted_account: deletePayload },
      metadata: {
        gracePeriodEndsAt: gracePeriodEnds.toISOString(),
        providedReason: deletion_reason || null,
      },
      severity: 'high',
    });

    return NextResponse.json({
      success: true,
      data: {
        grace_period_ends_at: gracePeriodEnds.toISOString(),
        message: 'Account deletion requested. You have 30 days to restore your account.'
      }
    });

  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Restore Account API
 * POST /api/users/restore-account
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if account is in grace period
    const { data: deletedAccount } = await supabase
      .from('deleted_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!deletedAccount) {
      await logAuditEvent({
        supabase,
        request,
        user,
        action: 'activate',
        resourceType: 'user',
        resourceId: user.id,
        resourceName: user.email ?? user.id,
        description: 'Account restore failed - not marked for deletion',
        severity: 'medium',
        success: false,
        errorMessage: 'No deletion record found',
      });

      return NextResponse.json(
        { success: false, error: 'Account is not marked for deletion' },
        { status: 400 }
      );
    }

    if (deletedAccount.restored_at) {
      await logAuditEvent({
        supabase,
        request,
        user,
        action: 'activate',
        resourceType: 'user',
        resourceId: user.id,
        resourceName: user.email ?? user.id,
        description: 'Account restore failed - already restored',
        severity: 'low',
        success: false,
        errorMessage: 'Account already restored',
      });

      return NextResponse.json(
        { success: false, error: 'Account is already restored' },
        { status: 400 }
      );
    }

    const now = new Date();
    const gracePeriodEnds = new Date(deletedAccount.grace_period_ends_at);

    if (now > gracePeriodEnds) {
      await logAuditEvent({
        supabase,
        request,
        user,
        action: 'activate',
        resourceType: 'user',
        resourceId: user.id,
        resourceName: user.email ?? user.id,
        description: 'Account restore failed - grace period expired',
        severity: 'high',
        success: false,
        errorMessage: 'Grace period expired',
        metadata: {
          gracePeriodEndsAt: deletedAccount.grace_period_ends_at,
        },
      });

      return NextResponse.json(
        { success: false, error: 'Grace period has expired. Account cannot be restored.' },
        { status: 400 }
      );
    }

    // Restore account
    const { data: restoredRecord, error: restoreError } = await supabase
      .from('deleted_accounts')
      .update({ restored_at: now.toISOString() })
      .eq('user_id', user.id)
      .select()
      .single();

    if (restoreError) {
      console.error('Restore account error:', restoreError);
      return NextResponse.json(
        { success: false, error: 'Failed to restore account' },
        { status: 500 }
      );
    }

    // Remove deleted flag from user metadata
    await supabase.auth.updateUser({
      data: {
        deleted: false,
        deleted_at: null
      }
    });

    await logAuditEvent({
      supabase,
      request,
      user,
      action: 'activate',
      resourceType: 'user',
      resourceId: user.id,
      resourceName: user.email ?? user.id,
      description: 'Account restored during grace period',
      oldValues: { deleted_account: deletedAccount },
      newValues: restoredRecord ? { deleted_account: restoredRecord } : null,
      metadata: {
        gracePeriodEndsAt: deletedAccount.grace_period_ends_at,
        restoredAt: now.toISOString(),
      },
      severity: 'medium',
    });

    return NextResponse.json({
      success: true,
      message: 'Account restored successfully'
    });

  } catch (error) {
    console.error('Restore account error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

