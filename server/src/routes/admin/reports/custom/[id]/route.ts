/**
 * Admin Custom Report by ID API
 * GET /api/admin/reports/custom/[id] - Get a custom report
 * PUT /api/admin/reports/custom/[id] - Update a custom report
 * DELETE /api/admin/reports/custom/[id] - Delete a custom report
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';

const getCustomReportHandler = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  _user
) => {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    const { data: customReport, error } = await supabase
      .from('custom_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Custom report not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: customReport,
    });
  } catch (error) {
    console.error('Get custom report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch custom report' },
      { status: 500 }
    );
  }
});

export { getCustomReportHandler as GET };

const updateCustomReportHandler = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  _user
) => {
  try {
    const supabase = await createServerClient();
    const { id } = await params;
    const body = await request.json() as {
      name?: string;
      description?: string;
      table_name?: string;
      columns?: string[];
      column_headers?: string[];
      filters?: Record<string, unknown>;
      format?: string;
      include_summary?: boolean;
      include_charts?: boolean;
    };

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.table_name !== undefined) updateData.table_name = body.table_name;
    if (body.columns !== undefined) updateData.columns = body.columns;
    if (body.column_headers !== undefined) updateData.column_headers = body.column_headers;
    if (body.filters !== undefined) updateData.filters = body.filters;
    if (body.format !== undefined) updateData.format = body.format;
    if (body.include_summary !== undefined) updateData.include_summary = body.include_summary;
    if (body.include_charts !== undefined) updateData.include_charts = body.include_charts;

    const { data: customReport, error } = await supabase
      .from('custom_reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Custom report not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: customReport,
    });
  } catch (error) {
    console.error('Update custom report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update custom report' },
      { status: 500 }
    );
  }
});

export { updateCustomReportHandler as PUT };

const deleteCustomReportHandler = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  _user
) => {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    const { error } = await supabase
      .from('custom_reports')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Custom report deleted successfully',
    });
  } catch (error) {
    console.error('Delete custom report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete custom report' },
      { status: 500 }
    );
  }
});

export { deleteCustomReportHandler as DELETE };
