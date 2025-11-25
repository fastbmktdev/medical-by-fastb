/**
 * Admin Audit Logs API
 * GET /api/admin/audit-logs - ดู audit logs ทั้งหมด
 * 
 * Query params:
 * - limit: number of results (default: 50, max: 200)
 * - offset: pagination offset (default: 0)
 * - userId: filter by user_id (optional)
 * - actionType: filter by action_type (optional)
 * - resourceType: filter by resource_type (optional)
 * - severity: filter by severity (optional)
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - success: filter by success status (optional, true/false)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';

const getAuditLogsHandler = withAdminAuth(async (
  request: NextRequest,
  _context,
  _user
) => {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const userId = searchParams.get('userId');
    const actionType = searchParams.get('actionType');
    const resourceType = searchParams.get('resourceType');
    const severity = searchParams.get('severity');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const successParam = searchParams.get('success');
    
    // Build query
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (actionType) {
      query = query.eq('action_type', actionType);
    }
    
    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }
    
    if (severity) {
      query = query.eq('severity', severity);
    }
    
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        query = query.gte('created_at', start.toISOString());
      }
    }
    
    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        // Add one day to include the entire end date
        const endPlusOne = new Date(end);
        endPlusOne.setDate(endPlusOne.getDate() + 1);
        query = query.lt('created_at', endPlusOne.toISOString());
      }
    }
    
    if (successParam !== null) {
      query = query.eq('success', successParam === 'true');
    }
    
    const { data: auditLogs, error } = await query;
    
    if (error) {
      console.error('Error fetching audit logs:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch audit logs', details: error.message },
        { status: 500 }
      );
    }
    
    // Get total count for pagination (with same filters)
    let countQuery = supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });
    
    // Apply same filters to count query
    if (userId) {
      countQuery = countQuery.eq('user_id', userId);
    }
    if (actionType) {
      countQuery = countQuery.eq('action_type', actionType);
    }
    if (resourceType) {
      countQuery = countQuery.eq('resource_type', resourceType);
    }
    if (severity) {
      countQuery = countQuery.eq('severity', severity);
    }
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        countQuery = countQuery.gte('created_at', start.toISOString());
      }
    }
    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        const endPlusOne = new Date(end);
        endPlusOne.setDate(endPlusOne.getDate() + 1);
        countQuery = countQuery.lt('created_at', endPlusOne.toISOString());
      }
    }
    if (successParam !== null) {
      countQuery = countQuery.eq('success', successParam === 'true');
    }
    
    const { count } = await countQuery;
    
    return NextResponse.json({
      success: true,
      data: {
        auditLogs: auditLogs || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit,
        },
      },
    });
    
  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export { getAuditLogsHandler as GET };

