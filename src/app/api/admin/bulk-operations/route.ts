import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { withAdminAuth } from '@/lib/api/withAdminAuth';

/**
 * POST /api/admin/bulk-operations
 * Bulk operations for admin (approve/reject/delete multiple items)
 * Body: {
 *   operation: 'approve' | 'reject' | 'delete',
 *   table: 'gyms' | 'partner_applications' | 'articles' | 'events' | 'products',
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
    const body = await request.json();
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

    const validTables = ['gyms', 'partner_applications', 'articles', 'events', 'products', 'promotions'];
    if (!validTables.includes(table)) {
      return NextResponse.json(
        { success: false, error: 'Invalid table' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    let deleteOperation = false;

    // Map operation to database update
    switch (operation) {
      case 'approve':
        if (table === 'gyms' || table === 'partner_applications') {
          updateData = { status: 'approved', is_approved: true };
        } else if (table === 'articles') {
          updateData = { is_published: true };
        } else if (table === 'events') {
          updateData = { is_published: true };
        } else if (table === 'products') {
          updateData = { is_published: true };
        }
        break;
      case 'reject':
        if (table === 'gyms' || table === 'partner_applications') {
          updateData = { status: 'rejected', is_approved: false };
        } else if (table === 'articles') {
          updateData = { is_published: false };
        } else if (table === 'events') {
          updateData = { is_published: false };
        } else if (table === 'products') {
          updateData = { is_published: false };
        }
        break;
      case 'activate':
        if (table === 'promotions') {
          updateData = { is_active: true };
        }
        break;
      case 'deactivate':
        if (table === 'promotions') {
          updateData = { is_active: false };
        }
        break;
      case 'delete':
        deleteOperation = true;
        break;
    }

    let result;
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

