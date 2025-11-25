/**
 * Admin appointments Report API
 * GET /api/admin/reports/appointments
 * 
 * Returns detailed appointment reports with filtering options
 * Query params:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - status: appointment status filter (optional)
 * - paymentStatus: payment status filter (optional)
 * - hospitalId: filter by hospital (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';
import type { appointment } from '@shared/types/database.types';

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
    const hospitalIdFilter = searchParams.get('hospitalId');
    
    // Build query
    let query = supabase
      .from('appointments')
      .select(`
        id,
        booking_number,
        user_id,
        hospital_id,
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
        hospitals:hospital_id (
          id,
          hospital_name,
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
    
    // Apply hospital filter
    if (hospitalIdFilter) {
      query = query.eq('hospital_id', hospitalIdFilter);
    }
    
    // Order by created_at desc
    query = query.order('created_at', { ascending: false });
    
    const { data: appointments, error } = await query;
    
    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch appointments data' },
        { status: 500 }
      );
    }
    
    // Calculate summary statistics
    const bookingRecords = (appointments ?? []) as appointment[];
    const totalBookings = bookingRecords.length;
    const totalRevenue = bookingRecords.reduce((sum, appointment) => {
      if (appointment.payment_status === 'paid') {
        return sum + Number(appointment.price_paid ?? 0);
      }
      return sum;
    }, 0);
    
    // Group by status
    const byStatus = bookingRecords.reduce<Record<string, number>>((acc, appointment) => {
      const status = appointment.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // Group by payment status
    const byPaymentStatus = bookingRecords.reduce<Record<string, number>>((acc, appointment) => {
      const paymentStatus = appointment.payment_status || 'unknown';
      acc[paymentStatus] = (acc[paymentStatus] || 0) + 1;
      return acc;
    }, {});
    
    // Group by package type
    const byPackageType = bookingRecords.reduce<Record<string, number>>((acc, appointment) => {
      const packageType = appointment.package_type || 'unknown';
      acc[packageType] = (acc[packageType] || 0) + 1;
      return acc;
    }, {});
    
    // Group by date for chart data
    const byDate: Record<string, { count: number; revenue: number }> = {};
    if (bookingRecords.length > 0) {
      for (const appointment of bookingRecords) {
        const date = new Date(appointment.created_at).toISOString().split('T')[0];
        if (!byDate[date]) {
          byDate[date] = { count: 0, revenue: 0 };
        }
        byDate[date].count += 1;
        if (appointment.payment_status === 'paid') {
          byDate[date].revenue += Number(appointment.price_paid ?? 0);
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
        appointments: bookingRecords,
        charts: {
          byDate,
        },
        filters: {
          startDate: startDateParam,
          endDate: endDateParam,
          status: statusFilter,
          paymentStatus: paymentStatusFilter,
          hospitalId: hospitalIdFilter,
        },
      },
    });
    
  } catch (error) {
    console.error('Get appointments report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate appointments report' },
      { status: 500 }
    );
  }
});

export { getBookingsReportHandler as GET };

