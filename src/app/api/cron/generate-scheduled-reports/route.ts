/**
 * Cron Job: Generate Scheduled Reports
 * 
 * GET/POST /api/cron/generate-scheduled-reports
 * 
 * Generates and emails scheduled reports based on their schedule configuration.
 * 
 * Authentication: Requires CRON_SECRET header or query parameter
 * 
 * Usage:
 * - Cron job (Vercel Cron, external scheduler, etc.)
 * - Manual trigger (for testing)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Resend } from 'resend';

/**
 * Verify cron secret for authentication
 */
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  
  // In development, allow without secret if not configured
  if (process.env.NODE_ENV === 'development' && !cronSecret) {
    console.warn('⚠️ Development mode: CRON_SECRET not configured. Allowing request.');
    return true;
  }

  // Check if request is from Vercel Cron
  const userAgent = request.headers.get('user-agent') || '';
  const isVercelCron = userAgent.toLowerCase().includes('vercel');
  
  // If secret is configured, require it
  if (cronSecret) {
    const headerSecret = request.headers.get('x-cron-secret') || 
                         request.headers.get('authorization')?.replace('Bearer ', '');
    if (headerSecret === cronSecret) {
      return true;
    }

    const querySecret = request.nextUrl.searchParams.get('secret');
    if (querySecret === cronSecret) {
      return true;
    }
  }

  // In production, if CRON_SECRET is set, require it
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    console.error('CRON_SECRET required but not provided');
    return false;
  }

  // Allow Vercel Cron requests if no secret is configured (development/testing)
  if (isVercelCron && !cronSecret) {
    console.warn('⚠️ Vercel Cron detected but CRON_SECRET not configured');
    return true;
  }

  return false;
}

/**
 * Calculate next run time based on frequency and schedule config
 */
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
    case 'quarterly': {
      const dayOfMonth = (scheduleConfig.dayOfMonth as number) || 1;
      const time = (scheduleConfig.time as string) || '09:00';
      const [hours, minutes] = time.split(':').map(Number);
      const currentQuarter = Math.floor(currentTime.getMonth() / 3);
      nextRun.setMonth(currentQuarter * 3 + 3, dayOfMonth);
      nextRun.setHours(hours, minutes, 0, 0);
      if (nextRun <= currentTime) {
        nextRun.setMonth(nextRun.getMonth() + 3);
      }
      break;
    }
    case 'yearly': {
      const dayOfMonth = (scheduleConfig.dayOfMonth as number) || 1;
      const month = (scheduleConfig.month as number) || 0;
      const time = (scheduleConfig.time as string) || '09:00';
      const [hours, minutes] = time.split(':').map(Number);
      nextRun.setMonth(month, dayOfMonth);
      nextRun.setHours(hours, minutes, 0, 0);
      if (nextRun <= currentTime) {
        nextRun.setFullYear(nextRun.getFullYear() + 1);
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

/**
 * Generate PDF report
 */
function generatePDFReport(
  data: any[],
  title: string,
  columns: string[],
  columnHeaders: string[]
): Buffer {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  // Add export date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString('th-TH')}`, 14, 30);
  doc.text(`Total Records: ${data.length}`, 14, 37);

  // Prepare table data
  const headers = columnHeaders.length > 0 ? columnHeaders : columns.map((c) => c.toUpperCase().replace(/_/g, ' '));
  const tableData = data.map((row) => {
    return columns.map((col) => {
      const value = row[col] ?? '';
      return String(value).substring(0, 50); // Limit length for PDF
    });
  });

  // Generate table
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 42,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [220, 53, 69], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 42 },
  });

  // Convert to buffer
  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Generate CSV report
 */
function generateCSVReport(
  data: any[],
  columns: string[],
  columnHeaders: string[]
): string {
  const headers = columnHeaders.length > 0 ? columnHeaders : columns;
  const csvRows: string[] = [];
  
  // Add headers
  csvRows.push(headers.map((h) => escapeCSV(String(h))).join(','));
  
  // Add data rows
  data.forEach((row) => {
    const values = columns.map((col) => {
      const value = row[col] ?? '';
      return escapeCSV(String(value));
    });
    csvRows.push(values.join(','));
  });
  
  return '\ufeff' + csvRows.join('\n'); // BOM for Excel
}

/**
 * Escape CSV value
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Send scheduled report email with attachment
 */
async function sendReportEmail(
  recipients: string[],
  ccRecipients: string[] | null | undefined,
  bccRecipients: string[] | null | undefined,
  reportName: string,
  fileName: string,
  fileContent: Buffer | string,
  mimeType: string,
  rowCount: number
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Check if Resend is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return {
        success: false,
        error: 'Resend API key not configured. Cannot send report emails.',
      };
    }

    const resend = new Resend(resendApiKey);
    const fromEmail = process.env.CONTACT_EMAIL_FROM || 'onboarding@resend.dev';

    // Generate email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .info { background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .info-item { margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 รายงานที่กำหนดเวลา</h1>
            </div>
            <div class="content">
              <p>สวัสดีครับ/ค่ะ,</p>
              <p>รายงาน <strong>${reportName}</strong> ถูกสร้างเสร็จเรียบร้อยแล้ว</p>
              
              <div class="info">
                <div class="info-item"><strong>ชื่อรายงาน:</strong> ${reportName}</div>
                <div class="info-item"><strong>จำนวนรายการ:</strong> ${rowCount.toLocaleString()} รายการ</div>
                <div class="info-item"><strong>วันที่สร้าง:</strong> ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}</div>
                <div class="info-item"><strong>รูปแบบไฟล์:</strong> ${mimeType === 'application/pdf' ? 'PDF' : 'CSV'}</div>
              </div>
              
              <p>รายงานถูกแนบมาในอีเมลนี้ กรุณาตรวจสอบไฟล์แนบ</p>
              
              <p>ขอแสดงความนับถือ<br>ระบบจัดการรายงานอัตโนมัติ</p>
            </div>
            <div class="footer">
              <p>อีเมลนี้ถูกส่งอัตโนมัติจากระบบ MUAYTHAI Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Convert file content to base64 for attachment
    const fileBuffer = Buffer.isBuffer(fileContent) 
      ? fileContent 
      : Buffer.from(fileContent, 'utf-8');
    const base64Content = fileBuffer.toString('base64');

    // Send email with attachment
    const result = await resend.emails.send({
      from: fromEmail,
      to: recipients,
      cc: ccRecipients && ccRecipients.length > 0 ? ccRecipients : undefined,
      bcc: bccRecipients && bccRecipients.length > 0 ? bccRecipients : undefined,
      subject: `รายงานที่กำหนดเวลา: ${reportName}`,
      html: emailHtml,
      attachments: [
        {
          filename: fileName,
          content: base64Content,
        },
      ],
    });

    if (result.error) {
      console.error('Failed to send report email:', result.error);
      return {
        success: false,
        error: result.error.message || 'Failed to send email',
      };
    }

    console.log('✅ Report email sent successfully:', result.data?.id);
    return {
      success: true,
      id: result.data?.id,
    };
  } catch (error) {
    console.error('Error sending report email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * GET /api/cron/generate-scheduled-reports
 * POST /api/cron/generate-scheduled-reports
 */
export async function GET(request: NextRequest) {
  return handleGenerateScheduledReports(request);
}

export async function POST(request: NextRequest) {
  return handleGenerateScheduledReports(request);
}

async function handleGenerateScheduledReports(request: NextRequest) {
  try {
    // Verify authentication
    if (!verifyCronSecret(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid or missing CRON_SECRET' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const now = new Date();

    // Find scheduled reports that are due
    const { data: scheduledReports, error: fetchError } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('status', 'active')
      .eq('is_active', true)
      .lte('next_run_at', now.toISOString());

    if (fetchError) {
      throw fetchError;
    }

    if (!scheduledReports || scheduledReports.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No scheduled reports due for generation',
        processed: 0,
      });
    }

    const results = {
      processed: 0,
      generated: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each scheduled report
    for (const scheduledReport of scheduledReports) {
      let executionId: string | null = null;
      
      try {
        // Create execution record
        const { data: execution, error: executionError } = await supabase
          .from('scheduled_report_executions')
          .insert({
            scheduled_report_id: scheduledReport.id,
            started_at: now.toISOString(),
            status: 'running',
          })
          .select()
          .single();

        if (executionError) {
          throw executionError;
        }

        executionId = execution.id;
        results.processed++;

        // Get custom report if linked
        let tableName = scheduledReport.table_name;
        let columns = scheduledReport.columns || [];
        let columnHeaders = scheduledReport.column_headers || [];
        let filters = scheduledReport.filters || {};

        if (scheduledReport.custom_report_id) {
          const { data: customReport, error: customError } = await supabase
            .from('custom_reports')
            .select('*')
            .eq('id', scheduledReport.custom_report_id)
            .single();

          if (customError) {
            throw new Error(`Failed to fetch custom report: ${customError.message}`);
          }

          tableName = customReport.table_name;
          columns = customReport.columns;
          columnHeaders = customReport.column_headers || customReport.columns;
          filters = { ...filters, ...customReport.filters };
        }

        // Fetch data from table
        let query = supabase.from(tableName).select('*');

        // Apply filters
        if (filters.dateFrom && filters.dateTo) {
          query = query
            .gte('created_at', filters.dateFrom as string)
            .lte('created_at', filters.dateTo as string);
        }
        if (filters.status) {
          query = query.eq('status', filters.status as string);
        }

        const { data: reportData, error: dataError } = await query;

        if (dataError) {
          throw new Error(`Failed to fetch report data: ${dataError.message}`);
        }

        if (!reportData || reportData.length === 0) {
          // No data, but mark as completed
          await supabase
            .from('scheduled_report_executions')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              rows_processed: 0,
              email_sent: false,
            })
            .eq('id', executionId);

          // Update scheduled report stats
          await supabase
            .from('scheduled_reports')
            .update({
              last_run_at: now.toISOString(),
              next_run_at: calculateNextRunAt(
                scheduledReport.frequency,
                scheduledReport.schedule_config as Record<string, unknown>
              ).toISOString(),
              run_count: (scheduledReport.run_count || 0) + 1,
              success_count: (scheduledReport.success_count || 0) + 1,
            })
            .eq('id', scheduledReport.id);

          continue;
        }

        // Generate report file
        let fileContent: Buffer | string;
        let fileName: string;
        let mimeType: string;

        if (scheduledReport.format === 'pdf') {
          fileContent = generatePDFReport(
            reportData,
            scheduledReport.name,
            columns,
            columnHeaders
          );
          fileName = `${scheduledReport.name}-${now.toISOString().split('T')[0]}.pdf`;
          mimeType = 'application/pdf';
        } else if (scheduledReport.format === 'csv') {
          fileContent = generateCSVReport(reportData, columns, columnHeaders);
          fileName = `${scheduledReport.name}-${now.toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
        } else {
          throw new Error(`Unsupported format: ${scheduledReport.format}`);
        }

        // Upload to storage (optional - if using Supabase Storage)
        const fileUrl: string | null = null;
        const fileSizeBytes = Buffer.isBuffer(fileContent) 
          ? fileContent.length 
          : Buffer.from(fileContent, 'utf-8').length;

        // TODO: Upload to Supabase Storage if needed
        // For now, we'll just store the file reference in the execution record

        // Send email with report attachment
        let emailSent = false;
        let emailSentAt: string | null = null;
        let emailError: string | null = null;

        if (scheduledReport.recipients && scheduledReport.recipients.length > 0) {
          const emailResult = await sendReportEmail(
            scheduledReport.recipients,
            scheduledReport.cc_recipients,
            scheduledReport.bcc_recipients,
            scheduledReport.name,
            fileName,
            fileContent,
            mimeType,
            reportData.length
          );

          emailSent = emailResult.success;
          emailSentAt = emailResult.success ? new Date().toISOString() : null;
          emailError = emailResult.error || null;

          if (!emailResult.success) {
            console.error(`Failed to send report email for ${scheduledReport.name}:`, emailResult.error);
          }
        } else {
          console.warn(`No recipients specified for scheduled report ${scheduledReport.id}`);
        }

        // Update execution record
        await supabase
          .from('scheduled_report_executions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            rows_processed: reportData.length,
            file_url: fileUrl,
            file_size_bytes: fileSizeBytes,
            email_sent: emailSent,
            email_sent_at: emailSentAt,
            email_recipients: scheduledReport.recipients,
            error_message: emailError || null,
          })
          .eq('id', executionId);

        // Update scheduled report stats
        const nextRunAt = calculateNextRunAt(
          scheduledReport.frequency,
          scheduledReport.schedule_config as Record<string, unknown>
        );

        await supabase
          .from('scheduled_reports')
          .update({
            last_run_at: now.toISOString(),
            next_run_at: nextRunAt.toISOString(),
            run_count: (scheduledReport.run_count || 0) + 1,
            success_count: (scheduledReport.success_count || 0) + 1,
          })
          .eq('id', scheduledReport.id);

        results.generated++;

      } catch (error) {
        console.error(`Error processing scheduled report ${scheduledReport.id}:`, error);
        
        if (executionId) {
          await supabase
            .from('scheduled_report_executions')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: error instanceof Error ? error.message : 'Unknown error',
            })
            .eq('id', executionId);
        }

        // Update scheduled report stats
        await supabase
          .from('scheduled_reports')
          .update({
            last_run_at: now.toISOString(),
            failure_count: (scheduledReport.failure_count || 0) + 1,
            last_error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', scheduledReport.id);

        results.failed++;
        results.errors.push(
          `Report ${scheduledReport.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} scheduled reports`,
      data: results,
    });

  } catch (error) {
    console.error('Generate scheduled reports error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
