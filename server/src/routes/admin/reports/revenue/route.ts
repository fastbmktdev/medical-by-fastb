/**
 * Admin Revenue Report API
 * GET /api/admin/reports/revenue
 * 
 * Returns detailed revenue reports with filtering options
 * Query params:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - status: payment status filter (optional, default: 'succeeded')
 * - paymentType: payment type filter (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';

interface PaymentRecord {
  amount: number | string | null;
  status?: string | null;
  payment_type?: string | null;
  created_at: string;
}

const normalizePaymentAmount = (value: PaymentRecord['amount']): number => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const getRevenueReportHandler = withAdminAuth(async (
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
    const statusFilter = searchParams.get('status') || 'succeeded'; // Default to succeeded
    const paymentTypeFilter = searchParams.get('paymentType');
    
    // Build query
    let query = supabase
      .from('payments')
      .select(`
        id,
        user_id,
        amount,
        currency,
        status,
        payment_type,
        stripe_payment_intent_id,
        metadata,
        created_at,
        updated_at
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
    
    // Apply payment type filter
    if (paymentTypeFilter) {
      query = query.eq('payment_type', paymentTypeFilter);
    }
    
    // Order by created_at desc
    query = query.order('created_at', { ascending: false });
    
    const { data: payments, error } = await query;
    
    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch revenue data' },
        { status: 500 }
      );
    }
    
    // Calculate summary statistics
    const paymentRecords = (payments ?? []) as PaymentRecord[];
    const totalPayments = paymentRecords.length;
    const totalRevenue = paymentRecords.reduce((sum, payment) => {
      return sum + normalizePaymentAmount(payment.amount);
    }, 0);
    
    // Group by status
    const byStatus = paymentRecords.reduce<Record<string, { count: number; revenue: number }>>((acc, payment) => {
      const status = payment.status || 'unknown';
      if (!acc[status]) {
        acc[status] = { count: 0, revenue: 0 };
      }
      acc[status].count += 1;
      acc[status].revenue += normalizePaymentAmount(payment.amount);
      return acc;
    }, {});
    
    // Group by payment type
    const byPaymentType = paymentRecords.reduce<Record<string, { count: number; revenue: number }>>((acc, payment) => {
      const paymentType = payment.payment_type || 'unknown';
      if (!acc[paymentType]) {
        acc[paymentType] = { count: 0, revenue: 0 };
      }
      acc[paymentType].count += 1;
      acc[paymentType].revenue += normalizePaymentAmount(payment.amount);
      return acc;
    }, {});
    
    // Group by date for chart data
    const byDate: Record<string, { count: number; revenue: number }> = {};
    if (paymentRecords.length > 0) {
      for (const payment of paymentRecords) {
        const date = new Date(payment.created_at).toISOString().split('T')[0];
        if (!byDate[date]) {
          byDate[date] = { count: 0, revenue: 0 };
        }
        byDate[date].count += 1;
        byDate[date].revenue += normalizePaymentAmount(payment.amount);
      }
    }
    
    // Group by month for monthly trends
    const byMonth: Record<string, { count: number; revenue: number }> = {};
    if (paymentRecords.length > 0) {
      for (const payment of paymentRecords) {
        const date = new Date(payment.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!byMonth[monthKey]) {
          byMonth[monthKey] = { count: 0, revenue: 0 };
        }
        byMonth[monthKey].count += 1;
        byMonth[monthKey].revenue += normalizePaymentAmount(payment.amount);
      }
    }
    
    // Calculate average transaction value
    const averageTransactionValue = totalPayments > 0 ? totalRevenue / totalPayments : 0;
    
    // Get top revenue days
    const topDays = Object.entries(byDate)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(([date, data]) => ({ date, ...data }));
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalPayments,
          totalRevenue,
          averageTransactionValue,
          byStatus,
          byPaymentType,
        },
        payments: paymentRecords,
        charts: {
          byDate,
          byMonth,
        },
        topDays,
        filters: {
          startDate: startDateParam,
          endDate: endDateParam,
          status: statusFilter,
          paymentType: paymentTypeFilter,
        },
      },
    });
    
  } catch (error) {
    console.error('Get revenue report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate revenue report' },
      { status: 500 }
    );
  }
});

export { getRevenueReportHandler as GET };

