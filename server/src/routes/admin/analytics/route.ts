import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';

interface PaymentRecord {
  amount: number | string | null;
  status: string;
  created_at: string | null;
}

const parsePaymentAmount = (value: PaymentRecord['amount']): number => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

/**
 * GET /api/admin/analytics
 * ข้อมูล analytics สำหรับ admin dashboard
 * Query params:
 * - startDate: ISO date string (optional, default: start of current month)
 * - endDate: ISO date string (optional, default: now)
 */
const getAnalyticsHandler = withAdminAuth(async (
  request: NextRequest,
  _context,
  _user
) => {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    
    // Get date range from query params or default to current month
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const startDate = startDateParam 
      ? new Date(startDateParam) 
      : startOfMonth;
    const endDate = endDateParam 
      ? new Date(endDateParam) 
      : now;
    
    // Ensure dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    // Ensure endDate is after startDate
    if (endDate < startDate) {
      return NextResponse.json(
        { success: false, error: 'endDate must be after startDate' },
        { status: 400 }
      );
    }
    
    const startDateISO = startDate.toISOString();
    const endDateISO = endDate.toISOString();
    
    // Query ข้อมูลผู้ใช้ใหม่เดือนนี้
    const { count: newUsersCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDateISO)
      .lte('created_at', endDateISO);
    
    // Query ข้อมูลโรงพยาบาลใหม่เดือนนี้
    const { count: newHospitalsCount } = await supabase
      .from('hospitals')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDateISO)
      .lte('created_at', endDateISO);
    
    // Query ข้อมูลการจองเดือนนี้
    const { count: newBookingsCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDateISO)
      .lte('created_at', endDateISO);
    
    // Query ข้อมูลรายได้เดือนนี้ (from payments/orders)
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('amount, status, created_at')
      .eq('status', 'succeeded')
      .gte('created_at', startDateISO)
      .lte('created_at', endDateISO);
    
    const monthlyPayments = (paymentsData ?? []) as PaymentRecord[];
    const monthlyRevenue = monthlyPayments.reduce((sum, payment) => {
      return sum + parsePaymentAmount(payment.amount);
    }, 0);
    
    // Query ข้อมูลผู้ใช้ทั้งหมด
    const { count: totalUsersCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true });
    
    // Query ข้อมูลโรงพยาบาลทั้งหมด
    const { count: totalHospitalsCount } = await supabase
      .from('hospitals')
      .select('*', { count: 'exact', head: true });
    
    // Query ข้อมูลการจองทั้งหมด
    const { count: totalBookingsCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });
    
    // Query รายได้ทั้งหมด
    const { data: allPaymentsData } = await supabase
      .from('payments')
      .select('amount, status, created_at')
      .eq('status', 'succeeded');
    
    const totalPayments = (allPaymentsData ?? []) as PaymentRecord[];
    const totalRevenue = totalPayments.reduce((sum, payment) => {
      return sum + parsePaymentAmount(payment.amount);
    }, 0);
    
    // Query กิจกรรมล่าสุด (recent activities from various tables)
    const recentActivities: Array<{
      type: string;
      description: string;
      created_at: string;
      id: string;
    }> = [];
    
    // Get recent user registrations
    const { data: recentUsers } = await supabase
      .from('user_roles')
      .select('user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentUsers) {
      for (const user of recentUsers) {
        recentActivities.push({
          type: 'user_registration',
          description: 'ผู้ใช้ใหม่ลงทะเบียน',
          created_at: user.created_at,
          id: user.user_id,
        });
      }
    }
    
    // Get recent hospital applications
    const { data: recentHospitals } = await supabase
      .from('hospitals')
      .select('id, hospital_name, created_at, status')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentHospitals) {
      for (const hospital of recentHospitals) {
        recentActivities.push({
          type: 'hospital_application',
          description: `โรงพยาบาล ${hospital.hospital_name || 'ไม่ระบุชื่อ'} ${hospital.status === 'approved' ? 'ได้รับการอนุมัติ' : hospital.status === 'pending' ? 'รอการอนุมัติ' : 'ถูกปฏิเสธ'}`,
          created_at: hospital.created_at,
          id: hospital.id,
        });
      }
    }
    
    // Get recent appointments
    const { data: recentBookings } = await supabase
      .from('appointments')
      .select('id, created_at, status')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentBookings) {
      for (const appointment of recentBookings) {
        recentActivities.push({
          type: 'appointment',
          description: `การจองใหม่ - สถานะ: ${appointment.status}`,
          created_at: appointment.created_at,
          id: appointment.id,
        });
      }
    }
    
    // Sort activities by created_at descending
    recentActivities.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    // Limit to 10 most recent
    const latestActivities = recentActivities.slice(0, 10);
    
    // Get data for charts (user growth over time)
    // Get user registrations grouped by date for the date range
    const { data: userGrowthData } = await supabase
      .from('user_roles')
      .select('created_at')
      .gte('created_at', startDateISO)
      .lte('created_at', endDateISO)
      .order('created_at', { ascending: true });
    
    // Group by date
    const userGrowthByDate: Record<string, number> = {};
    if (userGrowthData) {
      for (const user of userGrowthData) {
        const date = new Date(user.created_at).toISOString().split('T')[0];
        userGrowthByDate[date] = (userGrowthByDate[date] || 0) + 1;
      }
    }
    
    // Get revenue by date for charts
    const revenueByDate: Record<string, number> = {};
    if (monthlyPayments.length > 0) {
      for (const payment of monthlyPayments) {
        const paymentDate = payment.created_at ?? new Date().toISOString();
        const date = new Date(paymentDate).toISOString().split('T')[0];
        const amount = parsePaymentAmount(payment.amount);
        revenueByDate[date] = (revenueByDate[date] || 0) + amount;
      }
    }
    
    // Get popular search terms (aggregated from search_history)
    // Query all search history in date range
    const { data: searchHistoryData, error: searchHistoryError } = await supabase
      .from('search_history')
      .select('query, search_type, created_at, total_results')
      .gte('created_at', startDateISO)
      .lte('created_at', endDateISO)
      .order('created_at', { ascending: false });
    
    // Aggregate search queries
    const searchTermsMap: Record<string, {
      query: string;
      count: number;
      search_type: string | null;
      avg_results: number;
      last_searched: string;
    }> = {};
    
    if (searchHistoryData && !searchHistoryError) {
      for (const search of searchHistoryData) {
        const queryKey = search.query.trim().toLowerCase();
        
        if (!searchTermsMap[queryKey]) {
          searchTermsMap[queryKey] = {
            query: search.query.trim(),
            count: 0,
            search_type: search.search_type || null,
            avg_results: 0,
            last_searched: search.created_at,
          };
        }
        
        searchTermsMap[queryKey].count += 1;
        searchTermsMap[queryKey].avg_results = 
          ((searchTermsMap[queryKey].avg_results * (searchTermsMap[queryKey].count - 1)) + 
           (search.total_results || 0)) / searchTermsMap[queryKey].count;
        
        // Update last_searched if this is more recent
        if (new Date(search.created_at) > new Date(searchTermsMap[queryKey].last_searched)) {
          searchTermsMap[queryKey].last_searched = search.created_at;
        }
      }
    }
    
    // Convert to array and sort by count (most popular first)
    const popularSearchTerms = Object.values(searchTermsMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20
    
    // Get total search count for the period
    const totalSearches = searchHistoryData?.length || 0;
    
    // Get unique search queries count
    const uniqueSearchQueries = Object.keys(searchTermsMap).length;
    
    return NextResponse.json({
      success: true,
      data: {
        period: {
          startDate: startDateISO,
          endDate: endDateISO,
        },
        monthly: {
          newUsers: newUsersCount || 0,
          newHospitals: newHospitalsCount || 0,
          newBookings: newBookingsCount || 0,
          revenue: monthlyRevenue,
        },
        totals: {
          users: totalUsersCount || 0,
          hospitals: totalHospitalsCount || 0,
          appointments: totalBookingsCount || 0,
          revenue: totalRevenue,
        },
        recentActivities: latestActivities,
        charts: {
          userGrowth: userGrowthByDate,
          revenue: revenueByDate,
        },
        search: {
          totalSearches,
          uniqueQueries: uniqueSearchQueries,
          popularTerms: popularSearchTerms,
        },
      },
    });
    
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
});

export { getAnalyticsHandler as GET };
