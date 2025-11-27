/**
 * Admin Scheduled Report by ID API
 * GET /api/admin/reports/scheduled/[id] - Get a scheduled report
 * PUT /api/admin/reports/scheduled/[id] - Update a scheduled report
 * DELETE /api/admin/reports/scheduled/[id] - Delete a scheduled report
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';

// Helper function to calculate next_run_at (reuse from route.ts if needed)
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
      const dayOfWeek = (scheduleConfig.dayOfWeek as number) || 1;
      const time = (scheduleConfig.time as string) || '09:00';
      const [hours, minutes] = time.split(':').map(Number);
      const currentDay = currentTime.getDay() === 0 ? 7 : currentTime.getDay();
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
    default:
      if (scheduleConfig.nextRunAt) {
        return new Date(scheduleConfig.nextRunAt as string);
      }
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(9, 0, 0, 0);
  }
  return nextRun;
}

const getScheduledReportHandler = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  _user
) => {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

      const { data: scheduledReport, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { success: false, error: 'Scheduled report not found' },
            { status: 404 }
          );
        }
        throw error;
      }

      return NextResponse.json({
        success: true,
        data: scheduledReport,
      });
    } catch (error) {
      console.error('Get scheduled report error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch scheduled report' },
        { status: 500 }
      );
    }
});

export { getScheduledReportHandler as GET };

const updateScheduledReportHandler = withAdminAuth(async (
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
      status?: string;
      is_active?: boolean;
      frequency?: string;
      schedule_config?: Record<string, unknown>;
      recipients?: string[];
      cc_recipients?: string[];
      bcc_recipients?: string[];
    };

      const updateData: Record<string, unknown> = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.is_active !== undefined) updateData.is_active = body.is_active;
      if (body.frequency !== undefined) updateData.frequency = body.frequency;
      if (body.schedule_config !== undefined) {
        updateData.schedule_config = body.schedule_config;
        // Recalculate next_run_at if schedule changed
        if (body.frequency || body.schedule_config) {
          const currentReport = await supabase
            .from('scheduled_reports')
            .select('frequency, schedule_config')
            .eq('id', id)
            .single();
          
          const frequency = body.frequency || (currentReport.data as { frequency?: string } | null)?.frequency;
          const scheduleConfig = body.schedule_config || (currentReport.data as { schedule_config?: Record<string, unknown> } | null)?.schedule_config;
          
          if (frequency && scheduleConfig) {
            updateData.next_run_at = calculateNextRunAt(frequency, scheduleConfig).toISOString();
          }
        }
      }
      if (body.recipients !== undefined) updateData.recipients = body.recipients;
      if (body.cc_recipients !== undefined) updateData.cc_recipients = body.cc_recipients;
      if (body.bcc_recipients !== undefined) updateData.bcc_recipients = body.bcc_recipients;

      const { data: scheduledReport, error } = await supabase
        .from('scheduled_reports')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { success: false, error: 'Scheduled report not found' },
            { status: 404 }
          );
        }
        throw error;
      }

      return NextResponse.json({
        success: true,
        data: scheduledReport,
      });
    } catch (error) {
      console.error('Update scheduled report error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update scheduled report' },
        { status: 500 }
      );
    }
});

export { updateScheduledReportHandler as PUT };

const deleteScheduledReportHandler = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  _user
) => {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

      // Soft delete by setting status to 'deleted' and deleted_at
      const { data: scheduledReport, error } = await supabase
        .from('scheduled_reports')
        .update({
          status: 'deleted',
          is_active: false,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { success: false, error: 'Scheduled report not found' },
            { status: 404 }
          );
        }
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: 'Scheduled report deleted successfully',
        data: scheduledReport,
      });
    } catch (error) {
      console.error('Delete scheduled report error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete scheduled report' },
        { status: 500 }
      );
    }
});

export { deleteScheduledReportHandler as DELETE };
