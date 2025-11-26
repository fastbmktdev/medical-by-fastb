import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';

/**
 * POST /api/admin/bulk-operations
 * Bulk operations for admin (approve/reject/delete multiple items)
 * Body: {
 *   operation: 'approve' | 'reject' | 'delete',
 *   table: 'hospitals' | 'partner_applications' | 'articles' | 'products',
 *   ids: string[]
 * }
 */
export const POST = withAdminAuth<Record<string, never>>(async (
  request: NextRequest,
  _context: { params: Promise<Record<string, never>> },
  _user
) => {
  try {
    const supabase = await createClient();
    const body = await request.json() as {
      operation?: string;
      table?: string;
      ids?: unknown[];
    };
    const { operation, table, ids } = body;

    if (!operation || !table || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: operation, table, ids' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'delete', 'activate', 'deactivate'].includes(operation)) {
      return NextResponse.json(
        { success: false, error: 'Invalid operation' },
        { status: 400 }
      );
    }

    const validTables = [
      'hospitals',
      'partner_applications',
      'articles',
      'products',
      'promotions',
      'appointments',
    ] as const;
    if (!table || !validTables.includes(table as typeof validTables[number])) {
      return NextResponse.json(
        { success: false, error: 'Invalid table' },
        { status: 400 }
      );
    }

    let updateData: Record<string, unknown> = {};
    let deleteOperation = false;
    const timestamp = new Date().toISOString();

    // Map operation to database update
    switch (operation) {
      case 'approve':
        if (table === 'hospitals' || table === 'partner_applications') {
          updateData = { status: 'approved', is_approved: true, updated_at: timestamp };
        } else if (table === 'articles') {
          updateData = { is_published: true, updated_at: timestamp };
        } else if (table === 'products') {
          updateData = { is_published: true, updated_at: timestamp };
        } else if (table === 'promotions') {
          updateData = { is_active: true, updated_at: timestamp };
        } else if (table === 'appointments') {
          updateData = { status: 'confirmed', updated_at: timestamp };
        }
        break;
      case 'reject':
        if (table === 'hospitals' || table === 'partner_applications') {
          updateData = { status: 'rejected', is_approved: false, updated_at: timestamp };
        } else if (table === 'articles') {
          updateData = { is_published: false, updated_at: timestamp };
        } else if (table === 'products') {
          updateData = { is_published: false, updated_at: timestamp };
        } else if (table === 'promotions') {
          updateData = { is_active: false, updated_at: timestamp };
        } else if (table === 'appointments') {
          updateData = { status: 'cancelled', updated_at: timestamp };
        }
        break;
      case 'activate':
        if (table === 'promotions') {
          updateData = { is_active: true, updated_at: timestamp };
        }
        break;
      case 'deactivate':
        if (table === 'promotions') {
          updateData = { is_active: false, updated_at: timestamp };
        }
        break;
      case 'delete':
        deleteOperation = true;
        break;
    }

    if (!deleteOperation && Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Operation "${operation}" is not supported for table "${table}"`,
        },
        { status: 400 },
      );
    }

    let affectedCount = 0;

    if (deleteOperation) {
      // Delete operations
      const { error } = await supabase
        .from(table)
        .delete()
        .in('id', ids);

      if (error) {
        throw error;
      }

      affectedCount = ids.length;
    } else {
      // Update operations
      const { data, error } = await supabase
        .from(table)
        .update(updateData)
        .in('id', ids)
        .select('id');

      if (error) {
        throw error;
      }

      affectedCount = data?.length || 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        operation,
        table,
        affectedCount,
        ids,
      },
    });
  } catch (error) {
    console.error('Bulk operation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

