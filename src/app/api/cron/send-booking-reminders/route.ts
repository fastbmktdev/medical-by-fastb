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
 */
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  
  // In development, allow without secret if not configured
  if (process.env.NODE_ENV === 'development' && !cronSecret) {
    console.warn('⚠️ Development mode: CRON_SECRET not configured. Allowing request.');
    return true;
  }

  // If secret is configured, require it
  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return false;
  }

  // Check header first
  const headerSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace('Bearer ', '');
  if (headerSecret === cronSecret) {
    return true;
  }

  // Check query parameter
  const querySecret = request.nextUrl.searchParams.get('secret');
  if (querySecret === cronSecret) {
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

    // Calculate date range: bookings starting tomorrow (1 day from now)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Set to start of day (00:00:00)
    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setHours(0, 0, 0, 0);
    
    // Set to end of day (23:59:59)
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const tomorrowStartISO = tomorrowStart.toISOString().split('T')[0]; // YYYY-MM-DD format
    const tomorrowEndISO = tomorrowEnd.toISOString().split('T')[0];

    console.log(`[Cron] Sending booking reminders for bookings starting on ${tomorrowStartISO}`);

    // Query bookings that start tomorrow and are confirmed/paid
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
        payment_status
      `)
      .eq('status', 'confirmed')
      .eq('payment_status', 'paid')
      .gte('start_date', tomorrowStartISO)
      .lte('start_date', tomorrowEndISO);

    if (bookingsError) {
      throw bookingsError;
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bookings found for tomorrow',
        data: {
          date: tomorrowStartISO,
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
      date: tomorrowStartISO,
      total: bookings.length,
      sent: results.sent,
      failed: results.failed,
      skipped: results.skipped,
    });

    return NextResponse.json({
      success: true,
      message: `Processed ${bookings.length} bookings for ${tomorrowStartISO}`,
      data: {
        date: tomorrowStartISO,
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

