/**
 * Admin Scheduled Reports API
 * GET /api/admin/reports/scheduled - Get all scheduled reports
 * POST /api/admin/reports/scheduled - Create a new scheduled report
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { withAdminAuth } from '@/lib/api/withAdminAuth';

// Helper function to calculate next_run_at based on frequency and schedule_config
function calculateNextRunAt(
  frequency: string,
  scheduleConfig: Record<string, unknown>,
  currentTime: Date = new Date()
): Date {
  const nextRun = new Date(currentTime);

  switch (frequency) {
    case 'daily': {
      const time = (scheduleConfig.time as string) || '09:00';
      const [hours, minutes] = time.split(':').map(Number);
      nextRun.setHours(hours, minutes, 0, 0);
      if (nextRun <= currentTime) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
    }
    case 'weekly': {
      const dayOfWeek = (scheduleConfig.dayOfWeek as number) || 1; // 1 = Monday
      const time = (scheduleConfig.time as string) || '09:00';
      const [hours, minutes] = time.split(':').map(Number);
      
      const currentDay = currentTime.getDay() === 0 ? 7 : currentTime.getDay(); // Convert Sunday to 7
      const daysUntilNext = (dayOfWeek - currentDay + 7) % 7 || 7;
      
      nextRun.setDate(nextRun.getDate() + daysUntilNext);
      nextRun.setHours(hours, minutes, 0, 0);
      break;
    }
    case 'monthly': {
      const dayOfMonth = (scheduleConfig.dayOfMonth as number) || 1;
      const time = (scheduleConfig.time as string) || '09:00';
      const [hours, minutes] = time.split(':').map(Number);
      
      nextRun.setDate(dayOfMonth);
      nextRun.setHours(hours, minutes, 0, 0);
      if (nextRun <= currentTime) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;
    }
    case 'quarterly': {
      const dayOfMonth = (scheduleConfig.dayOfMonth as number) || 1;
      const time = (scheduleConfig.time as string) || '09:00';
      const [hours, minutes] = time.split(':').map(Number);
      
      nextRun.setDate(dayOfMonth);
      nextRun.setHours(hours, minutes, 0, 0);
      
      const currentQuarter = Math.floor(currentTime.getMonth() / 3);
      const nextQuarter = currentQuarter + 1;
      const targetMonth = nextQuarter * 3;
      
      nextRun.setMonth(targetMonth);
      if (nextRun <= currentTime) {
        nextRun.setMonth(nextRun.getMonth() + 3);
      }
      break;
    }
    case 'yearly': {
      const month = (scheduleConfig.month as number) || 0; // 0 = January
      const dayOfMonth = (scheduleConfig.dayOfMonth as number) || 1;
      const time = (scheduleConfig.time as string) || '09:00';
      const [hours, minutes] = time.split(':').map(Number);
      
      nextRun.setMonth(month);
      nextRun.setDate(dayOfMonth);
      nextRun.setHours(hours, minutes, 0, 0);
      if (nextRun <= currentTime) {
        nextRun.setFullYear(nextRun.getFullYear() + 1);
      }
      break;
    }
    default:
      // For 'custom', use next_run_at from request or default to tomorrow
      if (scheduleConfig.nextRunAt) {
        return new Date(scheduleConfig.nextRunAt as string);
      }
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(9, 0, 0, 0);
  }

  return nextRun;
}

const getScheduledReportsHandler = withAdminAuth(async (
  request: NextRequest,
  _context,
  _user
) => {
  try {
    const supabase = await createClient();
    
    const { data: scheduledReports, error } = await supabase
      .from('scheduled_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: scheduledReports || [],
    });
  } catch (error) {
    console.error('Get scheduled reports error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scheduled reports' },
      { status: 500 }
    );
  }
});

const createScheduledReportHandler = withAdminAuth(async (
  request: NextRequest,
  _context,
  user
) => {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      custom_report_id,
      name,
      description,
      table_name,
      columns,
      column_headers,
      filters,
      format,
      frequency,
      schedule_config,
      recipients,
      cc_recipients,
      bcc_recipients,
    } = body;

    // Validation
    if (!name || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, recipients' },
        { status: 400 }
      );
    }

    if (!custom_report_id && (!table_name || !columns || columns.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Either custom_report_id or table_name and columns are required' },
        { status: 400 }
      );
    }

    if (!frequency || !schedule_config) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: frequency, schedule_config' },
        { status: 400 }
      );
    }

    // Calculate next_run_at
    const nextRunAt = calculateNextRunAt(frequency, schedule_config);

    const { data: scheduledReport, error } = await supabase
      .from('scheduled_reports')
      .insert({
        created_by: user.id,
        custom_report_id: custom_report_id || null,
        name,
        description: description || null,
        table_name: custom_report_id ? '' : table_name, // Will be filled from custom_report if provided
        columns: custom_report_id ? null : columns,
        column_headers: custom_report_id ? null : column_headers,
        filters: filters || {},
        format: format || 'pdf',
        frequency,
        schedule_config,
        next_run_at: nextRunAt.toISOString(),
        recipients,
        cc_recipients: cc_recipients || null,
        bcc_recipients: bcc_recipients || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: scheduledReport,
    });
  } catch (error) {
    console.error('Create scheduled report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create scheduled report' },
      { status: 500 }
    );
  }
});

export { getScheduledReportsHandler as GET, createScheduledReportHandler as POST };
