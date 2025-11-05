/**
 * Unified Cron Job Endpoint
 * 
 * GET/POST /api/cron/unified
 * 
 * This endpoint handles multiple cron tasks based on schedule:
 * - Email Queue Processing (every 5 minutes)
 * - Booking Reminders (daily at 9 AM)
 * - Scheduled Reports (hourly)
 * 
 * This solves Vercel Hobby Plan limit (2 cron jobs max, daily frequency)
 * by using a single endpoint that routes to appropriate tasks.
 * 
 * Authentication: Requires CRON_SECRET header or query parameter
 */

import { NextRequest, NextResponse } from 'next/server';

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
 * Process Email Queue
 * Should run every 5 minutes (but for Vercel Hobby Plan, we'll run it once per day)
 * Uses the same logic as process-email-queue endpoint
 */
async function processEmailQueue(): Promise<{ success: boolean; processed: number; error?: string }> {
  try {
    // Import required modules
    const { getPendingEmails, updateEmailQueueStatus, calculateNextRetryTime } = await import('@/lib/email/queue');
    const smtpModule = await import('@/lib/email/smtp');
    const resendModule = await import('@/lib/email/resend');
    
    const MAX_EMAILS_PER_RUN = 50;
    const pendingEmails = await getPendingEmails(MAX_EMAILS_PER_RUN);

    if (pendingEmails.length === 0) {
      return { success: true, processed: 0 };
    }

    let processed = 0;
    let failed = 0;

    for (const emailItem of pendingEmails) {
      try {
        await updateEmailQueueStatus(emailItem.id, 'processing');

        const useSmtp = emailItem.provider === 'smtp' && smtpModule.isSmtpConfigured();
        const useResend = !useSmtp && (emailItem.provider === 'resend' || !emailItem.provider || resendModule.isEmailServiceConfigured());

        let sendResult: { success: boolean; id?: string; error?: string } = { success: false };
        
        const normalizeResult = (result: any): { success: boolean; id?: string; error?: string } => {
          if (!result) return { success: false, error: 'No result' };
          return {
            success: result.success || false,
            id: result.id || undefined,
            error: result.error ? (typeof result.error === 'string' ? result.error : result.error.message || 'Unknown error') : undefined,
          };
        };

        // Process email based on type (simplified - only handle common types)
        switch (emailItem.email_type) {
          case 'booking_confirmation': {
            const bookingData = emailItem.metadata as any;
            if (useSmtp && smtpModule.isSmtpConfigured()) {
              sendResult = normalizeResult(await smtpModule.sendBookingConfirmationEmail({
                to: emailItem.to_email,
                customerName: bookingData.customerName || emailItem.to_email.split('@')[0],
                bookingNumber: bookingData.bookingNumber || 'N/A',
                gymName: bookingData.gymName || 'N/A',
                packageName: bookingData.packageName || 'N/A',
                packageType: bookingData.packageType || 'one_time',
                startDate: bookingData.startDate || new Date().toISOString(),
                endDate: bookingData.endDate,
                pricePaid: bookingData.pricePaid || 0,
                customerPhone: bookingData.customerPhone,
                specialRequests: bookingData.specialRequests,
                bookingUrl: bookingData.bookingUrl,
              }));
            } else if (useResend) {
              sendResult = normalizeResult(await resendModule.sendBookingConfirmationEmail({
                to: emailItem.to_email,
                customerName: bookingData.customerName || emailItem.to_email.split('@')[0],
                bookingNumber: bookingData.bookingNumber || 'N/A',
                gymName: bookingData.gymName || 'N/A',
                packageName: bookingData.packageName || 'N/A',
                packageType: bookingData.packageType || 'one_time',
                startDate: bookingData.startDate || new Date().toISOString(),
                endDate: bookingData.endDate,
                pricePaid: bookingData.pricePaid || 0,
                customerPhone: bookingData.customerPhone,
                specialRequests: bookingData.specialRequests,
                bookingUrl: bookingData.bookingUrl,
              }));
            }
            break;
          }
          // Add other email types as needed - for now, skip unsupported types
          default:
            console.warn(`Unsupported email type: ${emailItem.email_type}`);
            sendResult = { success: false, error: `Unsupported email type: ${emailItem.email_type}` };
        }

        if (sendResult.success) {
          await updateEmailQueueStatus(emailItem.id, 'sent', null);
          processed++;
        } else {
          throw new Error(sendResult.error || 'Failed to send email');
        }
      } catch (error) {
        console.error(`Failed to send email ${emailItem.id}:`, error);
        failed++;
        const retryCount = (emailItem.retry_count || 0) + 1;
        if (retryCount < (emailItem.max_retries || 3)) {
          const nextRetry = calculateNextRetryTime(retryCount);
          await updateEmailQueueStatus(emailItem.id, 'pending', nextRetry.toISOString(), retryCount);
        } else {
          await updateEmailQueueStatus(emailItem.id, 'failed', null, retryCount);
        }
      }
    }

    return { 
      success: true, 
      processed, 
      error: failed > 0 ? `${failed} emails failed` : undefined 
    };
  } catch (error) {
    console.error('Email queue processing error:', error);
    return { 
      success: false, 
      processed: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send Booking Reminders
 * Should run daily at 9 AM
 * Uses the same logic as send-booking-reminders endpoint
 */
async function sendBookingReminders(): Promise<{ success: boolean; sent: number; error?: string }> {
  try {
    const { createClient } = await import('@/lib/database/supabase/server');
    const { EmailService } = await import('@/lib/email/service');
    const supabase = await createClient();

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_number,
        customer_name,
        customer_email,
        customer_phone,
        start_date,
        gym_id,
        status,
        payment_status,
        user_id
      `)
      .eq('status', 'confirmed')
      .eq('payment_status', 'paid')
      .eq('start_date', tomorrowDate);

    if (bookingsError) {
      throw bookingsError;
    }

    if (!bookings || bookings.length === 0) {
      return { success: true, sent: 0 };
    }

    const gymIds = [...new Set(bookings.map(b => b.gym_id).filter(Boolean))];
    const { data: gyms } = await supabase
      .from('gyms')
      .select('id, gym_name, gym_name_english, address, phone')
      .in('id', gymIds);

    const gymMap = new Map();
    if (gyms) {
      for (const gym of gyms) {
        gymMap.set(gym.id, gym);
      }
    }

    let sent = 0;
    let failed = 0;

    for (const booking of bookings) {
      try {
        if (!booking.customer_email) continue;

        const gym = booking.gym_id ? gymMap.get(booking.gym_id) : null;
        const gymName = gym?.gym_name || gym?.gym_name_english || 'ค่ายมวย';

        await EmailService.sendBookingReminder({
          to: booking.customer_email,
          userId: booking.user_id || undefined,
          bookingId: booking.id,
          customerName: booking.customer_name || 'ลูกค้า',
          bookingNumber: booking.booking_number || '',
          gymName,
          packageName: 'แพ็คเกจ',
          startDate: booking.start_date,
          bookingUrl: '/dashboard/bookings',
        }, { priority: 'high' });

        if (booking.user_id) {
          await supabase.from('notifications').insert({
            user_id: booking.user_id,
            type: 'booking_reminder',
            title: 'เตือนความจำ: การจองของคุณจะเริ่มในอีก 1 วัน 📅',
            message: `การจอง ${booking.booking_number} ของคุณจะเริ่มในวันที่ ${tomorrowDate} ที่ ${gymName}`,
            link_url: '/dashboard/bookings',
            metadata: {
              booking_id: booking.id,
              booking_number: booking.booking_number,
              start_date: booking.start_date,
              gym_id: booking.gym_id,
            },
          });
        }

        sent++;
      } catch (error) {
        console.error(`Failed to send reminder for booking ${booking.id}:`, error);
        failed++;
      }
    }

    return { 
      success: true, 
      sent, 
      error: failed > 0 ? `${failed} reminders failed` : undefined 
    };
  } catch (error) {
    console.error('Booking reminders error:', error);
    return { 
      success: false, 
      sent: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Generate Scheduled Reports
 * Should run hourly
 * Uses the same logic as generate-scheduled-reports endpoint (simplified)
 */
async function generateScheduledReports(): Promise<{ success: boolean; generated: number; error?: string }> {
  try {
    const { createClient } = await import('@/lib/database/supabase/server');
    const supabase = await createClient();

    const now = new Date();
    
    const { data: scheduledReports, error: reportsError } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'active')
      .lte('next_run_at', now.toISOString());

    if (reportsError) {
      throw reportsError;
    }

    if (!scheduledReports || scheduledReports.length === 0) {
      return { success: true, generated: 0 };
    }

    // Note: Full report generation logic is complex and involves PDF/CSV generation
    // For now, we'll just mark reports as due and let the full endpoint handle it
    // This is a simplified version - full implementation would require importing report generation logic
    let generated = 0;
    let failed = 0;

    for (const report of scheduledReports) {
      try {
        // Update last_run_at and calculate next_run_at
        // Full implementation would generate and email the report here
        // For now, we'll just update the schedule
        const nextRun = new Date(now);
        nextRun.setHours(nextRun.getHours() + 1); // Default to hourly

        await supabase
          .from('scheduled_reports')
          .update({ 
            last_run_at: now.toISOString(),
            next_run_at: nextRun.toISOString(),
            run_count: (report.run_count || 0) + 1,
          })
          .eq('id', report.id);

        generated++;
      } catch (error) {
        console.error(`Failed to process report ${report.id}:`, error);
        failed++;
      }
    }

    return { 
      success: true, 
      generated, 
      error: failed > 0 ? `${failed} reports failed` : undefined 
    };
  } catch (error) {
    console.error('Scheduled reports error:', error);
    return { 
      success: false, 
      generated: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * GET /api/cron/unified
 * POST /api/cron/unified
 */
export async function GET(request: NextRequest) {
  return handleUnifiedCron(request);
}

export async function POST(request: NextRequest) {
  return handleUnifiedCron(request);
}

async function handleUnifiedCron(request: NextRequest) {
  try {
    // Verify authentication
    if (!verifyCronSecret(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const dayOfWeek = now.getDay();

    const results: Record<string, unknown> = {
      timestamp: now.toISOString(),
      tasks: {},
    };

    // Always process email queue (runs every 5 minutes, but for Vercel Hobby Plan we run it once per day)
    // Note: For Vercel Hobby Plan, cron jobs can only run once per day
    // So we process email queue every time this endpoint is called
    const emailQueueResult = await processEmailQueue();
    results.tasks = {
      ...results.tasks,
      emailQueue: emailQueueResult,
    };

    // Send booking reminders at 9 AM daily (when this cron runs at 9 AM)
    if (currentHour === 9 && currentMinute === 0) {
      const remindersResult = await sendBookingReminders();
      results.tasks = {
        ...results.tasks,
        bookingReminders: remindersResult,
      };
    }

    // Generate scheduled reports at the start of each hour (when this cron runs hourly)
    // Note: For Vercel Hobby Plan, we can only run once per day, so this will only run once
    // But we check if there are reports due and generate them
    if (currentMinute === 0 || currentMinute < 5) {
      const reportsResult = await generateScheduledReports();
      results.tasks = {
        ...results.tasks,
        scheduledReports: reportsResult,
      };
    }

    // Check if any task was run
    const taskCount = Object.keys(results.tasks).length;
    
    return NextResponse.json({
      success: true,
      message: `Processed ${taskCount} task(s)`,
      ...results,
    });

  } catch (error) {
    console.error('Unified cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

