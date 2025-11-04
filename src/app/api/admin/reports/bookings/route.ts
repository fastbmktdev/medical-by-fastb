/**
 * Admin Bookings Report API
 * GET /api/admin/reports/bookings
 * 
 * Returns detailed booking reports with filtering options
 * Query params:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - status: booking status filter (optional)
 * - paymentStatus: payment status filter (optional)
 * - gymId: filter by gym (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { withAdminAuth } from '@/lib/api/withAdminAuth';

const getBookingsReportHandler = withAdminAuth(async (
  request: NextRequest,
  _context,
  _user
) => {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Get filters from query params
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const statusFilter = searchParams.get('status');
    const paymentStatusFilter = searchParams.get('paymentStatus');
    const gymIdFilter = searchParams.get('gymId');
    
    // Build query
    let query = supabase
      .from('bookings')
      .select(`
        id,
        booking_number,
        user_id,
        gym_id,
        package_id,
        customer_name,
        customer_email,
        customer_phone,
        start_date,
        end_date,
        price_paid,
        package_name,
        package_type,
        duration_months,
        payment_status,
        payment_method,
        status,
        special_requests,
        created_at,
        updated_at,
        gyms:gym_id (
          id,
          gym_name,
          location
        )
      `);
    
    // Apply date filters
    if (startDateParam) {
      const startDate = new Date(startDateParam);
      if (!isNaN(startDate.getTime())) {
        query = query.gte('created_at', startDate.toISOString());
      }
    }
    
    if (endDateParam) {
      const endDate = new Date(endDateParam);
      if (!isNaN(endDate.getTime())) {
        // Add one day to include the entire end date
        const endDatePlusOne = new Date(endDate);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
        query = query.lt('created_at', endDatePlusOne.toISOString());
      }
    }
    
    // Apply status filter
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }
    
    // Apply payment status filter
    if (paymentStatusFilter) {
      query = query.eq('payment_status', paymentStatusFilter);
    }
    
    // Apply gym filter
    if (gymIdFilter) {
      query = query.eq('gym_id', gymIdFilter);
    }
    
    // Order by created_at desc
    query = query.order('created_at', { ascending: false });
    
    const { data: bookings, error } = await query;
    
    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch bookings data' },
        { status: 500 }
      );
    }
    
    // Calculate summary statistics
    const totalBookings = bookings?.length || 0;
    const totalRevenue = bookings?.reduce((sum, booking: any) => {
      if (booking.payment_status === 'paid') {
        return sum + (parseFloat(booking.price_paid?.toString() || '0') || 0);
      }
      return sum;
    }, 0) || 0;
    
    // Group by status
    const byStatus = bookings?.reduce((acc: Record<string, number>, booking: any) => {
      const status = booking.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}) || {};
    
    // Group by payment status
    const byPaymentStatus = bookings?.reduce((acc: Record<string, number>, booking: any) => {
      const paymentStatus = booking.payment_status || 'unknown';
      acc[paymentStatus] = (acc[paymentStatus] || 0) + 1;
      return acc;
    }, {}) || {};
    
    // Group by package type
    const byPackageType = bookings?.reduce((acc: Record<string, number>, booking: any) => {
      const packageType = booking.package_type || 'unknown';
      acc[packageType] = (acc[packageType] || 0) + 1;
      return acc;
    }, {}) || {};
    
    // Group by date for chart data
    const byDate: Record<string, { count: number; revenue: number }> = {};
    if (bookings) {
      for (const booking of bookings) {
        const date = new Date(booking.created_at).toISOString().split('T')[0];
        if (!byDate[date]) {
          byDate[date] = { count: 0, revenue: 0 };
        }
        byDate[date].count += 1;
        if (booking.payment_status === 'paid') {
          byDate[date].revenue += parseFloat(booking.price_paid?.toString() || '0') || 0;
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalBookings,
          totalRevenue,
          byStatus,
          byPaymentStatus,
          byPackageType,
        },
        bookings: bookings || [],
        charts: {
          byDate,
        },
        filters: {
          startDate: startDateParam,
          endDate: endDateParam,
          status: statusFilter,
          paymentStatus: paymentStatusFilter,
          gymId: gymIdFilter,
        },
      },
    });
    
  } catch (error) {
    console.error('Get bookings report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate bookings report' },
      { status: 500 }
    );
  }
});

export { getBookingsReportHandler as GET };

