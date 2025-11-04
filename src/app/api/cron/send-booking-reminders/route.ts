/**
 * Cron Job: Send Booking Reminder Emails
 * 
 * GET/POST /api/cron/send-booking-reminders
 * 
 * Sends reminder emails to customers whose bookings start in 1 day.
 * 
 * Authentication: Requires CRON_SECRET header or query parameter
 * 
 * Usage:
 * - Cron job (Vercel Cron, external scheduler, etc.)
 * - Manual trigger (for testing)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { sendBookingReminderEmail } from '@/lib/email';

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
 * GET /api/cron/send-booking-reminders
 * POST /api/cron/send-booking-reminders
 * 
 * Send booking reminder emails for bookings starting in 1 day
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

    const supabase = await createClient();

    // Calculate tomorrow's date: bookings starting in 1 day (CURRENT_DATE + INTERVAL '1 day')
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format as YYYY-MM-DD (date only, no time)
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    console.log(`[Cron] Sending booking reminders for bookings starting on ${tomorrowDate}`);

    // Query bookings that start tomorrow (exact date match) and are confirmed/paid
    // WHERE start_date = CURRENT_DATE + INTERVAL '1 day'
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
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
      return NextResponse.json({
        success: true,
        message: 'No bookings found for tomorrow',
        data: {
          date: tomorrowDate,
          remindersSent: 0,
          bookingsProcessed: 0,
        },
      });
    }

    // Get unique gym IDs
    const gymIds = [...new Set(bookings.map(b => b.gym_id).filter(Boolean))];

    // Fetch gym details
    const { data: gyms, error: gymsError } = await supabase
      .from('gyms')
      .select('id, gym_name, gym_name_english, address, phone')
      .in('id', gymIds);

    if (gymsError) {
      console.error('Error fetching gyms:', gymsError);
      // Continue without gym details
    }

    // Create gym lookup map
    const gymMap = new Map();
    if (gyms) {
      for (const gym of gyms) {
        gymMap.set(gym.id, gym);
      }
    }

    // Send reminder emails
    const results = {
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [] as Array<{ bookingId: string; error: string }>,
    };

    for (const booking of bookings) {
      try {
        // Skip if no email
        if (!booking.customer_email) {
          results.skipped++;
          console.warn(`[Cron] Skipping booking ${booking.booking_number}: no email`);
          continue;
        }

        // Get gym details
        const gym = booking.gym_id ? gymMap.get(booking.gym_id) : null;
        const gymName = gym?.gym_name || gym?.gym_name_english || 'ค่ายมวย';

        // Format start date for display
        const startDateObj = new Date(booking.start_date);
        const startDateFormatted = startDateObj.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        // Send reminder email
        const emailResult = await sendBookingReminderEmail({
          to: booking.customer_email,
          customerName: booking.customer_name || 'ลูกค้า',
          bookingNumber: booking.booking_number || '',
          gymName,
          packageName: booking.package_name || 'แพ็คเกจ',
          startDate: booking.start_date,
          startTime: undefined, // Could be extracted from booking if available
          gymAddress: gym?.address || undefined,
          gymPhone: gym?.phone || undefined,
          bookingUrl: `/dashboard/bookings`,
        });

        if (emailResult.success) {
          results.sent++;
          console.log(`[Cron] Sent reminder email for booking ${booking.booking_number} to ${booking.customer_email}`);
        } else {
          results.failed++;
          results.errors.push({
            bookingId: booking.id,
            error: emailResult.error || 'Unknown email error',
          });
          console.error(`[Cron] Failed to send reminder email for booking ${booking.booking_number}:`, emailResult.error);
        }

        // Send in-app notification if user_id exists
        if (booking.user_id) {
          try {
            await supabase
              .from('notifications')
              .insert({
                user_id: booking.user_id,
                type: 'booking_reminder',
                title: 'เตือนความจำ: การจองของคุณจะเริ่มในอีก 1 วัน 📅',
                message: `การจอง ${booking.booking_number} ของคุณจะเริ่มในวันที่ ${startDateFormatted} ที่ ${gymName}`,
                link_url: '/dashboard/bookings',
                metadata: {
                  booking_id: booking.id,
                  booking_number: booking.booking_number,
                  start_date: booking.start_date,
                  gym_id: booking.gym_id,
                },
              });
            console.log(`[Cron] Sent in-app notification for booking ${booking.booking_number} to user ${booking.user_id}`);
          } catch (notificationError) {
            console.warn(`[Cron] Failed to send in-app notification for booking ${booking.booking_number}:`, notificationError);
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        results.failed++;
        results.errors.push({
          bookingId: booking.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(`[Cron] Error processing booking ${booking.booking_number}:`, error);
      }
    }

    // Log summary
    console.log(`[Cron] Booking reminders completed:`, {
      date: tomorrowDate,
      total: bookings.length,
      sent: results.sent,
      failed: results.failed,
      skipped: results.skipped,
    });

    return NextResponse.json({
      success: true,
      message: `Processed ${bookings.length} bookings for ${tomorrowDate}`,
      data: {
        date: tomorrowDate,
        bookingsProcessed: bookings.length,
        remindersSent: results.sent,
        remindersFailed: results.failed,
        remindersSkipped: results.skipped,
        errors: results.errors.length > 0 ? results.errors : undefined,
      },
    });

  } catch (error) {
    console.error('[Cron] Error sending booking reminders:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send booking reminders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

