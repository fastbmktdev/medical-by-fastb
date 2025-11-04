import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { withAdminAuth } from '@/lib/api/withAdminAuth';

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
    const supabase = await createClient();
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
    
    // Query ข้อมูลยิมใหม่เดือนนี้
    const { count: newGymsCount } = await supabase
      .from('gyms')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDateISO)
      .lte('created_at', endDateISO);
    
    // Query ข้อมูลการจองเดือนนี้
    const { count: newBookingsCount } = await supabase
      .from('bookings')
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
    
    const monthlyRevenue = paymentsData?.reduce((sum, payment: any) => {
      return sum + (parseFloat(payment.amount?.toString() || '0') || 0);
    }, 0) || 0;
    
    // Query ข้อมูลผู้ใช้ทั้งหมด
    const { count: totalUsersCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true });
    
    // Query ข้อมูลยิมทั้งหมด
    const { count: totalGymsCount } = await supabase
      .from('gyms')
      .select('*', { count: 'exact', head: true });
    
    // Query ข้อมูลการจองทั้งหมด
    const { count: totalBookingsCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });
    
    // Query รายได้ทั้งหมด
    const { data: allPaymentsData } = await supabase
      .from('payments')
      .select('amount, status, created_at')
      .eq('status', 'succeeded');
    
    const totalRevenue = allPaymentsData?.reduce((sum, payment: any) => {
      return sum + (parseFloat(payment.amount?.toString() || '0') || 0);
    }, 0) || 0;
    
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
    
    // Get recent gym applications
    const { data: recentGyms } = await supabase
      .from('gyms')
      .select('id, gym_name, created_at, status')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentGyms) {
      for (const gym of recentGyms) {
        recentActivities.push({
          type: 'gym_application',
          description: `ยิม ${gym.gym_name || 'ไม่ระบุชื่อ'} ${gym.status === 'approved' ? 'ได้รับการอนุมัติ' : gym.status === 'pending' ? 'รอการอนุมัติ' : 'ถูกปฏิเสธ'}`,
          created_at: gym.created_at,
          id: gym.id,
        });
      }
    }
    
    // Get recent bookings
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('id, created_at, status')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentBookings) {
      for (const booking of recentBookings) {
        recentActivities.push({
          type: 'booking',
          description: `การจองใหม่ - สถานะ: ${booking.status}`,
          created_at: booking.created_at,
          id: booking.id,
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
    if (paymentsData) {
      for (const payment of paymentsData as any[]) {
        const paymentDate = payment.created_at || new Date().toISOString();
        const date = new Date(paymentDate).toISOString().split('T')[0];
        const amount = parseFloat(payment.amount?.toString() || '0') || 0;
        revenueByDate[date] = (revenueByDate[date] || 0) + amount;
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        period: {
          startDate: startDateISO,
          endDate: endDateISO,
        },
        monthly: {
          newUsers: newUsersCount || 0,
          newGyms: newGymsCount || 0,
          newBookings: newBookingsCount || 0,
          revenue: monthlyRevenue,
        },
        totals: {
          users: totalUsersCount || 0,
          gyms: totalGymsCount || 0,
          bookings: totalBookingsCount || 0,
          revenue: totalRevenue,
        },
        recentActivities: latestActivities,
        charts: {
          userGrowth: userGrowthByDate,
          revenue: revenueByDate,
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
