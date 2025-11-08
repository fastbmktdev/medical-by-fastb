/**
 * Admin Users Report API
 * GET /api/admin/reports/users
 * 
 * Returns detailed user reports with filtering options
 * Query params:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - role: user role filter (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { withAdminAuth } from '@/lib/api/withAdminAuth';

interface UserProfileSummary {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  created_at: string;
}

interface UserRoleWithProfile {
  user_id: string;
  role: string | null;
  created_at: string;
  updated_at: string;
  profiles?: UserProfileSummary | null;
}

interface UserStats {
  bookingCount: number;
  totalSpending: number;
  totalPoints: number;
  currentLevel: number;
}

interface UserWithStats extends UserRoleWithProfile {
  stats: UserStats;
}

interface PaymentSummary {
  amount: number | string | null;
}

const parseAmount = (value: PaymentSummary['amount']): number => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const getUsersReportHandler = withAdminAuth(async (
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
    const roleFilter = searchParams.get('role');
    
    // Build query for user_roles with profile data
    let query = supabase
      .from('user_roles')
      .select(`
        user_id,
        role,
        created_at,
        updated_at,
        profiles:user_id (
          user_id,
          username,
          full_name,
          avatar_url,
          phone,
          bio,
          created_at
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
    
    // Apply role filter
    if (roleFilter) {
      query = query.eq('role', roleFilter);
    }
    
    // Order by created_at desc
    query = query.order('created_at', { ascending: false });
    
    const { data: usersWithRoles, error } = await query;
    
    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users data' },
        { status: 500 }
      );
    }
    
    type RawUserRoleRecord = UserRoleWithProfile & { profiles?: UserProfileSummary[] | null };
    const rawUserRoleRecords = (usersWithRoles ?? []) as RawUserRoleRecord[];

    const userRoleRecords: UserRoleWithProfile[] = rawUserRoleRecords.map((record) => ({
      user_id: record.user_id,
      role: record.role,
      created_at: record.created_at,
      updated_at: record.updated_at,
      profiles: record.profiles?.[0] ?? null,
    }));

    const usersWithStats: UserWithStats[] = await Promise.all(
      userRoleRecords.map(async (userRole) => {
        const userId = userRole.user_id;
        
        // Get user's booking count
        const { count: bookingCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        
        // Get user's total spending
        const { data: payments } = await supabase
          .from('payments')
          .select('amount')
          .eq('user_id', userId)
          .eq('status', 'succeeded');
        
        const paymentSummaries = (payments ?? []) as PaymentSummary[];
        const totalSpending = paymentSummaries.reduce((sum, payment) => {
          return sum + parseAmount(payment.amount);
        }, 0);
        
        // Get user's points
        const { data: userPoints } = await supabase
          .from('user_points')
          .select('total_points, current_level')
          .eq('user_id', userId)
          .single();
        
        return {
          ...userRole,
          stats: {
            bookingCount: bookingCount || 0,
            totalSpending,
            totalPoints: userPoints?.total_points || 0,
            currentLevel: userPoints?.current_level || 1,
          },
        };
      })
    );
    
    // Calculate summary statistics
    const totalUsers = userRoleRecords.length;
    
    // Group by role
    const byRole = userRoleRecords.reduce<Record<string, number>>((acc, userRole) => {
      const role = userRole.role || 'unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate total spending across all users
    const totalSpending = usersWithStats.reduce((sum, user) => {
      return sum + user.stats.totalSpending;
    }, 0);
    
    // Calculate total bookings
    const totalBookings = usersWithStats.reduce((sum, user) => {
      return sum + user.stats.bookingCount;
    }, 0);
    
    // Group by date for chart data
    const byDate: Record<string, number> = {};
    for (const userRole of userRoleRecords) {
      const date = new Date(userRole.created_at).toISOString().split('T')[0];
      byDate[date] = (byDate[date] || 0) + 1;
    }
    
    // Group by month for monthly trends
    const byMonth: Record<string, number> = {};
    for (const userRole of userRoleRecords) {
      const date = new Date(userRole.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
    }
    
    // Get top spenders
    const topSpenders = usersWithStats
      .filter((user) => user.stats.totalSpending > 0)
      .sort((a, b) => b.stats.totalSpending - a.stats.totalSpending)
      .slice(0, 10)
      .map((user) => ({
        user_id: user.user_id,
        username: user.profiles?.username,
        full_name: user.profiles?.full_name,
        totalSpending: user.stats.totalSpending,
        bookingCount: user.stats.bookingCount,
      }));
    
    // Get most active users (by bookings)
    const mostActiveUsers = usersWithStats
      .filter((user) => user.stats.bookingCount > 0)
      .sort((a, b) => b.stats.bookingCount - a.stats.bookingCount)
      .slice(0, 10)
      .map((user) => ({
        user_id: user.user_id,
        username: user.profiles?.username,
        full_name: user.profiles?.full_name,
        bookingCount: user.stats.bookingCount,
        totalSpending: user.stats.totalSpending,
      }));
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          totalSpending,
          totalBookings,
          byRole,
        },
        users: usersWithStats,
        charts: {
          byDate,
          byMonth,
        },
        topSpenders,
        mostActiveUsers,
        filters: {
          startDate: startDateParam,
          endDate: endDateParam,
          role: roleFilter,
        },
      },
    });
    
  } catch (error) {
    console.error('Get users report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate users report' },
      { status: 500 }
    );
  }
});

export { getUsersReportHandler as GET };

