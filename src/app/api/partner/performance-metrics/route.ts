/**
 * Partner Performance Metrics API
 * GET /api/partner/performance-metrics
 * 
 * Returns detailed performance metrics for partner dashboard
 * Query params:
 * - startDate: ISO date string (optional, default: 30 days ago)
 * - endDate: ISO date string (optional, default: now)
 * - period: 'day' | 'week' | 'month' (optional, default: 'day')
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is partner or admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!roleData || !['partner', 'admin'].includes(roleData.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get partner's gym
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, gym_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (gymError || !gym) {
      return NextResponse.json(
        { success: false, error: 'Gym not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'day';
    const endDateParam = searchParams.get('endDate');
    const startDateParam = searchParams.get('startDate');

    const now = new Date();
    const endDate = endDateParam ? new Date(endDateParam) : now;
    const startDate = startDateParam 
      ? new Date(startDateParam) 
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    const startDateISO = startDate.toISOString();
    const endDateISO = endDate.toISOString();

    // 1. Booking Metrics
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, status, payment_status, created_at, start_date, price_paid, customer_name')
      .eq('gym_id', gym.id)
      .gte('created_at', startDateISO)
      .lte('created_at', endDateISO);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
    }

    const totalBookings = bookings?.length || 0;
    const confirmedBookings = bookings?.filter(b => b.status === 'confirmed').length || 0;
    const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0;
    const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
    const conversionRate = totalBookings > 0 
      ? ((confirmedBookings + completedBookings) / totalBookings) * 100 
      : 0;

    // 2. Revenue Metrics
    const paidBookings = bookings?.filter(b => b.payment_status === 'paid') || [];
    const totalRevenue = paidBookings.reduce((sum, b) => sum + (Number(b.price_paid) || 0), 0);
    const averageBookingValue = paidBookings.length > 0 
      ? totalRevenue / paidBookings.length 
      : 0;

    // 3. Customer Metrics
    const uniqueCustomers = new Set(
      bookings?.map(b => b.customer_name).filter(Boolean) || []
    ).size;
    const repeatCustomers = bookings?.reduce((acc, b) => {
      const name = b.customer_name;
      if (name) {
        acc[name] = (acc[name] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>) || {};
    const repeatCustomerCount = Object.values(repeatCustomers).filter(count => count > 1).length;
    const customerRetentionRate = uniqueCustomers > 0 
      ? (repeatCustomerCount / uniqueCustomers) * 100 
      : 0;

    // 4. Time-based Metrics (grouped by period)
    const bookingsByPeriod: Record<string, {
      bookings: number;
      revenue: number;
      customers: number;
    }> = {};

    bookings?.forEach(booking => {
      const date = new Date(booking.created_at);
      let key = '';
      
      if (period === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `Week ${weekStart.toISOString().split('T')[0]}`;
      } else if (period === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (key) {
        if (!bookingsByPeriod[key]) {
          bookingsByPeriod[key] = { bookings: 0, revenue: 0, customers: 0 };
        }
        bookingsByPeriod[key].bookings++;
        if (booking.payment_status === 'paid') {
          bookingsByPeriod[key].revenue += Number(booking.price_paid) || 0;
        }
        if (booking.customer_name) {
          bookingsByPeriod[key].customers++;
        }
      }
    });

    // 5. Package Performance
    const { data: packageStats, error: packageError } = await supabase
      .from('bookings')
      .select('package_name, package_type, price_paid, payment_status')
      .eq('gym_id', gym.id)
      .gte('created_at', startDateISO)
      .lte('created_at', endDateISO)
      .eq('payment_status', 'paid');

    const packagePerformance: Record<string, {
      bookings: number;
      revenue: number;
      averagePrice: number;
    }> = {};

    packageStats?.forEach(booking => {
      const packageName = booking.package_name || 'Unknown';
      if (!packagePerformance[packageName]) {
        packagePerformance[packageName] = { bookings: 0, revenue: 0, averagePrice: 0 };
      }
      packagePerformance[packageName].bookings++;
      packagePerformance[packageName].revenue += Number(booking.price_paid) || 0;
    });

    Object.keys(packagePerformance).forEach(key => {
      const stats = packagePerformance[key];
      stats.averagePrice = stats.revenue / stats.bookings;
    });

    // 6. Peak Hours Analysis
    const bookingsByHour: Record<number, number> = {};
    bookings?.forEach(booking => {
      const date = new Date(booking.created_at);
      const hour = date.getHours();
      bookingsByHour[hour] = (bookingsByHour[hour] || 0) + 1;
    });

    // 7. Response Time Metrics (time from booking creation to confirmation)
    const confirmedBookingsWithTimes = bookings?.filter(b => 
      b.status === 'confirmed' && b.created_at
    ) || [];
    
    const responseTimes: number[] = [];
    for (const booking of confirmedBookingsWithTimes) {
      // Assuming confirmation happens when status changes to confirmed
      // For now, we'll use a placeholder - in real system, track status change timestamps
      const bookingTime = new Date(booking.created_at).getTime();
      const nowTime = now.getTime();
      const hoursDiff = (nowTime - bookingTime) / (1000 * 60 * 60);
      responseTimes.push(hoursDiff);
    }

    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    // 8. Cancellation Analysis
    const cancellationRate = totalBookings > 0 
      ? (cancelledBookings / totalBookings) * 100 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        period: {
          startDate: startDateISO,
          endDate: endDateISO,
          periodType: period,
        },
        overview: {
          totalBookings,
          confirmedBookings,
          cancelledBookings,
          completedBookings,
          conversionRate: Number(conversionRate.toFixed(2)),
          totalRevenue: Number(totalRevenue.toFixed(2)),
          averageBookingValue: Number(averageBookingValue.toFixed(2)),
          uniqueCustomers,
          repeatCustomers: repeatCustomerCount,
          customerRetentionRate: Number(customerRetentionRate.toFixed(2)),
        },
        performance: {
          averageResponseTime: Number(averageResponseTime.toFixed(2)),
          cancellationRate: Number(cancellationRate.toFixed(2)),
        },
        trends: bookingsByPeriod,
        packagePerformance: Object.entries(packagePerformance)
          .map(([name, stats]) => ({
            name,
            bookings: stats.bookings,
            revenue: Number(stats.revenue.toFixed(2)),
            averagePrice: Number(stats.averagePrice.toFixed(2)),
          }))
          .sort((a, b) => b.revenue - a.revenue),
        peakHours: Object.entries(bookingsByHour)
          .map(([hour, count]) => ({ hour: Number(hour), bookings: count }))
          .sort((a, b) => b.bookings - a.bookings)
          .slice(0, 5),
      },
    });
    
  } catch (error) {
    console.error('Get performance metrics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

