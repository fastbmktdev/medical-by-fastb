/**
 * Admin Custom Reports API
 * GET /api/admin/reports/custom - Get all custom reports
 * POST /api/admin/reports/custom - Create a new custom report
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';
// import type { CustomReport } from '@shared/types/database.types';

const getCustomReportsHandler = withAdminAuth(async (
  request: NextRequest,
  _context,
  _user
) => {
  try {
    const supabase = await createServerClient();
    
    const { data: customReports, error } = await supabase
      .from('custom_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: customReports || [],
    });
  } catch (error) {
    console.error('Get custom reports error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch custom reports' },
      { status: 500 }
    );
  }
});

const createCustomReportHandler = withAdminAuth(async (
  request: NextRequest,
  _context,
  user
) => {
  try {
    const supabase = await createServerClient();
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

    const {
      name,
      description,
      table_name,
      columns,
      column_headers,
      filters,
      format,
      include_summary,
      include_charts,
    } = body;

    // Validation
    if (!name || !table_name || !columns || columns.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, table_name, columns' },
        { status: 400 }
      );
    }

    const { data: customReport, error } = await supabase
      .from('custom_reports')
      .insert({
        created_by: user.id,
        name,
        description: description || null,
        table_name,
        columns,
        column_headers: column_headers || null,
        filters: filters || {},
        format: format || 'pdf',
        include_summary: include_summary || false,
        include_charts: include_charts || false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: customReport,
    });
  } catch (error) {
    console.error('Create custom report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create custom report' },
      { status: 500 }
    );
  }
});

export { getCustomReportsHandler as GET, createCustomReportHandler as POST };
