/**
 * Cron Job: Send appointment Reminder Emails
 * 
 * GET/POST /api/cron/send-appointment-reminders
 * 
 * Sends reminder emails to customers whose appointments start in 1 day.
 * 
 * Authentication: Requires CRON_SECRET header or query parameter
 * 
 * Usage:
 * - Cron job (Vercel Cron, external scheduler, etc.)
 * - Manual trigger (for testing)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";
import { EmailService } from '@shared/lib/email/service';

/**
 * Verify cron secret for authentication
 * 
 * Supports:
 * - CRON_SECRET header (x-cron-secret or Authorization Bearer)
 * - CRON_SECRET query parameter (?secret=...)
 * - Vercel Cron: automatically authenticated when called by Vercel
 * 
 * Environment variable: CRON_SECRET (required in production)
 */
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  
  // In development, allow without secret if not configured
  if (process.env.NODE_ENV === 'development' && !cronSecret) {
    console.warn('⚠️ Development mode: CRON_SECRET not configured. Allowing request.');
    return true;
  }

  // Check if request is from Vercel Cron (User-Agent contains "vercel")
  // Note: This is a basic check. For production, use CRON_SECRET for security.
  const userAgent = request.headers.get('user-agent') || '';
  const isVercelCron = userAgent.toLowerCase().includes('vercel');
  
  // If secret is configured, require it
  if (cronSecret) {
    // Check header first
    const headerSecret = request.headers.get('x-cron-secret') || 
                         request.headers.get('authorization')?.replace('Bearer ', '');
    if (headerSecret === cronSecret) {
      return true;
    }

    // Check query parameter
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
 * GET /api/cron/send-appointment-reminders
 * POST /api/cron/send-appointment-reminders
 * 
 * Send appointment reminder emails for appointments starting in 1 day
 */
export async function GET(request: NextRequest) {
  return handleBookingReminders(request);
}

export async function POST(request: NextRequest) {
  return handleBookingReminders(request);
}

async function handleBookingReminders(request: NextRequest) {
  try {
    // Verify authentication
    if (!verifyCronSecret(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid or missing CRON_SECRET' },
        { status: 401 }
      );
    }

    const supabase = await createServerClient();

    // Calculate tomorrow's date: appointments starting in 1 day (CURRENT_DATE + INTERVAL '1 day')
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format as YYYY-MM-DD (date only, no time)
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    console.log(`[Cron] Sending appointment reminders for appointments starting on ${tomorrowDate}`);

    // Query appointments that start tomorrow (exact date match) and are confirmed/paid
    // WHERE start_date = CURRENT_DATE + INTERVAL '1 day'
    const { data: appointments, error: bookingsError } = await supabase
      .from('appointments')
      .select(`
        id,
        booking_number,
        customer_name,
        customer_email,
        customer_phone,
        start_date,
        end_date,
        package_name,
        package_type,
        hospital_id,
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

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No appointments found for tomorrow',
        data: {
          date: tomorrowDate,
          remindersSent: 0,
          bookingsProcessed: 0,
        },
      });
    }

    // Get unique hospital IDs
    const hospitalIds = [...new Set(appointments.map(b => b.hospital_id).filter(Boolean))];

    // Fetch hospital details
    const { data: hospitals, error: hospitalsError } = await supabase
      .from('hospitals')
      .select('id, hospital_name, hospital_name_english, address, phone')
      .in('id', hospitalIds);

    if (hospitalsError) {
      console.error('Error fetching hospitals:', hospitalsError);
      // Continue without hospital details
    }

    // Create hospital lookup map
    const hospitalMap = new Map();
    if (hospitals) {
      for (const hospital of hospitals) {
        hospitalMap.set(hospital.id, hospital);
      }
    }

    // Send reminder emails
    const results = {
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [] as Array<{ bookingId: string; error: string }>,
    };

    for (const appointment of appointments) {
      try {
        // Skip if no email
        if (!appointment.customer_email) {
          results.skipped++;
          console.warn(`[Cron] Skipping appointment ${appointment.booking_number}: no email`);
          continue;
        }

        // Get hospital details
        const hospital = appointment.hospital_id ? hospitalMap.get(appointment.hospital_id) : null;
        const hospitalName = hospital?.hospital_name || hospital?.hospital_name_english || 'โรงพยาบาล';

        // Format start date for display
        const startDateObj = new Date(appointment.start_date);
        const startDateFormatted = startDateObj.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        // Send reminder email using EmailService (adds to queue)
        const emailResult = await EmailService.sendBookingReminder({
          to: appointment.customer_email,
          userId: appointment.user_id || undefined,
          bookingId: appointment.id,
          customerName: appointment.customer_name || 'ลูกค้า',
          bookingNumber: appointment.booking_number || '',
          hospitalName,
          packageName: appointment.package_name || 'แพ็คเกจ',
          startDate: appointment.start_date,
          startTime: undefined, // Could be extracted from appointment if available
          hospitalAddress: hospital?.address || undefined,
          hospitalPhone: hospital?.phone || undefined,
          bookingUrl: `/dashboard/appointments`,
        }, {
          priority: 'high',
        });

        if (emailResult.success) {
          results.sent++;
          console.log(`[Cron] Sent reminder email for appointment ${appointment.booking_number} to ${appointment.customer_email}`);
        } else {
          results.failed++;
          results.errors.push({
            bookingId: appointment.id,
            error: emailResult.error || 'Unknown email error',
          });
          console.error(`[Cron] Failed to send reminder email for appointment ${appointment.booking_number}:`, emailResult.error);
        }

        // Send in-app notification if user_id exists
        if (appointment.user_id) {
          try {
            await supabase
              .from('notifications')
              .insert({
                user_id: appointment.user_id,
                type: 'booking_reminder',
                title: 'เตือนความจำ: การจองของคุณจะเริ่มในอีก 1 วัน 📅',
                message: `การจอง ${appointment.booking_number} ของคุณจะเริ่มในวันที่ ${startDateFormatted} ที่ ${hospitalName}`,
                link_url: '/dashboard/appointments',
                metadata: {
                  booking_id: appointment.id,
                  booking_number: appointment.booking_number,
                  start_date: appointment.start_date,
                  hospital_id: appointment.hospital_id,
                },
              });
            console.log(`[Cron] Sent in-app notification for appointment ${appointment.booking_number} to user ${appointment.user_id}`);
          } catch (notificationError) {
            console.warn(`[Cron] Failed to send in-app notification for appointment ${appointment.booking_number}:`, notificationError);
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        results.failed++;
        results.errors.push({
          bookingId: appointment.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(`[Cron] Error processing appointment ${appointment.booking_number}:`, error);
      }
    }

    // Log summary
    console.log(`[Cron] appointment reminders completed:`, {
      date: tomorrowDate,
      total: appointments.length,
      sent: results.sent,
      failed: results.failed,
      skipped: results.skipped,
    });

    return NextResponse.json({
      success: true,
      message: `Processed ${appointments.length} appointments for ${tomorrowDate}`,
      data: {
        date: tomorrowDate,
        bookingsProcessed: appointments.length,
        remindersSent: results.sent,
        remindersFailed: results.failed,
        remindersSkipped: results.skipped,
        errors: results.errors.length > 0 ? results.errors : undefined,
      },
    });

  } catch (error) {
    console.error('[Cron] Error sending appointment reminders:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send appointment reminders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

